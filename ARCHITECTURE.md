# ARCHITECTURE.md

## Overview

PowerBeacon is a **distributed Wake-on-LAN orchestration platform** designed to reliably wake devices across local networks from a centralized web interface.

The system is built around a **controller–agent architecture** to overcome network isolation introduced by container runtimes such as Docker.

The architecture separates concerns into:

* **Control Plane**
* **Execution Plane**
* **User Interface**

This separation ensures portability, scalability, and security.

---

# Architectural Principles

PowerBeacon follows these design principles:

### 1. Separation of Control and Execution

The backend controls operations but **never interacts directly with the network layer** responsible for Wake-on-LAN.

Instead, network actions are delegated to agents running on host systems.

---

### 2. Host Network Access

Wake-on-LAN requires sending **layer-2 broadcast packets**.

Containerized environments (especially on Windows/macOS) prevent containers from broadcasting directly to LAN.

Therefore:

* network operations must occur **outside containers**
* a **host-level agent** performs WOL actions

---

### 3. Minimal Agent Design

The agent must be:

* small
* cross-platform
* dependency-free
* stable

The agent is implemented in Go due to:

* static binaries
* cross-compilation
* strong networking libraries
* small memory footprint

---

# System Components

## Backend API

The backend acts as the **control plane**.

Responsibilities:

* device management
* agent management
* authentication
* orchestration
* scheduling
* command dispatch

The backend must **never directly generate WOL packets**.

---

## Frontend

The frontend provides:

* device management UI
* agent management UI
* wake controls
* installation guidance

The frontend communicates exclusively with the backend.

---

## PowerBeacon Agent

The agent is the **execution plane**.

Responsibilities:

* sending Wake-on-LAN packets
* reporting host availability
* registering with backend
* maintaining heartbeat
* exposing local control API

Agents operate on machines inside target networks.

---

# High-Level System Diagram

```
User
 │
 ▼
Frontend
 │
 ▼
Backend API
 │
 ▼
PowerBeacon Agent
 │
 ▼
LAN Broadcast
 │
 ▼
Target Device
```

---

# Agent Lifecycle

The agent follows a predictable lifecycle to maintain backend connectivity.

### Startup Sequence

```
Agent start
  │
  ├── Detect system info
  ├── Detect network interfaces
  ├── Determine broadcast addresses
  ├── Register with backend
  ├── Start local API server
  └── Begin heartbeat loop
```

---

### Shutdown Behavior

When the backend becomes unavailable:

```
Agent detects connection failure
      │
      ▼
Agent enters idle state
      │
      ▼
Retry registration periodically
```

This ensures agents recover automatically when the backend restarts.

---

# Communication Model

Communication occurs in two directions.

## Agent → Backend

Used for:

* registration
* heartbeat
* status updates

Example flow:

```
Agent start
   │
   ▼
POST /api/agents/register
```

Heartbeat loop:

```
POST /api/agents/heartbeat
```

---

## Backend → Agent

Used for:

* sending Wake-on-LAN commands
* performing device actions

Example:

```
POST /wol
```

Agents run an HTTP server bound to:

```
127.0.0.1:18080
```

---

# Network Model

Wake-on-LAN uses UDP broadcast packets.

Packet format:

```
6 bytes: FF FF FF FF FF FF
16 repetitions of MAC address
```

Total packet size:

```
102 bytes
```

Packets are transmitted to:

```
UDP broadcast address : port 9
```

Example broadcast:

```
192.168.1.255
```

---

# Network Interface Discovery

Agents must determine broadcast addresses dynamically.

Procedure:

1. enumerate network interfaces
2. retrieve IP address
3. retrieve subnet mask
4. compute broadcast address

Example:

```
IP:        192.168.1.25
Netmask:   255.255.255.0
Broadcast: 192.168.1.255
```

---

# Agent Registration

Agents self-register with the backend.

This allows the backend to dynamically track available execution nodes.

Registration flow:

```
Agent start
   │
   ▼
POST /api/agents/register
   │
   ▼
Backend stores agent
   │
   ▼
Agent receives token
```

Agent metadata stored:

* hostname
* OS
* version
* IP address
* last_seen timestamp

---

# Heartbeat System

Agents must send heartbeats periodically.

Interval:

```
30 seconds
```

Heartbeat ensures:

* agent health monitoring
* UI status updates
* cleanup of stale agents

---

# Wake Operation Flow

Full wake sequence:

```
User clicks "Wake Device"
      │
      ▼
Frontend sends request
      │
      ▼
Backend validates device
      │
      ▼
Backend selects appropriate agent
      │
      ▼
Backend sends WOL request to agent
      │
      ▼
Agent sends broadcast packet
      │
      ▼
Target device wakes
```

---

# Multi-Agent Support

The architecture supports multiple agents across different networks.

Example:

```
PowerBeacon Server
 │
 ├── Agent: Home LAN
 ├── Agent: Office LAN
 └── Agent: Datacenter
```

Devices are mapped to agents.

---

# Deployment Architecture

The recommended deployment model is:

```
Docker Compose
   │
   ├── Backend container
   ├── Frontend container
   └── Database container

Host OS
   │
   └── PowerBeacon Agent service
```

Agents run **outside Docker**.

---

# Installation Architecture

Agents are installed through scripts served by the backend.

Example endpoints:

```
/install-agent.sh
/install-agent.ps1
```

These scripts:

1. download binary
2. install agent
3. create system service
4. start agent

---

# Service Integration

Agents should install as system services.

### Linux

System service using:

```
systemd
```

### Windows

Service using:

```
Windows Service Manager
```

### macOS

Service using:

```
launchd
```

---

# Security Model

Security considerations:

### Agent Exposure

Agents must **never expose public endpoints**.

Bind only to:

```
127.0.0.1
```

---

### Authentication

Agent communication must include:

```
Bearer tokens
```

Tokens issued during agent registration.

---

### Backend Security

Backend must implement:

* authentication
* API authorization
* HTTPS support

---

# Failure Handling

PowerBeacon must tolerate failures gracefully.

### Agent offline

Backend marks agent as:

```
offline
```

Devices linked to that agent become temporarily unavailable.

---

### Backend restart

Agents automatically reconnect via registration retry loop.

---

# Scalability

PowerBeacon supports scaling via:

* multiple agents
* stateless backend
* database-backed device storage

Possible future improvements:

* distributed task queues
* load balancing across agents
* scheduled wake operations

---

# Performance Considerations

Expected performance:

Agent memory usage:

```
< 20 MB
```

Agent startup time:

```
< 100 ms
```

Packet transmission capacity:

```
> 1000 WOL packets per second
```

---

# Future Architecture Extensions

Potential improvements:

### Scheduled Wake Jobs

Backend scheduler to wake devices at specific times.

---

### Network Discovery

Agents automatically discover devices supporting Wake-on-LAN.

---

### Remote Networks

Agents deployed across remote networks connected via VPN.

---

# Design Rationale

The architecture intentionally separates network operations into a host-level agent to overcome limitations of container networking.

This design ensures:

* reliable Wake-on-LAN delivery
* compatibility with Windows and macOS Docker environments
* secure system operation
* scalable distributed architecture

---

# Summary

PowerBeacon architecture combines:

* centralized orchestration
* distributed execution agents
* containerized backend services

This model ensures Wake-on-LAN functionality remains reliable even in modern containerized environments.
