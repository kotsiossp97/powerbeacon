# PowerBeacon Agent Development Guide

## Prerequisites

- Go 1.21 or higher
- Make (optional, for using Makefile)

## Project Structure

```
agent/
├── cmd/
│   └── agent/
│       └── main.go              # Main entry point
├── internal/
│   ├── api/
│   │   └── wol_handler.go       # HTTP API handlers
│   ├── client/
│   │   └── backend.go           # Backend communication client
│   ├── network/
│   │   ├── broadcast.go         # Network interface detection
│   │   └── broadcast_test.go
│   └── wol/
│       ├── wol.go               # Wake-on-LAN packet generation
│       └── wol_test.go
├── install/
│   ├── install-agent.sh         # Linux installation script
│   └── install-agent.ps1        # Windows installation script
├── build.sh                     # Unix build script
├── build.ps1                    # Windows build script
├── Makefile                     # Make-based build system
├── go.mod                       # Go module definition
└── README.md
```

## Building

### Using Make (Linux/macOS)

```bash
# Build for all platforms
make build

# Build for specific platform
make linux
make windows
make darwin

# Build for local platform only
make local

# Clean build artifacts
make clean

# Run tests
make test

# Run locally
make run
```

### Using Build Scripts

**Linux/macOS:**
```bash
chmod +x build.sh
./build.sh all          # Build all platforms
./build.sh local        # Build for current platform
./build.sh docker-cross # Build using TARGETOS/TARGETARCH from env (Buildx use)
./build.sh clean        # Clean build artifacts
```

**Windows:**
```powershell
.\build.ps1 all         # Build all platforms
.\build.ps1 local       # Build for current platform
.\build.ps1 clean       # Clean build artifacts
```

### Manual Building

```bash
# Local platform
go build -o build/powerbeacon-agent ./cmd/agent

# Cross-compile for Linux
GOOS=linux GOARCH=amd64 go build -o build/powerbeacon-agent-linux-amd64 ./cmd/agent

# Cross-compile for Windows
GOOS=windows GOARCH=amd64 go build -o build/powerbeacon-agent-windows-amd64.exe ./cmd/agent

# Cross-compile for macOS
GOOS=darwin GOARCH=amd64 go build -o build/powerbeacon-agent-darwin-amd64 ./cmd/agent
GOOS=darwin GOARCH=arm64 go build -o build/powerbeacon-agent-darwin-arm64 ./cmd/agent
```

### Docker Buildx-oriented build script usage

```bash
TARGETOS=linux TARGETARCH=amd64 ./build.sh docker-cross
TARGETOS=linux TARGETARCH=arm64 ./build.sh docker-cross
```

This target is primarily used by the Dockerfile during `docker buildx build` so each platform receives a correctly compiled static agent binary.

## Running

### Development Mode

```bash
# Run with default settings
go run ./cmd/agent

# Run with custom backend URL
go run ./cmd/agent -backend http://192.168.1.100:8000

# Run with custom port
go run ./cmd/agent -port 18081

# Run with an explicit IP for backend registration
go run ./cmd/agent -advertise-ip 192.168.1.10

# Print version
go run ./cmd/agent -version
```

### Using Environment Variables

```bash
export BACKEND_URL=http://192.168.1.100:8000
export AGENT_PORT=18081
export AGENT_ADVERTISE_IP=192.168.1.10
go run ./cmd/agent
```

Set `AGENT_ADVERTISE_IP` when the host has multiple interfaces, VPN adapters, or a default route that is not reachable from the backend.

## Testing

### Run All Tests

```bash
go test ./...
```

### Run Tests with Coverage

```bash
go test -cover ./...
```

### Run Tests with Verbose Output

```bash
go test -v ./...
```

### Run Specific Package Tests

```bash
go test ./internal/wol
go test ./internal/network
```

## Architecture

### Startup Flow

1. **Initialize**: Parse flags, display version
2. **Network Discovery**: Detect network interfaces and broadcast addresses
3. **Backend Registration**: Register with PowerBeacon backend
4. **Start HTTP Server**: Listen on a backend-reachable address (default `0.0.0.0:18080`)
5. **Start Heartbeat**: Send heartbeat every 30 seconds
6. **Wait for Shutdown**: Handle graceful shutdown on SIGTERM/SIGINT

### Component Overview

#### WOL Package (`internal/wol`)

Responsible for:
- Parsing MAC addresses (supports multiple formats)
- Building WOL magic packets (6 bytes 0xFF + 16x MAC)
- Sending UDP broadcast packets
- Validating MAC and broadcast addresses

#### Network Package (`internal/network`)

Responsible for:
- Enumerating network interfaces
- Calculating broadcast addresses
- Getting hostname and local IP
- Detecting system network configuration

#### Client Package (`internal/client`)

Responsible for:
- Registering with backend
- Sending heartbeats
- Maintaining connection state
- Retry logic on failure

