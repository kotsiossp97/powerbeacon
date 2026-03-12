package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandleWOLRequiresRegistration(t *testing.T) {
	handler := NewWOLHandler(func() string { return "" })
	req := httptest.NewRequest(http.MethodPost, "/wol", strings.NewReader(`{"mac":"AA:BB:CC:DD:EE:FF","broadcast":"192.168.1.255","port":9}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	handler.HandleWOL(resp, req)

	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("HandleWOL() status = %d, want %d", resp.Code, http.StatusServiceUnavailable)
	}
}

func TestHandleWOLRequiresMatchingBearerToken(t *testing.T) {
	handler := NewWOLHandler(func() string { return "expected-token" })
	req := httptest.NewRequest(http.MethodPost, "/wol", strings.NewReader(`{"mac":"AA:BB:CC:DD:EE:FF","broadcast":"192.168.1.255","port":9}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer wrong-token")
	resp := httptest.NewRecorder()

	handler.HandleWOL(resp, req)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("HandleWOL() status = %d, want %d", resp.Code, http.StatusUnauthorized)
	}
}
