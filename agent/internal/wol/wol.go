package wol

import (
	"encoding/hex"
	"fmt"
	"net"
	"strings"
)

const (
	// MagicPacketSize is the size of a WOL magic packet (6 bytes of 0xFF + 16 repetitions of MAC)
	MagicPacketSize = 102
	// DefaultPort is the default port for Wake-on-LAN
	DefaultPort = 9
)

// SendWakeOnLAN sends a Wake-on-LAN magic packet to the specified MAC address
// via the given broadcast address and port.
func SendWakeOnLAN(macAddress, broadcastAddr string, port int) error {
	// Parse and validate MAC address
	mac, err := parseMAC(macAddress)
	if err != nil {
		return fmt.Errorf("invalid MAC address: %w", err)
	}

	// Build magic packet
	packet := buildMagicPacket(mac)

	// Send packet via UDP broadcast
	if err := sendUDPBroadcast(packet, broadcastAddr, port); err != nil {
		return fmt.Errorf("failed to send WOL packet: %w", err)
	}

	return nil
}

// parseMAC parses a MAC address from various formats (AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, AABBCCDDEEFF)
func parseMAC(macAddress string) ([]byte, error) {
	// Remove common separators
	macAddress = strings.ReplaceAll(macAddress, ":", "")
	macAddress = strings.ReplaceAll(macAddress, "-", "")
	macAddress = strings.ToUpper(macAddress)

	// Validate length
	if len(macAddress) != 12 {
		return nil, fmt.Errorf("MAC address must be 12 hex characters")
	}

	// Decode hex string
	mac, err := hex.DecodeString(macAddress)
	if err != nil {
		return nil, fmt.Errorf("invalid hex in MAC address: %w", err)
	}

	if len(mac) != 6 {
		return nil, fmt.Errorf("MAC address must be 6 bytes")
	}

	return mac, nil
}

// buildMagicPacket constructs a Wake-on-LAN magic packet
// Format: 6 bytes of 0xFF followed by 16 repetitions of the target MAC address
func buildMagicPacket(mac []byte) []byte {
	packet := make([]byte, MagicPacketSize)

	// First 6 bytes: 0xFF
	for i := 0; i < 6; i++ {
		packet[i] = 0xFF
	}

	// Next 96 bytes: 16 repetitions of the MAC address
	for i := 0; i < 16; i++ {
		offset := 6 + (i * 6)
		copy(packet[offset:offset+6], mac)
	}

	return packet
}

// sendUDPBroadcast sends a UDP packet to the broadcast address
func sendUDPBroadcast(packet []byte, broadcastAddr string, port int) error {
	// Resolve broadcast address
	addr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", broadcastAddr, port))
	if err != nil {
		return fmt.Errorf("failed to resolve broadcast address: %w", err)
	}

	// Create UDP connection
	conn, err := net.DialUDP("udp", nil, addr)
	if err != nil {
		return fmt.Errorf("failed to create UDP connection: %w", err)
	}
	defer conn.Close()

	// Send the magic packet
	n, err := conn.Write(packet)
	if err != nil {
		return fmt.Errorf("failed to write packet: %w", err)
	}

	if n != len(packet) {
		return fmt.Errorf("incomplete packet sent: %d/%d bytes", n, len(packet))
	}

	return nil
}

// ValidateMAC validates a MAC address format
func ValidateMAC(macAddress string) error {
	_, err := parseMAC(macAddress)
	return err
}

// ValidateBroadcastAddr validates a broadcast address format
func ValidateBroadcastAddr(addr string) error {
	ip := net.ParseIP(addr)
	if ip == nil {
		return fmt.Errorf("invalid IP address")
	}
	return nil
}
