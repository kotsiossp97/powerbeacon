# PowerBeacon Agent

The PowerBeacon Agent is a lightweight, cross-platform service that executes Wake-on-LAN operations from the host network.

## Features

- **Wake-on-LAN Broadcasting**: Sends magic packets to wake devices on the local network
- **Auto-Registration**: Automatically registers with the PowerBeacon backend
- **Heartbeat System**: Maintains connection and health status with the backend
- **Network Detection**: Automatically detects network interfaces and broadcast addresses
- **Agent API**: Exposes an authenticated HTTP API for WOL operations
- **Cross-Platform**: Supports Windows, Linux, and macOS

## Architecture

The agent operates as a system service that:
1. Detects network interfaces and broadcast addresses
2. Registers with the PowerBeacon backend
3. Maintains a heartbeat connection
4. Exposes an HTTP API on a backend-reachable bind address (default `0.0.0.0:18080`)
5. Sends WOL packets upon request

## Building

### Prerequisites

- Go 1.21 or higher

### Build for current platform

```bash
go build -o powerbeacon-agent ./cmd/agent
```

### Cross-compilation

Linux:
```bash
GOOS=linux GOARCH=amd64 go build -o build/powerbeacon-agent-linux-amd64 ./cmd/agent
```

Windows:
```bash
GOOS=windows GOARCH=amd64 go build -o build/powerbeacon-agent-windows-amd64.exe ./cmd/agent
```

macOS:
```bash
GOOS=darwin GOARCH=amd64 go build -o build/powerbeacon-agent-darwin-amd64 ./cmd/agent
GOOS=darwin GOARCH=arm64 go build -o build/powerbeacon-agent-darwin-arm64 ./cmd/agent
```

## Installation

The agent should be installed as a system service. Installation scripts are provided by the PowerBeacon backend.

### Linux (systemd)

```bash
curl -fsSL http://your-server/install-agent.sh | bash
```

### Windows

```powershell
powershell -ExecutionPolicy Bypass -c "irm http://your-server/install-agent.ps1 | iex"
```

## Configuration

The agent is configured via environment variables:

- `BACKEND_URL`: URL of the PowerBeacon backend (default: `http://localhost:8000`)
- `AGENT_PORT`: Port for the agent API server (default: `18080`)
- `AGENT_BIND`: Bind address for the agent API server (default: `0.0.0.0`)
- `AGENT_ADVERTISE_IP`: Explicit IP address to register with the backend when auto-detection picks the wrong interface

## API

### Wake Device

```
POST /wol
Content-Type: application/json

{
  "mac": "AA:BB:CC:DD:EE:FF",
  "broadcast": "192.168.1.255",
  "port": 9
}
```

### Health Check

```
GET /health
```

## Security

- The agent requires bearer token authentication for WOL requests
- The default bind address allows backend-to-agent communication; use host firewall rules to restrict exposure to trusted networks

## Performance

- Startup time: < 100ms
- Memory usage: < 20MB
- Packet throughput: > 1000 WOL packets/sec
