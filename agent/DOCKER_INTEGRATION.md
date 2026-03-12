# Docker Compose Integration Example

This directory contains an example of how to run the PowerBeacon agent alongside the backend and frontend services.

## Important Note

**The agent MUST run on the host machine, NOT in a Docker container.**

This is because:
- Wake-on-LAN requires Layer 2 broadcast packets
- Docker's networking stack on Windows/macOS cannot send broadcast packets to the host network
- The agent needs direct access to physical network interfaces

## Development Setup

### 1. Start Backend and Frontend

From the project root:

```bash
docker-compose up -d
```

This starts:
- Backend API (port 8000)
- Frontend UI (port 3000)
- PostgreSQL database (port 5432)

### 2. Build the Agent

From the agent directory:

```bash
cd agent
go build -o powerbeacon-agent ./cmd/agent
```

### 3. Run the Agent on Host

```bash
# Linux/macOS
./powerbeacon-agent -backend http://localhost:8000

# Windows
.\powerbeacon-agent.exe -backend http://localhost:8000
```

The agent will:
1. Detect network interfaces
2. Register with the backend
3. Start sending heartbeats
4. Listen for WOL requests on the configured bind address (default `0.0.0.0:18080`)

## Backend Configuration

The backend uses the agent IP and port stored during registration. The agent therefore needs to register a reachable host IP and listen on a bind address that accepts connections for that IP.

### docker-compose.yml Configuration

```yaml
services:
  backend:
    # ... other configuration ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
```

    The `extra_hosts` entry can still help Docker Desktop resolve the host, but the actual WOL dispatch target comes from the agent record created at `POST /api/agents/register`.

## Testing the Integration

### 1. Check Agent Status

```bash
# Health check
curl http://localhost:18080/health

# Agent info
curl http://localhost:18080/info
```

### 2. Send Test WOL Packet

```bash
curl -X POST http://localhost:18080/wol \
  -H "Authorization: Bearer <agent-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "AA:BB:CC:DD:EE:FF",
    "broadcast": "192.168.1.255",
    "port": 9
  }'
```

### 3. Wake Device via Backend

```bash
# Get auth token first (if authentication is enabled)
TOKEN=$(curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  | jq -r '.access_token')

# Wake a device
curl -X POST http://localhost:8000/api/devices/1/wake \
  -H "Authorization: Bearer $TOKEN"
```

## Production Deployment

### Linux (systemd)

Install the agent as a service:

```bash
sudo curl -fsSL http://your-backend/install-agent.sh | sudo bash
```

The installer will:
1. Download the agent binary
2. Install it to `/usr/local/bin`
3. Create a systemd service
4. Start and enable the service

### Windows

Install the agent as a Windows service:

```powershell
powershell -ExecutionPolicy Bypass -c "irm http://your-backend/install-agent.ps1 | iex"
```

The installer will:
1. Download the agent binary
2. Install it to Program Files
3. Create a Windows service
4. Start and enable the service

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Docker Host                           │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │               Docker Network                        │     │
│  │                                                      │     │
│  │  ┌──────────┐    ┌──────────┐    ┌───────────┐   │     │
│  │  │ Frontend │───▶│ Backend  │───▶│ PostgreSQL│   │     │
│  │  │  :3000   │    │  :8000   │    │   :5432   │   │     │
│  │  └──────────┘    └────┬─────┘    └───────────┘   │     │
│  │                        │                            │     │
│  └────────────────────────┼────────────────────────────┘     │
│                           │                                   │
│                           │ http://<registered-agent-ip>:18080 │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PowerBeacon Agent                       │    │
│  │              (Host Process)                          │    │
│  │               0.0.0.0:18080                         │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         │ UDP Broadcast                      │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Physical Network Interface              │   │
│  │              (eth0, wlan0, etc.)                    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ Layer 2 Broadcast
                          ▼
                ┌──────────────────┐
                │  Target Device   │
                │  (WOL Enabled)   │
                └──────────────────┘
```

## Troubleshooting

### Backend Can't Reach Agent

**Symptom**: Backend logs show connection errors to agent

**Solution**:
1. Verify agent is running: `curl http://localhost:18080/health`
2. Check docker-compose.yml has `extra_hosts` configuration
3. Test from backend container:
   ```bash
   docker exec powerbeacon-backend curl http://host.docker.internal:18080/health
   ```

### Agent Can't Register with Backend

**Symptom**: Agent logs show "registration failed"

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check firewall rules
3. Ensure agent has correct backend URL
4. Check backend logs for registration endpoint errors

### WOL Packets Not Sent

**Symptom**: No errors but device doesn't wake

**Solution**:
1. Verify device has WOL enabled in BIOS/UEFI
2. Check device is connected via Ethernet (not Wi-Fi)
3. Verify MAC address is correct
4. Ensure broadcast address matches your network
5. Test with a WOL app from the same network

### Port Already in Use

**Symptom**: "address already in use" error

**Solution**:
1. Check if another agent is running: `ps aux | grep powerbeacon-agent`
2. Use different port: `./powerbeacon-agent -port 18081`
3. Kill existing process if needed

## Advanced Configuration

### Multiple Network Interfaces

If your host has multiple network interfaces, the agent will detect all of them. Check the agent logs on startup to see detected interfaces:

```
Network Interfaces:
  eth0: 192.168.1.10 (Broadcast: 192.168.1.255)
  wlan0: 10.0.0.5 (Broadcast: 10.0.0.255)
```

If the backend cannot reach the auto-detected interface, set an explicit advertise IP:

```bash
export AGENT_ADVERTISE_IP=192.168.1.10
./powerbeacon-agent -backend https://powerbeacon.example.com
```

### Custom Backend URL

For production deployments, set the backend URL:

```bash
# Via flag
./powerbeacon-agent -backend https://powerbeacon.example.com

# Via environment variable
export BACKEND_URL=https://powerbeacon.example.com
./powerbeacon-agent
```

### HTTPS Backend

If your backend uses HTTPS, ensure the agent can verify the certificate:

```bash
# Use HTTPS URL
./powerbeacon-agent -backend https://powerbeacon.example.com

# For self-signed certificates (not recommended for production)
# Modify the agent code to skip certificate verification (for testing only)
```

## Security Considerations

1. **Agent Binding**: Agent defaults to `0.0.0.0` so the backend can reach the advertised IP and port
2. **Authentication**: Agent uses bearer token from registration
3. **Network Exposure**: Restrict access with host firewall rules or a more specific `AGENT_BIND` value when possible
4. **Container Reachability**: Backend must be able to reach the agent at the IP and port the agent registered
5. **Privileges**: Agent may require elevated privileges on some systems for packet sending

## Performance Tips

1. **Resource Usage**: Agent uses <20MB RAM and minimal CPU
2. **Heartbeat Interval**: Default 30 seconds (configurable in code)
3. **Connection Pooling**: HTTP client reuses connections to backend
4. **Packet Sending**: Very low latency (<1ms typical)

## Next Steps

- Read [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow
- Review [README.md](README.md) for agent features
- Check [QUICKSTART.md](QUICKSTART.md) for quick setup
