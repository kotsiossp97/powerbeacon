package wol

import (
	"testing"
)

func TestParseMAC(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "Valid MAC with colons",
			input:   "AA:BB:CC:DD:EE:FF",
			wantErr: false,
		},
		{
			name:    "Valid MAC with hyphens",
			input:   "AA-BB-CC-DD-EE-FF",
			wantErr: false,
		},
		{
			name:    "Valid MAC without separators",
			input:   "AABBCCDDEEFF",
			wantErr: false,
		},
		{
			name:    "Lowercase MAC",
			input:   "aa:bb:cc:dd:ee:ff",
			wantErr: false,
		},
		{
			name:    "Invalid MAC - too short",
			input:   "AA:BB:CC:DD:EE",
			wantErr: true,
		},
		{
			name:    "Invalid MAC - too long",
			input:   "AA:BB:CC:DD:EE:FF:11",
			wantErr: true,
		},
		{
			name:    "Invalid MAC - invalid characters",
			input:   "XY:ZZ:CC:DD:EE:FF",
			wantErr: true,
		},
		{
			name:    "Empty MAC",
			input:   "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mac, err := parseMAC(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseMAC() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(mac) != 6 {
				t.Errorf("parseMAC() returned MAC with length %d, expected 6", len(mac))
			}
		})
	}
}

func TestBuildMagicPacket(t *testing.T) {
	mac := []byte{0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}
	packet := buildMagicPacket(mac)

	// Check packet size
	if len(packet) != MagicPacketSize {
		t.Errorf("buildMagicPacket() packet size = %d, expected %d", len(packet), MagicPacketSize)
	}

	// Check first 6 bytes are 0xFF
	for i := 0; i < 6; i++ {
		if packet[i] != 0xFF {
			t.Errorf("buildMagicPacket() byte %d = %x, expected 0xFF", i, packet[i])
		}
	}

	// Check MAC address is repeated 16 times
	for i := 0; i < 16; i++ {
		offset := 6 + (i * 6)
		for j := 0; j < 6; j++ {
			if packet[offset+j] != mac[j] {
				t.Errorf("buildMagicPacket() MAC repetition %d, byte %d = %x, expected %x",
					i, j, packet[offset+j], mac[j])
			}
		}
	}
}

func TestValidateMAC(t *testing.T) {
	tests := []struct {
		name    string
		mac     string
		wantErr bool
	}{
		{"Valid MAC", "AA:BB:CC:DD:EE:FF", false},
		{"Invalid MAC", "invalid", true},
		{"Empty MAC", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateMAC(tt.mac)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateMAC() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateBroadcastAddr(t *testing.T) {
	tests := []struct {
		name    string
		addr    string
		wantErr bool
	}{
		{"Valid IP", "192.168.1.255", false},
		{"Valid IP without broadcast", "10.0.0.1", false},
		{"Invalid IP", "invalid", true},
		{"Empty IP", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateBroadcastAddr(tt.addr)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateBroadcastAddr() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
