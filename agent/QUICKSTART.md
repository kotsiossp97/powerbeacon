# PowerBeacon Agent Quick Start

## For Developers

### 1. Install Go

Download and install Go 1.21 or higher from https://go.dev/dl/

Verify installation:
```bash
go version
```

### 2. Clone and Navigate

```bash
cd agent
```

### 3. Download Dependencies

```bash
go mod download
```

### 4. Build

```bash
# Build for your platform
go build -o powerbeacon-agent ./cmd/agent

# Or use the build script
./build.sh local
```

### 5. Run

```bash
# Start the agent (assumes backend is running on localhost:8000)
./powerbeacon-agent

# Or with custom backend URL
./powerbeacon-agent -backend http://your-backend:8000
```

### 6. Test

```bash
# Run all tests
go test ./...

# Send test WOL packet (in another terminal)
curl -X POST http://127.0.0.1:18080/wol \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "AA:BB:CC:DD:EE:FF",
    "broadcast": "192.168.1.255",
    "port": 9
  }'
```

## For End Users

### Linux/macOS

```bash
curl -fsSL http://your-powerbeacon-server/install-agent.sh | sudo bash
```

### Windows (PowerShell as Administrator)

```powershell
powershell -ExecutionPolicy Bypass -c "irm http://your-powerbeacon-server/install-agent.ps1 | iex"
```

## Configuration

The agent can be configured via command-line flags or environment variables:

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `-backend` | `BACKEND_URL` | `http://localhost:8000` | Backend server URL |
| `-port` | `AGENT_PORT` | `18080` | Agent API port |
| `-bind` | `AGENT_BIND` | `0.0.0.0` | Bind address |
| `-advertise-ip` | `AGENT_ADVERTISE_IP` | auto-detect | IP address to register with the backend |
| `-version` | - | - | Print version and exit |

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 PowerBeacon System                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐         ┌──────────────┐          │
│  │   Frontend  │────────▶│   Backend    │          │
│  │   (React)   │         │   (Python)   │          │
│  └─────────────┘         └──────┬───────┘          │
│                                  │                   │
│                                  │ HTTP              │
│                                  ▼                   │
│                          ┌──────────────┐           │
│                          │    Agent     │           │
│                          │    (Go)      │           │
│                          └──────┬───────┘           │
│                                  │                   │
│                                  │ UDP Broadcast     │
│                                  ▼                   │
│                          ┌──────────────┐           │
│                          │ Target Device│           │
│                          └──────────────┘           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## How It Works

1. **Agent Starts**: Detects network interfaces and broadcast addresses
2. **Registration**: Agent registers with backend, receives unique ID and token
3. **Heartbeat**: Agent sends heartbeat every 30 seconds to maintain connection
4. **Wake Request**: Backend sends WOL request to the agent's registered IP and port
5. **Packet Transmission**: Agent broadcasts magic packet on local network
6. **Device Wakes**: Target device receives packet and powers on

If the host has multiple interfaces or VPN adapters, set `AGENT_ADVERTISE_IP` so the backend stores the correct target for agent dispatch.

## Troubleshooting

### "Connection refused" error

- Ensure backend is running and accessible
- Check firewall rules
- Verify backend URL is correct

### "Permission denied" error (Linux)

- WOL packets may require elevated privileges on some systems
- Try running with sudo: `sudo ./powerbeacon-agent`

### Agent not detected in UI

- Check agent logs for registration errors
- Verify agent can reach backend
- Ensure backend is configured to accept agent registrations

### WOL not working

- Verify target device has WOL enabled in BIOS
- Check network cable is connected
- Ensure MAC address is correct
- Verify broadcast address matches your network

## Next Steps

- Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide
- Check [README.md](README.md) for features and usage
- Review code in `internal/` for implementation details

## Support

- Report issues on GitHub
- Check documentation at main project README
- Review architecture in ARCHITECTURE.md
