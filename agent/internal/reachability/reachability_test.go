package reachability

import (
	"context"
	"errors"
	"testing"
)

func TestNormalizeMAC(t *testing.T) {
	if got := normalizeMAC("AA:BB:CC:DD:EE:FF"); got != "aabbccddeeff" {
		t.Fatalf("normalizeMAC() = %q, want %q", got, "aabbccddeeff")
	}
}

func TestLookupIPFromARPOutput(t *testing.T) {
	tests := []struct {
		name   string
		output string
		mac    string
		want   string
	}{
		{
			name: "linux ip neigh",
			output: "192.168.1.10 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE\n",
			mac:    "aa:bb:cc:dd:ee:ff",
			want:   "192.168.1.10",
		},
		{
			name: "mac arp",
			output: "? (192.168.1.20) at aa-bb-cc-dd-ee-ff on en0 ifscope [ethernet]\n",
			mac:    "aa:bb:cc:dd:ee:ff",
			want:   "192.168.1.20",
		},
		{
			name: "windows arp",
			output: "  192.168.1.30           aa-bb-cc-dd-ee-ff     dynamic\n",
			mac:    "aa:bb:cc:dd:ee:ff",
			want:   "192.168.1.30",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := lookupIPFromARPOutput(tt.output, tt.mac); got != tt.want {
				t.Fatalf("lookupIPFromARPOutput() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDiscoverNetworkParsesNeighborTable(t *testing.T) {
	output := "192.168.1.10 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE\n192.168.1.11 dev eth0 lladdr 11:22:33:44:55:66 STALE\n"

	devices, err := parseNetworkEntries(output)
	if err != nil {
		t.Fatalf("parseNetworkEntries() unexpected error: %v", err)
	}
	if len(devices) != 2 {
		t.Fatalf("parseNetworkEntries() entries = %d, want %d", len(devices), 2)
	}
	if devices[0].IP != "192.168.1.10" || devices[0].MAC != "AA:BB:CC:DD:EE:FF" {
		t.Fatalf("first entry = %#v, want IP 192.168.1.10 and MAC AA:BB:CC:DD:EE:FF", devices[0])
	}
	if devices[1].IP != "192.168.1.11" || devices[1].MAC != "11:22:33:44:55:66" {
		t.Fatalf("second entry = %#v, want IP 192.168.1.11 and MAC 11:22:33:44:55:66", devices[1])
	}
}

func TestParseNetworkEntriesSkipsWindowsBroadcastAndMulticast(t *testing.T) {
	output := `Interface: 192.168.1.48 --- 0x6
  Internet Address      Physical Address      Type
  192.168.1.10           00-11-22-33-44-55     dynamic
  192.168.1.255          ff-ff-ff-ff-ff-ff     static
  224.0.0.22             01-00-5e-00-00-16     static
  239.255.255.250        01-00-5e-7f-ff-fa     static`

	devices, err := parseNetworkEntries(output)
	if err != nil {
		t.Fatalf("parseNetworkEntries() unexpected error: %v", err)
	}
	if len(devices) != 1 {
		t.Fatalf("parseNetworkEntries() entries = %d, want %d", len(devices), 1)
	}
	if devices[0].IP != "192.168.1.10" || devices[0].MAC != "00:11:22:33:44:55" {
		t.Fatalf("parseNetworkEntries() first entry = %#v, want IP 192.168.1.10 and MAC 00:11:22:33:44:55", devices[0])
	}
}

func TestResolveHostname(t *testing.T) {
	originalLookupAddr := lookupAddr
	t.Cleanup(func() {
		lookupAddr = originalLookupAddr
	})

	lookupAddr = func(_ context.Context, addr string) ([]string, error) {
		if addr != "192.168.1.10" {
			t.Fatalf("lookupAddr called with %q, want 192.168.1.10", addr)
		}
		return []string{"desktop.local.", ""}, nil
	}

	hostname := resolveHostname(context.Background(), "192.168.1.10")
	if hostname != "desktop.local" {
		t.Fatalf("resolveHostname() = %q, want %q", hostname, "desktop.local")
	}
}

func TestResolveHostnameReturnsEmptyOnLookupError(t *testing.T) {
	originalLookupAddr := lookupAddr
	t.Cleanup(func() {
		lookupAddr = originalLookupAddr
	})

	lookupAddr = func(_ context.Context, _ string) ([]string, error) {
		return nil, errors.New("lookup failed")
	}

	hostname := resolveHostname(context.Background(), "192.168.1.10")
	if hostname != "" {
		t.Fatalf("resolveHostname() = %q, want empty string", hostname)
	}
}

func TestExtractInterfaceFromNeighborLine(t *testing.T) {
	linuxLine := "192.168.1.10 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE"
	if got := extractInterfaceFromNeighborLine(linuxLine); got != "eth0" {
		t.Fatalf("extractInterfaceFromNeighborLine() = %q, want %q", got, "eth0")
	}

	macLine := "? (192.168.1.20) at aa-bb-cc-dd-ee-ff on en0 ifscope [ethernet]"
	if got := extractInterfaceFromNeighborLine(macLine); got != "en0" {
		t.Fatalf("extractInterfaceFromNeighborLine() = %q, want %q", got, "en0")
	}
}

func TestShouldSkipDiscoveryEntry(t *testing.T) {
	localIPs := map[string]struct{}{"172.18.0.3": {}}
	resolverIPs := map[string]struct{}{"192.168.65.7": {}}
	gatewayIPs := map[string]struct{}{"192.168.65.1": {}}

	tests := []struct {
		name  string
		entry NetworkEntry
		want  bool
	}{
		{
			name: "skip local agent IP",
			entry: NetworkEntry{IP: "172.18.0.3", Iface: "eth0"},
			want:  true,
		},
		{
			name: "skip resolver IP",
			entry: NetworkEntry{IP: "192.168.65.7", Iface: "eth0"},
			want:  true,
		},
		{
			name: "skip gateway IP",
			entry: NetworkEntry{IP: "192.168.65.1", Iface: "eth0"},
			want:  true,
		},
		{
			name: "skip excluded virtual interface",
			entry: NetworkEntry{IP: "172.18.0.4", Iface: "docker0"},
			want:  true,
		},
		{
			name: "skip ipv6 entry",
			entry: NetworkEntry{IP: "fe80::1", Iface: "eth0"},
			want:  true,
		},
		{
			name: "keep likely LAN device",
			entry: NetworkEntry{IP: "192.168.1.55", Iface: "eth0"},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := shouldSkipDiscoveryEntry(tt.entry, localIPs, resolverIPs, gatewayIPs)
			if got != tt.want {
				t.Fatalf("shouldSkipDiscoveryEntry() = %v, want %v", got, tt.want)
			}
		})
	}
}