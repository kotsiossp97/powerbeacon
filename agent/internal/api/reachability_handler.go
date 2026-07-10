package api

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"

	"github.com/kotsios/powerbeacon-agent/internal/reachability"
	wol "github.com/kotsios/powerbeacon-agent/internal/wol"
)

type ReachabilityHandler struct {
	tokenProvider func() string
}

func NewReachabilityHandler(tokenProvider func() string) *ReachabilityHandler {
	return &ReachabilityHandler{tokenProvider: tokenProvider}
}

func (h *ReachabilityHandler) HandleReachability(w http.ResponseWriter, r *http.Request) {
	currentToken := ""
	if h.tokenProvider != nil {
		currentToken = h.tokenProvider()
	}

	if currentToken == "" {
		h.sendError(w, "agent not registered", http.StatusServiceUnavailable)
		return
	}

	token := r.Header.Get("Authorization")
	expectedToken := "Bearer " + currentToken
	if token != expectedToken {
		h.sendError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req reachability.ProbeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.MAC == "" {
		h.sendError(w, "MAC address is required", http.StatusBadRequest)
		return
	}

	if err := wol.ValidateMAC(req.MAC); err != nil {
		h.sendError(w, fmt.Sprintf("invalid MAC address: %v", err), http.StatusBadRequest)
		return
	}

	if req.IP != "" && net.ParseIP(req.IP) == nil {
		h.sendError(w, "invalid IP address", http.StatusBadRequest)
		return
	}

	response, err := reachability.ProbeDevice(r.Context(), req.MAC, req.IP)
	if err != nil {
		h.sendError(w, fmt.Sprintf("failed to probe device reachability: %v", err), http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, response, http.StatusOK)
}

func (h *ReachabilityHandler) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

func (h *ReachabilityHandler) sendJSON(w http.ResponseWriter, payload interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}