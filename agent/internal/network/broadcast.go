package network

import (
	"fmt"
	"net"
	"os"
)

// InterfaceInfo contains information about a network interface
type InterfaceInfo struct {
	Name      string
	IPAddress string
	Netmask   string
	Broadcast string
}

// GetNetworkInterfaces returns information about all active network interfaces
func GetNetworkInterfaces() ([]InterfaceInfo, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, fmt.Errorf("failed to get network interfaces: %w", err)
	}

	var result []InterfaceInfo

	for _, iface := range interfaces {
		// Skip loopback and down interfaces
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			var mask net.IPMask

			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
				mask = v.Mask
			case *net.IPAddr:
				ip = v.IP
				// No mask available for IPAddr
				continue
			}

			// Only process IPv4 addresses
			if ip.To4() == nil {
				continue
			}

			// Calculate broadcast address
			broadcast := calculateBroadcast(ip, mask)

			info := InterfaceInfo{
				Name:      iface.Name,
				IPAddress: ip.String(),
				Netmask:   net.IP(mask).String(),
				Broadcast: broadcast.String(),
			}

			result = append(result, info)
		}
	}

	return result, nil
}

// GetDefaultBroadcastAddress returns the broadcast address of the first active interface
func GetDefaultBroadcastAddress() (string, error) {
	interfaces, err := GetNetworkInterfaces()
	if err != nil {
		return "", err
	}

	if len(interfaces) == 0 {
		return "", fmt.Errorf("no active network interfaces found")
	}

	return interfaces[0].Broadcast, nil
}

// calculateBroadcast calculates the broadcast address from IP and netmask
func calculateBroadcast(ip net.IP, mask net.IPMask) net.IP {
	ip = ip.To4()
	if ip == nil {
		return nil
	}

	broadcast := make(net.IP, len(ip))
	for i := range ip {
		broadcast[i] = ip[i] | ^mask[i]
	}

	return broadcast
}

// GetHostname returns the system hostname
func GetHostname() (string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return "unknown", err
	}
	return hostname, nil
}

// GetLocalIPAddress returns the first non-loopback IPv4 address
func GetLocalIPAddress() (string, error) {
	interfaces, err := GetNetworkInterfaces()
	if err != nil {
		return "", err
	}

	if len(interfaces) == 0 {
		return "", fmt.Errorf("no active network interfaces found")
	}

	return interfaces[0].IPAddress, nil
}

// IsBroadcastAddress checks if an IP address is a valid broadcast address
func IsBroadcastAddress(addr string) bool {
	ip := net.ParseIP(addr)
	if ip == nil {
		return false
	}

	// Broadcast addresses typically end in .255 or are all 1s in the host portion
	ip4 := ip.To4()
	if ip4 == nil {
		return false
	}

	// Check if last octet is 255 (common broadcast pattern)
	return ip4[3] == 255
}
