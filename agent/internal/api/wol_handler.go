package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/kotsios/powerbeacon-agent/internal/wol"
)

// WOLRequest represents a Wake-on-LAN request
type WOLRequest struct {
	MAC       string `json:"mac"`
	Broadcast string `json:"broadcast"`
	Port      int    `json:"port"`
}

// WOLResponse represents a Wake-on-LAN response
type WOLResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// WOLHandler handles Wake-on-LAN requests
type WOLHandler struct {
	tokenProvider func() string
}

// NewWOLHandler creates a new WOL handler
func NewWOLHandler(tokenProvider func() string) *WOLHandler {
	return &WOLHandler{
		tokenProvider: tokenProvider,
	}
}

// HandleWOL handles POST /wol requests
func (h *WOLHandler) HandleWOL(w http.ResponseWriter, r *http.Request) {
	currentToken := ""
	if h.tokenProvider != nil {
		currentToken = h.tokenProvider()
	}

	if currentToken == "" {
		h.sendError(w, "agent not registered", http.StatusServiceUnavailable)
		return
	}

	// Verify authentication token
	token := r.Header.Get("Authorization")
	expectedToken := "Bearer " + currentToken
	if token != expectedToken {
		h.sendError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request
	var req WOLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.MAC == "" {
		h.sendError(w, "MAC address is required", http.StatusBadRequest)
		return
	}

	if req.Broadcast == "" {
		h.sendError(w, "broadcast address is required", http.StatusBadRequest)
		return
	}

	// Default port
	if req.Port == 0 {
		req.Port = wol.DefaultPort
	}

	// Validate MAC address
	if err := wol.ValidateMAC(req.MAC); err != nil {
		h.sendError(w, fmt.Sprintf("invalid MAC address: %v", err), http.StatusBadRequest)
		return
	}

	// Validate broadcast address
	if err := wol.ValidateBroadcastAddr(req.Broadcast); err != nil {
		h.sendError(w, fmt.Sprintf("invalid broadcast address: %v", err), http.StatusBadRequest)
		return
	}

	// Send WOL packet
	log.Printf("Sending WOL packet to MAC=%s, Broadcast=%s, Port=%d", req.MAC, req.Broadcast, req.Port)
	if err := wol.SendWakeOnLAN(req.MAC, req.Broadcast, req.Port); err != nil {
		log.Printf("Failed to send WOL packet: %v", err)
		h.sendError(w, fmt.Sprintf("failed to send WOL packet: %v", err), http.StatusInternalServerError)
		return
	}

	// Send success response
	h.sendSuccess(w, "WOL packet sent successfully")
}

// HandleHealth handles GET /health requests
func (h *WOLHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":  "healthy",
		"version": "1.0.0",
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// HandleInfo handles GET /info requests
func (h *WOLHandler) HandleInfo(w http.ResponseWriter, r *http.Request) {
	// This could return agent information
	response := map[string]interface{}{
		"name":    "PowerBeacon Agent",
		"version": "1.0.0",
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// sendError sends an error response
func (h *WOLHandler) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

// sendSuccess sends a success response
func (h *WOLHandler) sendSuccess(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(WOLResponse{
		Success: true,
		Message: message,
	})
}

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.Method, r.RequestURI, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}

// CORSMiddleware adds CORS headers
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
