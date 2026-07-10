package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandleReachabilityRequiresRegistration(t *testing.T) {
	handler := NewReachabilityHandler(func() string { return "" })
	req := httptest.NewRequest(http.MethodPost, "/reachability", strings.NewReader(`{"mac":"AA:BB:CC:DD:EE:FF"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	handler.HandleReachability(resp, req)

	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("HandleReachability() status = %d, want %d", resp.Code, http.StatusServiceUnavailable)
	}
}

func TestHandleReachabilityRejectsInvalidIP(t *testing.T) {
	handler := NewReachabilityHandler(func() string { return "expected-token" })
	req := httptest.NewRequest(http.MethodPost, "/reachability", strings.NewReader(`{"mac":"AA:BB:CC:DD:EE:FF","ip":"not-an-ip"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer expected-token")
	resp := httptest.NewRecorder()

	handler.HandleReachability(resp, req)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("HandleReachability() status = %d, want %d", resp.Code, http.StatusBadRequest)
	}
}