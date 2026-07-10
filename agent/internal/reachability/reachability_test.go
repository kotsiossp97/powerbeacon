package reachability

import "testing"

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