package client

import (
	"errors"
	"testing"
)

func TestResolveRegistrationIPUsesConfiguredIP(t *testing.T) {
	ip, err := resolveRegistrationIP("192.168.1.50", func() (string, error) {
		return "10.0.0.5", nil
	})
	if err != nil {
		t.Fatalf("resolveRegistrationIP() unexpected error = %v", err)
	}
	if ip != "192.168.1.50" {
		t.Fatalf("resolveRegistrationIP() = %q, want %q", ip, "192.168.1.50")
	}
}

func TestResolveRegistrationIPRejectsInvalidConfiguredIP(t *testing.T) {
	_, err := resolveRegistrationIP("not-an-ip", func() (string, error) {
		return "10.0.0.5", nil
	})
	if err == nil {
		t.Fatal("resolveRegistrationIP() expected error for invalid configured IP")
	}
}

func TestResolveRegistrationIPUsesAutoDetectedIP(t *testing.T) {
	ip, err := resolveRegistrationIP("", func() (string, error) {
		return "10.0.0.5", nil
	})
	if err != nil {
		t.Fatalf("resolveRegistrationIP() unexpected error = %v", err)
	}
	if ip != "10.0.0.5" {
		t.Fatalf("resolveRegistrationIP() = %q, want %q", ip, "10.0.0.5")
	}
}

func TestResolveRegistrationIPReturnsAutoDetectError(t *testing.T) {
	wantErr := errors.New("no active network interfaces found")
	_, err := resolveRegistrationIP("", func() (string, error) {
		return "", wantErr
	})
	if err == nil {
		t.Fatal("resolveRegistrationIP() expected error")
	}
}
