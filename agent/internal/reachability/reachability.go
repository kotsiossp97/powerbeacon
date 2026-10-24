package reachability

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
	"time"
)

type ProbeRequest struct {
	MAC string `json:"mac"`
	IP  string `json:"ip,omitempty"`
}

type ProbeResponse struct {
	Online     bool   `json:"online"`
	ResolvedIP string `json:"resolved_ip,omitempty"`
	Message    string `json:"message,omitempty"`
}

type NetworkEntry struct {
	IP       string `json:"ip"`
	MAC      string `json:"mac"`
	Online   bool   `json:"online"`
	Hostname string `json:"hostname,omitempty"`
	Iface    string `json:"-"`
}

type DiscoveryResponse struct {
	Devices []NetworkEntry `json:"devices"`
	Message string        `json:"message,omitempty"`
}

var commandContext = exec.CommandContext
var lookupAddr = net.DefaultResolver.LookupAddr

var excludedInterfacePrefixes = []string{
	"docker",
	"br-",
	"veth",
	"cni",
	"flannel",
	"virbr",
	"lo",
}

func ProbeDevice(ctx context.Context, macAddress, ipAddress string) (ProbeResponse, error) {
	log.Printf("Probing device with MAC: %s, IP: %s", macAddress, ipAddress)
	macAddress = strings.TrimSpace(macAddress)
	if macAddress == "" {
		return ProbeResponse{}, fmt.Errorf("MAC address is required")
	}

	response := ProbeResponse{Online: false}
	candidates := make([]string, 0, 2)
	if ipAddress != "" {
		candidates = append(candidates, ipAddress)
	}

	if resolvedIP, err := lookupIPByMAC(ctx, macAddress); err == nil && resolvedIP != "" {
		log.Printf("Resolved IP for MAC %s: %s", macAddress, resolvedIP)
		if !containsString(candidates, resolvedIP) {
			candidates = append(candidates, resolvedIP)
		}
		response.ResolvedIP = resolvedIP
	}

	if len(candidates) == 0 {
		response.Message = "no IP address available"
		return response, nil
	}

	for _, candidate := range candidates {
		if err := pingHost(ctx, candidate); err == nil {
			log.Printf("Device with MAC %s is online at IP %s", macAddress, candidate)
			response.Online = true
			response.ResolvedIP = candidate
			response.Message = "device responded to ping"
			return response, nil
		}
	}

	log.Printf("Device with MAC %s did not respond to ping", macAddress)
	response.Message = "device did not respond to ping"
	return response, nil
}

func pingHost(ctx context.Context, ipAddress string) error {
	var command *exec.Cmd
	if runtime.GOOS == "windows" {
		command = commandContext(ctx, "ping", "-n", "1", ipAddress)
	} else {
		command = commandContext(ctx, "ping", "-c", "1", ipAddress)
	}

	commandOutput, err := command.CombinedOutput()
	if err != nil {
		log.Printf("Ping to %s failed: %v", ipAddress, err)
		return fmt.Errorf("ping failed: %w: %s", err, strings.TrimSpace(string(commandOutput)))
	}

	return nil
}

func lookupIPByMAC(ctx context.Context, macAddress string) (string, error) {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		command = commandContext(ctx, "arp", "-a")
	case "darwin":
		command = commandContext(ctx, "arp", "-an")
	default:
		command = commandContext(ctx, "ip", "neigh")
	}

	commandOutput, err := command.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to query ARP cache: %w", err)
	}

	return lookupIPFromARPOutput(string(commandOutput), macAddress), nil
}

func lookupIPFromARPOutput(output, macAddress string) string {
	normalizedMAC := normalizeMAC(macAddress)
	for _, line := range strings.Split(output, "\n") {
		if !strings.Contains(normalizeMAC(line), normalizedMAC) {
			continue
		}

		if ip := extractIPFromLine(line); ip != "" {
			return ip
		}
	}

	return ""
}

func extractIPFromLine(line string) string {
	parenMatch := regexp.MustCompile(`\(([^)]+)\)`).FindStringSubmatch(line)
	if len(parenMatch) == 2 && net.ParseIP(parenMatch[1]) != nil {
		return parenMatch[1]
	}

	fields := strings.Fields(line)
	if len(fields) == 0 {
		return ""
	}

	firstField := strings.Trim(fields[0], "[]")
	if net.ParseIP(firstField) != nil {
		return firstField
	}

	return ""
}

func normalizeMAC(value string) string {
	cleaned := strings.ToLower(value)
	replacer := strings.NewReplacer(":", "", "-", "", ".", "", " ", "")
	return replacer.Replace(cleaned)
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}

func parseNetworkEntries(output string) ([]NetworkEntry, error) {
	entries := make([]NetworkEntry, 0)
	for _, line := range strings.Split(output, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		ip := extractIPFromLine(trimmed)
		if ip == "" {
			continue
		}

		mac := ""
		for _, field := range strings.Fields(trimmed) {
			candidate := strings.TrimSpace(field)
			if candidate == ip || candidate == "lladdr" || candidate == "at" || candidate == "on" || candidate == "ifscope" {
				continue
			}
			if _, err := net.ParseMAC(candidate); err == nil {
				mac = candidate
				break
			}
		}
		if mac == "" {
			continue
		}

		entries = append(entries, NetworkEntry{
			IP:     ip,
			MAC:    formatMAC(mac),
			Online: true,
			Iface:  extractInterfaceFromNeighborLine(trimmed),
		})
	}
	return entries, nil
}

