package reachability

import (
	"context"
	"fmt"
	"net"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
	"time"
)

type ProbeRequest struct {
	MAC string `json:"mac"`
	IP  string `json:"ip,omitempty"`
}

type ProbeResponse struct {
	Online     bool   `json:"online"`
	ResolvedIP string `json:"resolved_ip,omitempty"`
	Message    string `json:"message,omitempty"`
}

var commandContext = exec.CommandContext

func ProbeDevice(ctx context.Context, macAddress, ipAddress string) (ProbeResponse, error) {
	macAddress = strings.TrimSpace(macAddress)
	if macAddress == "" {
		return ProbeResponse{}, fmt.Errorf("MAC address is required")
	}

	response := ProbeResponse{Online: false}
	candidates := make([]string, 0, 2)
	if ipAddress != "" {
		candidates = append(candidates, ipAddress)
	}

	if resolvedIP, err := lookupIPByMAC(ctx, macAddress); err == nil && resolvedIP != "" {
		if !containsString(candidates, resolvedIP) {
			candidates = append(candidates, resolvedIP)
		}
		response.ResolvedIP = resolvedIP
	}

	if len(candidates) == 0 {
		response.Message = "no IP address available"
		return response, nil
	}

	for _, candidate := range candidates {
		if err := pingHost(ctx, candidate); err == nil {
			response.Online = true
			response.ResolvedIP = candidate
			response.Message = "device responded to ping"
			return response, nil
		}
	}

	response.Message = "device did not respond to ping"
	return response, nil
}

func pingHost(ctx context.Context, ipAddress string) error {
	var command *exec.Cmd
	if runtime.GOOS == "windows" {
		command = commandContext(ctx, "ping", "-n", "1", ipAddress)
	} else {
		command = commandContext(ctx, "ping", "-c", "1", ipAddress)
	}

	commandOutput, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ping failed: %w: %s", err, strings.TrimSpace(string(commandOutput)))
	}

	return nil
}

func lookupIPByMAC(ctx context.Context, macAddress string) (string, error) {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		command = commandContext(ctx, "arp", "-a")
	case "darwin":
		command = commandContext(ctx, "arp", "-an")
	default:
		command = commandContext(ctx, "ip", "neigh")
	}

	commandOutput, err := command.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to query ARP cache: %w", err)
	}

	return lookupIPFromARPOutput(string(commandOutput), macAddress), nil
}

func lookupIPFromARPOutput(output, macAddress string) string {
	normalizedMAC := normalizeMAC(macAddress)
	for _, line := range strings.Split(output, "\n") {
		if !strings.Contains(normalizeMAC(line), normalizedMAC) {
			continue
		}

		if ip := extractIPFromLine(line); ip != "" {
			return ip
		}
	}

	return ""
}

func extractIPFromLine(line string) string {
	parenMatch := regexp.MustCompile(`\(([^)]+)\)`).FindStringSubmatch(line)
	if len(parenMatch) == 2 && net.ParseIP(parenMatch[1]) != nil {
		return parenMatch[1]
	}

	fields := strings.Fields(line)
	if len(fields) == 0 {
		return ""
	}

	firstField := strings.Trim(fields[0], "[]")
	if net.ParseIP(firstField) != nil {
		return firstField
	}

	return ""
}

func normalizeMAC(value string) string {
	cleaned := strings.ToLower(value)
	replacer := strings.NewReplacer(":", "", "-", "", ".", "", " ", "")
	return replacer.Replace(cleaned)
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}

func DefaultProbeTimeout() time.Duration {
	return 2 * time.Second
}