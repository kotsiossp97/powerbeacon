# PowerBeacon Implementation Specification

## Overview

PowerBeacon is a **self-hosted Wake-on-LAN orchestration platform** designed to:

* manage devices capable of Wake-on-LAN
* wake devices across different networks
* provide a web UI and API
* operate reliably across **Windows, Linux, and macOS**
* work with **Docker-based deployments**

The system consists of three main components:

1. **Backend API**
2. **Frontend Web UI**
3. **PowerBeacon Agent**

The agent is responsible for **executing Wake-on-LAN packets from the host network**, avoiding Docker networking limitations.

---

# System Architecture

```
User
 │
 ▼
Frontend (React)
 │
 ▼
Backend API (Python)
 │
 ▼
Agent API (local host service)
 │
 ▼
Wake-on-LAN Broadcast
 │
 ▼
Target Device
```

---

# Repository Structure

The project must follow this structure:

```
powerbeacon
├── backend
│   ├── powerbeacon
│   │   ├── core
│   │   ├── crud
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   │   ├── agent_service.py
│   │   │   ├── wol_service.py
│   │   │   └── device_service.py
│   │   └── __init__.py
│   ├── main.py
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── auth
│   │   ├── components
│   │   ├── routes
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── agent
│   ├── cmd
│   │   └── agent
│   │       └── main.go
│   ├── internal
│   │   ├── api
│   │   │   └── wol_handler.go
│   │   ├── wol
│   │   │   └── wol.go
│   │   └── network
│   │       └── broadcast.go
│   ├── go.mod
│   └── build
│
├── deploy
│   ├── docker-compose.yml
│   └── install
│       ├── install-agent.sh
│       └── install-agent.ps1
│
└── README.md
```

---

# Backend Specification

Backend responsibilities:

* device management
* agent management
* WOL task dispatch
* authentication
* API for frontend

The backend **must never send WOL packets directly**.

All WOL operations must be delegated to the agent.

---

# Backend API

## Register Agent

```
POST /api/agents/register
```

Request:

```json
{
  "hostname": "desktop",
  "ip": "192.168.1.5",
  "os": "linux",
  "version": "1.0.0"
}
```

Response:

```json
{
  "agent_id": "uuid",
  "token": "secure-token"
}
```

---

## Agent Heartbeat

```
POST /api/agents/heartbeat
```

Request:

```json
{
  "agent_id": "uuid"
}
```

---

## Wake Device

```
POST /api/devices/{device_id}/wake
```

Backend will:

1. determine the correct agent
2. dispatch WOL task

---

# Database Models

## Device

```
id
name
mac_address
broadcast_address
agent_id
created_at
```

## Agent

```
id
hostname
ip
os
version
last_seen
status
```

---

# Backend Services

### agent_service.py

Responsibilities:

* register agents
* update heartbeat
* retrieve agent by network

---

### wol_service.py

Responsibilities:

* validate MAC address
* send WOL command to agent

Example:

```python
async def wake_device(mac, broadcast):
    await agent_client.post("/wol", json={
        "mac": mac,
        "broadcast": broadcast,
        "port": 9
    })
```

---

# Agent Specification

The PowerBeacon Agent must be implemented in **Go**.

Goals:

* minimal footprint
* cross-platform
* single static binary
* no external dependencies

---

# Agent Responsibilities

The agent must:

* send WOL packets
* register with backend
* maintain heartbeat
* expose local API
* auto-detect broadcast addresses

---

# Agent Startup Flow

```
start agent
detect network interfaces
detect broadcast address
register with backend
start HTTP server
start heartbeat loop
```

---

# Agent HTTP API

## Wake-on-LAN

```
POST /wol
```

Request:

```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "broadcast": "192.168.1.255",
  "port": 9
}
```

---

# WOL Packet Implementation

The magic packet structure:

```
6 bytes FF
16 repetitions of MAC address
```

Total packet size:

```
102 bytes
```

Agent must send packet via UDP broadcast.

---

# Broadcast Detection

Agent must detect broadcast addresses from network interfaces.

Example:

```
IP: 192.168.1.10
Subnet: 255.255.255.0
Broadcast: 192.168.1.255
```

Implementation should:

* enumerate interfaces
* compute broadcast

---

# Agent Security

The agent must:

* bind only to localhost

```
127.0.0.1:18080
```

* require authentication token for requests

---

# Agent Heartbeat

Every 30 seconds:

```
POST /api/agents/heartbeat
```

---

# Agent Task Polling

Optional implementation:

```
GET /api/agents/tasks
```

Response:

```json
{
  "tasks": [
    {
      "type": "wol",
      "mac": "AA:BB:CC:DD:EE:FF"
    }
  ]
}
```

---

# Frontend Specification

Frontend implemented with:

* React
* TypeScript

Responsibilities:

* authentication
* device management
* agent management
* wake devices
* install instructions

---

# Agent Installation UI

UI must detect if agent is present.

Call:

```
GET /agent/health
```

If not detected show:

```
No agent detected
Install Agent
```

---

# Agent Installation UX

UI must display install commands.

Linux/macOS:

```
curl -fsSL http://server/install-agent.sh | bash
```

Windows:

```
powershell -ExecutionPolicy Bypass -c "irm http://server/install-agent.ps1 | iex"
```

---

# Install Scripts

Backend must serve installation scripts:

```
GET /install-agent.sh
GET /install-agent.ps1
```

---

# Linux Install Script

Responsibilities:

1 download agent
2 install binary
3 create systemd service
4 start service

---

# Windows Install Script

Responsibilities:

1 download agent
2 install Windows service
3 start service

---

# Docker Deployment

Docker Compose stack:

```
backend
frontend
database
```

Agent runs **outside Docker**.

---

# docker-compose.yml

```
services:

  backend:
    build: ./backend
    extra_hosts:
      - "host.docker.internal:host-gateway"

  frontend:
    build: ./frontend
```

---

# Agent Binary Distribution

Backend must host compiled binaries:

```
/agents/linux-amd64
/agents/windows-amd64.exe
/agents/darwin-amd64
```

---

# Build System

Agent must support cross compilation.

Build commands:

```
GOOS=linux GOARCH=amd64 go build
GOOS=windows GOARCH=amd64 go build
GOOS=darwin GOARCH=amd64 go build
```

---

# User Installation Flow

User installs stack:

```
docker compose up
```

User opens UI.

UI shows:

```
Install PowerBeacon Agent
```

User runs command.

Agent registers automatically.

UI shows:

```
Agent connected
```

---

# Future Extensions

The architecture must support:

* multiple agents
* multiple networks
* scheduled wake
* device grouping
* webhook triggers

---

# Performance Targets

Agent must:

* start in < 100ms
* use < 20MB RAM
* send > 1000 WOL packets/sec

---

# Security Requirements

* no remote agent exposure
* HTTPS for backend
* token authentication
* secure device storage

---

# Testing Requirements

The system must include tests for:

* WOL packet generation
* agent registration
* heartbeat
* API endpoints
* device wake workflow

---

# Success Criteria

The implementation is complete when:

* agent auto-registers
* devices can be woken
* UI displays agent status
* install scripts work on all platforms
* Docker deployment is simple

---