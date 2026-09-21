package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandleWOLRequiresRegistration(t *testing.T) {
	handler := NewWOLHandler(func() string { return "" }, "1.0.4")
	req := httptest.NewRequest(http.MethodPost, "/wol", strings.NewReader(`{"mac":"AA:BB:CC:DD:EE:FF","broadcast":"192.168.1.255","port":9}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	handler.HandleWOL(resp, req)

	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("HandleWOL() status = %d, want %d", resp.Code, http.StatusServiceUnavailable)
	}
}

func TestHandleWOLRequiresMatchingBearerToken(t *testing.T) {
	handler := NewWOLHandler(func() string { return "expected-token" }, "1.2.3")
	req := httptest.NewRequest(http.MethodPost, "/wol", strings.NewReader(`{"mac":"AA:BB:CC:DD:EE:FF","broadcast":"192.168.1.255","port":9}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer wrong-token")
	resp := httptest.NewRecorder()

	handler.HandleWOL(resp, req)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("HandleWOL() status = %d, want %d", resp.Code, http.StatusUnauthorized)
	}
}

func TestHandleHealthUsesConfiguredVersion(t *testing.T) {
	handler := NewWOLHandler(nil, "9.8.7")
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	resp := httptest.NewRecorder()

	handler.HandleHealth(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("HandleHealth() status = %d, want %d", resp.Code, http.StatusOK)
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(resp.Body.Bytes(), &payload); err != nil {
		t.Fatalf("HandleHealth() decode JSON: %v", err)
	}
	if payload["version"] != "9.8.7" {
		t.Fatalf("HandleHealth() version = %v, want %q", payload["version"], "9.8.7")
	}
}

func TestHandleInfoUsesConfiguredVersion(t *testing.T) {
	handler := NewWOLHandler(nil, "9.8.7")
	req := httptest.NewRequest(http.MethodGet, "/info", nil)
	resp := httptest.NewRecorder()

	handler.HandleInfo(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("HandleInfo() status = %d, want %d", resp.Code, http.StatusOK)
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(resp.Body.Bytes(), &payload); err != nil {
		t.Fatalf("HandleInfo() decode JSON: %v", err)
	}
	if payload["version"] != "9.8.7" {
		t.Fatalf("HandleInfo() version = %v, want %q", payload["version"], "9.8.7")
	}
}