func extractInterfaceFromNeighborLine(line string) string {
	fields := strings.Fields(line)
	for i := 0; i+1 < len(fields); i++ {
		if fields[i] == "dev" || fields[i] == "on" {
			return fields[i+1]
		}
	}

	return ""
}

func formatMAC(value string) string {
	cleaned := strings.ToLower(strings.TrimSpace(value))
	cleaned = strings.NewReplacer("-", "", ":", "", ".", "", " ", "").Replace(cleaned)
	if cleaned == "" {
		return ""
	}
	if len(cleaned) != 12 {
		return strings.ToUpper(value)
	}
	parts := make([]string, 0, 6)
	for i := 0; i < len(cleaned); i += 2 {
		parts = append(parts, cleaned[i:i+2])
	}
	return strings.ToUpper(strings.Join(parts, ":"))
}

func DiscoverNetwork(ctx context.Context) (DiscoveryResponse, error) {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		command = commandContext(ctx, "arp", "-a")
	case "darwin":
		command = commandContext(ctx, "arp", "-an")
	default:
		command = commandContext(ctx, "ip", "neigh")
	}

	output, err := command.CombinedOutput()
	if err != nil {
		return DiscoveryResponse{}, fmt.Errorf("failed to query neighbor table: %w", err)
	}

	entries, err := parseNetworkEntries(string(output))
	if err != nil {
		return DiscoveryResponse{}, err
	}

	localIPs := localInterfaceIPs()
	resolverIPs := resolverServerIPs()
	gatewayIPs := defaultGatewayIPs(ctx)
	filtered := make([]NetworkEntry, 0, len(entries))

	for i := range entries {
		if shouldSkipDiscoveryEntry(entries[i], localIPs, resolverIPs, gatewayIPs) {
			continue
		}

		if err := pingHost(ctx, entries[i].IP); err == nil {
			entries[i].Online = true
			entries[i].Hostname = resolveHostname(ctx, entries[i].IP)
		} else {
			entries[i].Online = false
		}

		entries[i].Iface = ""
		filtered = append(filtered, entries[i])
	}

	if len(filtered) == 0 {
		return DiscoveryResponse{Message: "no devices found on the local network"}, nil
	}

	return DiscoveryResponse{Devices: filtered, Message: "discovery complete"}, nil
}

func shouldSkipDiscoveryEntry(entry NetworkEntry, localIPs, resolverIPs, gatewayIPs map[string]struct{}) bool {
	ip := net.ParseIP(entry.IP)
	if ip == nil {
		return true
	}

	if ip.To4() == nil {
		return true
	}

	if _, isLocalIP := localIPs[entry.IP]; isLocalIP {
		return true
	}

	if _, isResolverIP := resolverIPs[entry.IP]; isResolverIP {
		return true
	}

	if _, isGatewayIP := gatewayIPs[entry.IP]; isGatewayIP {
		return true
	}

	if isExcludedInterface(entry.Iface) {
		return true
	}

	return false
}

func isExcludedInterface(iface string) bool {
	trimmed := strings.ToLower(strings.TrimSpace(iface))
	if trimmed == "" {
		return false
	}

	for _, prefix := range excludedInterfacePrefixes {
		if strings.HasPrefix(trimmed, prefix) {
			return true
		}
	}

	return false
}

func localInterfaceIPs() map[string]struct{} {
	ips := map[string]struct{}{}
	interfaces, err := net.Interfaces()
	if err != nil {
		return ips
	}

	for _, iface := range interfaces {
		addrs, addrErr := iface.Addrs()
		if addrErr != nil {
			continue
		}
		for _, addr := range addrs {
			ip, _, parseErr := net.ParseCIDR(addr.String())
			if parseErr != nil {
				continue
			}
			ips[ip.String()] = struct{}{}
		}
	}

	return ips
}

func resolverServerIPs() map[string]struct{} {
	servers := map[string]struct{}{}
	content, err := os.ReadFile("/etc/resolv.conf")
	if err != nil {
		return servers
	}

	for _, line := range strings.Split(string(content), "\n") {
		fields := strings.Fields(strings.TrimSpace(line))
		if len(fields) < 2 || fields[0] != "nameserver" {
			continue
		}

		ip := net.ParseIP(fields[1])
		if ip == nil {
			continue
		}
		servers[ip.String()] = struct{}{}
	}

	return servers
}

func defaultGatewayIPs(ctx context.Context) map[string]struct{} {
	gateways := map[string]struct{}{}
	if runtime.GOOS != "linux" {
		return gateways
	}

	command := commandContext(ctx, "ip", "route", "show", "default")
	output, err := command.CombinedOutput()
	if err != nil {
		return gateways
	}

	for _, line := range strings.Split(string(output), "\n") {
		fields := strings.Fields(strings.TrimSpace(line))
		for i := 0; i+1 < len(fields); i++ {
			if fields[i] != "via" {
				continue
			}

			ip := net.ParseIP(fields[i+1])
			if ip == nil {
				continue
			}
			gateways[ip.String()] = struct{}{}
		}
	}

	return gateways
}

func resolveHostname(ctx context.Context, ipAddress string) string {
	if ipAddress == "" {
		return ""
	}

	lookupCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()

	hostnames, err := lookupAddr(lookupCtx, ipAddress)
	if err != nil {
		return ""
	}

	for _, candidate := range hostnames {
		hostname := strings.TrimSuffix(strings.TrimSpace(candidate), ".")
		if hostname != "" {
			return hostname
		}
	}

	return ""
}

func DefaultProbeTimeout() time.Duration {
	return 2 * time.Second
}