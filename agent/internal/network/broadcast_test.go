package network

import (
	"net"
	"testing"
)

func TestCalculateBroadcast(t *testing.T) {
	tests := []struct {
		name      string
		ip        string
		mask      string
		wantBcast string
	}{
		{
			name:      "Class C network",
			ip:        "192.168.1.10",
			mask:      "255.255.255.0",
			wantBcast: "192.168.1.255",
		},
		{
			name:      "Class B network",
			ip:        "172.16.10.5",
			mask:      "255.255.0.0",
			wantBcast: "172.16.255.255",
		},
		{
			name:      "Class A network",
			ip:        "10.1.2.3",
			mask:      "255.0.0.0",
			wantBcast: "10.255.255.255",
		},
		{
			name:      "/30 subnet",
			ip:        "192.168.1.1",
			mask:      "255.255.255.252",
			wantBcast: "192.168.1.3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ip := net.ParseIP(tt.ip).To4()
			mask := net.IPMask(net.ParseIP(tt.mask).To4())

			broadcast := calculateBroadcast(ip, mask)

			if broadcast.String() != tt.wantBcast {
				t.Errorf("calculateBroadcast() = %v, want %v", broadcast.String(), tt.wantBcast)
			}
		})
	}
}

func TestIsBroadcastAddress(t *testing.T) {
	tests := []struct {
		name string
		addr string
		want bool
	}{
		{"Typical broadcast", "192.168.1.255", true},
		{"Another broadcast", "10.0.0.255", true},
		{"Not broadcast", "192.168.1.1", false},
		{"Not broadcast", "10.0.0.1", false},
		{"Invalid IP", "invalid", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsBroadcastAddress(tt.addr); got != tt.want {
				t.Errorf("IsBroadcastAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetNetworkInterfaces(t *testing.T) {
	// This is a basic integration test that checks if the function runs without errors
	interfaces, err := GetNetworkInterfaces()
	if err != nil {
		t.Errorf("GetNetworkInterfaces() error = %v", err)
		return
	}

	// We should have at least some interfaces (unless running in a very restricted environment)
	t.Logf("Found %d network interfaces", len(interfaces))

	for _, iface := range interfaces {
		t.Logf("Interface: %s, IP: %s, Broadcast: %s", iface.Name, iface.IPAddress, iface.Broadcast)

		// Validate that IP is a valid IP address
		if net.ParseIP(iface.IPAddress) == nil {
			t.Errorf("Invalid IP address: %s", iface.IPAddress)
		}

		// Validate that broadcast is a valid IP address
		if net.ParseIP(iface.Broadcast) == nil {
			t.Errorf("Invalid broadcast address: %s", iface.Broadcast)
		}
	}
}

func TestGetLocalIPAddress(t *testing.T) {
	// This test checks if we can get a local IP address
	ip, err := GetLocalIPAddress()
	if err != nil {
		// It's okay if we don't have network interfaces in test environment
		t.Skipf("Skipping test - no network interfaces available: %v", err)
		return
	}

	// Validate that the returned IP is valid
	if net.ParseIP(ip) == nil {
		t.Errorf("GetLocalIPAddress() returned invalid IP: %s", ip)
	}

	t.Logf("Local IP address: %s", ip)
}

func TestGetDefaultBroadcastAddress(t *testing.T) {
	// This test checks if we can get a default broadcast address
	broadcast, err := GetDefaultBroadcastAddress()
	if err != nil {
		// It's okay if we don't have network interfaces in test environment
		t.Skipf("Skipping test - no network interfaces available: %v", err)
		return
	}

	// Validate that the returned broadcast is valid
	if net.ParseIP(broadcast) == nil {
		t.Errorf("GetDefaultBroadcastAddress() returned invalid IP: %s", broadcast)
	}

	t.Logf("Default broadcast address: %s", broadcast)
}