#### API Package (`internal/api`)

Responsible for:
- HTTP request handling
- Request validation
- Response formatting
- Authentication
- Logging middleware

## API Endpoints

### POST /wol

Send a Wake-on-LAN packet.

**Request:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "broadcast": "192.168.1.255",
  "port": 9
}
```

**Response:**
```json
{
  "success": true,
  "message": "WOL packet sent successfully"
}
```

### GET /health

Check agent health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### GET /info

Get agent information.

**Response:**
```json
{
  "name": "PowerBeacon Agent",
  "version": "1.0.0"
}
```

## Backend Communication

### Registration

**Endpoint:** `POST /api/agents/register`

**Request:**
```json
{
  "hostname": "desktop-pc",
  "ip": "192.168.1.10",
  "os": "linux",
  "version": "1.0.0"
}
```

**Response:**
```json
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "secure-token-here"
}
```

### Heartbeat

**Endpoint:** `POST /api/agents/heartbeat`

**Request:**
```json
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Headers:**
```
Authorization: Bearer secure-token-here
```

## Security

### Authentication

- Agent receives a bearer token during registration
- Token is included in all subsequent requests
- WOL API requires token authentication and rejects requests until registration succeeds

### Network Binding

- Agent defaults to `0.0.0.0` so the backend can reach the registered IP and port
- Restrict exposure with host firewall rules or an explicit `AGENT_BIND` value when appropriate
- Use `AGENT_ADVERTISE_IP` to control which IP address the backend stores for agent dispatch

### Packet Validation

- MAC addresses are validated before sending
- Broadcast addresses are validated
- Malformed requests are rejected

## Debugging

### Enable Verbose Logging

Logs are written to stdout. Redirect to file:

```bash
./powerbeacon-agent 2>&1 | tee agent.log
```

### Test WOL Functionality

```bash
# Send test WOL packet
curl -X POST http://127.0.0.1:18080/wol \
  -H "Authorization: Bearer <agent-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "AA:BB:CC:DD:EE:FF",
    "broadcast": "192.168.1.255",
    "port": 9
  }'
```

### Check Network Interfaces

Run the agent and check startup logs for detected interfaces:

```
Network Interfaces:
  eth0: 192.168.1.10 (Broadcast: 192.168.1.255)
  wlan0: 10.0.0.5 (Broadcast: 10.0.0.255)
```

## Performance

### Benchmarking

```bash
# Run benchmarks
go test -bench=. ./...

# Run benchmarks with memory profiling
go test -bench=. -benchmem ./...
```

### Expected Performance

- Startup time: < 100ms
- Memory usage: < 20MB
- WOL packet generation: < 1ms
- Packet throughput: > 1000 packets/sec

## Deployment

### Linux (systemd)

Agent should be installed as a systemd service:

```bash
sudo curl -fsSL http://your-backend/install-agent.sh | sudo bash
```

Service management:
```bash
sudo systemctl status powerbeacon-agent
sudo systemctl restart powerbeacon-agent
sudo journalctl -u powerbeacon-agent -f
```

### Windows

Agent should be installed as a Windows service:

```powershell
powershell -ExecutionPolicy Bypass -c "irm http://your-backend/install-agent.ps1 | iex"
```

Service management:
```powershell
Get-Service PowerBeaconAgent
Restart-Service PowerBeaconAgent
Get-EventLog -LogName Application -Source PowerBeaconAgent -Newest 20
```

### macOS

Agent can be run as a launchd service (implementation pending).

## Troubleshooting

### Agent Won't Start

1. Check if port 18080 is already in use
2. Verify backend URL is correct and reachable
3. Check network interfaces are detected

### Registration Fails

1. Verify backend is running and accessible
2. Check firewall rules
3. Ensure backend `/api/agents/register` endpoint is working

### WOL Packets Not Sent

1. Verify MAC address format
2. Check broadcast address is correct
3. Ensure target device supports WOL
4. Verify network interface has broadcast capability

### Service Won't Start (Linux)

```bash
# Check service status
sudo systemctl status powerbeacon-agent

# View logs
sudo journalctl -u powerbeacon-agent -n 50

# Test binary manually
sudo /usr/local/bin/powerbeacon-agent -version
```

### Service Won't Start (Windows)

```powershell
# Check service status
Get-Service PowerBeaconAgent | Format-List *

# View event logs
Get-EventLog -LogName Application -Source PowerBeaconAgent -Newest 20

# Test binary manually
& "$env:ProgramFiles\PowerBeacon\powerbeacon-agent.exe" -version
```

## Contributing

### Code Style

- Follow standard Go conventions
- Use `gofmt` for formatting
- Run `go vet` for static analysis
- Add tests for new functionality

### Testing Guidelines

- Write unit tests for all packages
- Aim for >80% code coverage
- Include edge cases and error handling
- Use table-driven tests where appropriate

### Pull Requests

1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with clear description

## License

See main project LICENSE file.
