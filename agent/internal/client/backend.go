package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/kotsios/powerbeacon-agent/internal/network"
)

const (
	// DefaultHeartbeatInterval is the default interval for sending heartbeats
	DefaultHeartbeatInterval = 30 * time.Second
	// DefaultRetryInterval is the default interval for retrying registration
	DefaultRetryInterval = 10 * time.Second
)

// BackendClient manages communication with the PowerBeacon backend
type BackendClient struct {
	backendURL        string
	agentID           string
	token             string
	listenPort        int
	version           string
	advertiseIP       string
	httpClient        *http.Client
	heartbeatInterval time.Duration
	retryInterval     time.Duration
	mu                sync.RWMutex
}

// RegistrationRequest represents an agent registration request
type RegistrationRequest struct {
	Hostname string `json:"hostname"`
	IP       string `json:"ip"`
	Port     int    `json:"port"`
	OS       string `json:"os"`
	Version  string `json:"version"`
}

// RegistrationResponse represents an agent registration response
type RegistrationResponse struct {
	AgentID string `json:"agent_id"`
	Token   string `json:"token"`
}

// HeartbeatRequest represents an agent heartbeat request
type HeartbeatRequest struct {
	AgentID string `json:"agent_id"`
}

// NewBackendClient creates a new backend client
func NewBackendClient(backendURL string, listenPort int, version string, advertiseIP string) *BackendClient {
	return &BackendClient{
		backendURL:  backendURL,
		listenPort:  listenPort,
		version:     version,
		advertiseIP: advertiseIP,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		heartbeatInterval: DefaultHeartbeatInterval,
		retryInterval:     DefaultRetryInterval,
	}
}

// Register registers the agent with the backend
func (c *BackendClient) Register() error {
	hostname, err := network.GetHostname()
	if err != nil {
		hostname = "unknown"
	}

	ip, err := resolveRegistrationIP(c.advertiseIP, network.GetLocalIPAddress)
	if err != nil {
		return err
	}

	req := RegistrationRequest{
		Hostname: hostname,
		IP:       ip,
		Port:     c.listenPort,
		OS:       runtime.GOOS,
		Version:  c.version,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal registration request: %w", err)
	}

	resp, err := c.httpClient.Post(
		c.backendURL+"/api/agents/register",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to send registration request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("registration failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var regResp RegistrationResponse
	if err := json.NewDecoder(resp.Body).Decode(&regResp); err != nil {
		return fmt.Errorf("failed to decode registration response: %w", err)
	}

	c.mu.Lock()
	c.agentID = regResp.AgentID
	c.token = regResp.Token
	c.mu.Unlock()

	log.Printf("Successfully registered with backend: AgentID=%s", c.agentID)
	return nil
}

func resolveRegistrationIP(advertiseIP string, autoDetect func() (string, error)) (string, error) {
	if advertiseIP != "" {
		if net.ParseIP(advertiseIP) == nil {
			return "", fmt.Errorf("invalid configured advertise IP %q", advertiseIP)
		}
		return advertiseIP, nil
	}

	ip, err := autoDetect()
	if err != nil {
		return "", fmt.Errorf("failed to determine local IP: %w", err)
	}
	if net.ParseIP(ip) == nil {
		return "", fmt.Errorf("auto-detected IP %q is invalid", ip)
	}

	return ip, nil
}

// SendHeartbeat sends a heartbeat to the backend
func (c *BackendClient) SendHeartbeat() error {
	agentID := c.GetAgentID()
	if agentID == "" {
		return fmt.Errorf("agent not registered")
	}

	req := HeartbeatRequest{
		AgentID: agentID,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal heartbeat request: %w", err)
	}

	httpReq, err := http.NewRequest(
		"POST",
		c.backendURL+"/api/agents/heartbeat",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to create heartbeat request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	token := c.GetToken()
	if token != "" {
		httpReq.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("heartbeat failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// StartHeartbeat starts the heartbeat loop
func (c *BackendClient) StartHeartbeat(stopCh <-chan struct{}) {
	ticker := time.NewTicker(c.heartbeatInterval)
	defer ticker.Stop()

	log.Printf("Starting heartbeat loop (interval: %v)", c.heartbeatInterval)

	for {
		select {
		case <-ticker.C:
			if err := c.SendHeartbeat(); err != nil {
				log.Printf("Heartbeat failed: %v", err)
			} else {
				log.Printf("Heartbeat sent successfully")
			}
		case <-stopCh:
			log.Println("Stopping heartbeat loop")
			return
		}
	}
}

// StartWithRetry starts the agent with automatic retry on failure
func (c *BackendClient) StartWithRetry(stopCh <-chan struct{}) error {
	for {
		select {
		case <-stopCh:
			return fmt.Errorf("stopped before registration")
		default:
			if err := c.Register(); err != nil {
				log.Printf("Registration failed: %v. Retrying in %v...", err, c.retryInterval)
				time.Sleep(c.retryInterval)
				continue
			}
			return nil
		}
	}
}

// GetAgentID returns the agent ID
func (c *BackendClient) GetAgentID() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.agentID
}

// GetToken returns the agent authentication token
func (c *BackendClient) GetToken() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.token
}

// IsRegistered checks if the agent is registered
func (c *BackendClient) IsRegistered() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.agentID != "" && c.token != ""
}
