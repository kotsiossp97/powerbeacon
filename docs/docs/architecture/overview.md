---
icon: lucide/layers
tags:
  - Architecture
---
# Architecture Overview

PowerBeacon is a three-tier application: a Python backend API, a React frontend, and one or more lightweight Go agents deployed on LAN-adjacent hosts. All three components communicate over HTTP.

At the domain level, the application is cluster-aware:

- A cluster groups related devices and agents.
- A device belongs to zero or one cluster.
- A device can have multiple associated agents.
- A wake request is dispatched through every associated online agent.

## System Diagram

```mermaid
graph TD
    User["👤 User's Browser"]
    Frontend["React Frontend<br/>Port 3000/5173<br/>React 19 + Vite + TypeScript"]
    Backend["FastAPI Backend<br/>Port 8000<br/>Python 3.13"]
    Database[("PostgreSQL 16<br/>SQLModel ORM")]
    Agent["🔌 Agent<br/>Port 18080<br/>Go 1.26"]  
    Devices["🖥️ Target Devices<br/>on LAN"]
    
    User <-->|REST/JSON<br/>Bearer JWT| Frontend
    Frontend <-->|REST/JSON<br/>Bearer JWT| Backend
    Backend <-->|SQL| Database
    Backend <-->|HTTP Bearer Token<br/>POST /wol| Agent
    Agent <-->|UDP Broadcast<br/>Port 9| Devices
    
    style User fill:#6366f1,stroke:#4f46e5,color:#fff
    style Frontend fill:#3b82f6,stroke:#2563eb,color:#fff
    style Backend fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style Database fill:#d946ef,stroke:#c026d3,color:#fff
    style Agent fill:#ec4899,stroke:#db2777,color:#fff
    style Devices fill:#f59e0b,stroke:#d97706,color:#fff
```

## Components

| Component | Language / Runtime | Responsibility |
| --- | --- | --- |
| Backend | Python 3.13, FastAPI | API, auth, device/agent lifecycle, WOL dispatch coordination |
| Frontend | TypeScript, React 19, Vite 7 | Dashboard, device/agent management, wake actions |
| Agent | Go 1.26 | LAN-side WOL packet sender; registers and heartbeats with backend |
| Database | PostgreSQL 16 | Persistent state: users, devices, agents, config |

## Request Flow: Wake a Device

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Agent
    participant Device
    
    User->>Frontend: Click "Wake Device"
    Frontend->>Backend: POST /api/devices/{id}/wake<br/>Authorization: Bearer {jwt}
    Backend->>Backend: Authenticate<br/>Resolve device → associated agents
    loop For each online agent
        Backend->>Agent: POST /wol<br/>Authorization: Bearer {token}<br/>{mac, broadcast, port}
        Agent->>Agent: Validate token<br/>Build magic packet
        Agent->>Device: UDP broadcast<br/>102-byte magic packet<br/>Port 9
        Device->>Device: Receive magic packet<br/>Wake up
        Device-->>Agent: (no response)
        Agent-->>Backend: 200 OK
    end
    Backend-->>Frontend: 200 OK
    Frontend-->>User: Success notification
```

## Request Flow: User Login (Local Auth)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Enter credentials<br/>Click "Login"
    Frontend->>Backend: POST /api/auth/login<br/>{username, password}
    Backend->>Database: SELECT user WHERE username=?
    Database-->>Backend: User record
    Backend->>Backend: Verify password<br/>Argon2 hash
    alt Password valid
        Backend->>Backend: Create HS256 JWT<br/>exp: now + 24h
        Backend-->>Frontend: {access_token}
        Frontend->>Frontend: localStorage["access_token"] = jwt
        Frontend-->>User: Redirect to dashboard
    else Password invalid
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show error
    end
```

## Request Flow: User Login (OIDC)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Provider["OIDC Provider"]
    participant Database
    
    User->>Frontend: Click "Login with SSO"
    Frontend->>Backend: GET /api/auth/login/oauth
    Backend->>Provider: Redirect to authorization endpoint
    Provider-->>User: Login form
    User->>Provider: Submit credentials
    Provider-->>Backend: Redirect to callback<br/>with auth code
    Backend->>Provider: POST token endpoint<br/>exchange code for tokens
    Provider-->>Backend: access_token + userinfo
    Backend->>Database: User exists?
    alt Existing user
        Database-->>Backend: User record
    else New user
        Backend->>Database: Create user from userinfo
    end
    Backend->>Backend: Create local HS256 JWT
    Backend-->>Frontend: Redirect to /login?token={jwt}
    Frontend->>Frontend: Extract token<br/>localStorage["access_token"] = jwt
    Frontend-->>User: Redirect to dashboard
```

## Deployment Topologies

### Docker Compose (Recommended)

All services run as containers on the same Docker network. The agent is separate and must run on a Linux host with native LAN access to reach sleeping devices via UDP broadcast (Docker Desktop on Windows/macOS cannot reliably deliver LAN broadcast packets from containers).

```
docker compose up --build        # production compose
docker compose -f docker-compose.dev.yml up --build  # dev compose with hot-reload
```

### Local Development

Each service runs as a native process. PostgreSQL is run locally or in a single container. See [Local Development](../setup/development.md).

## Technology Stack Summary

| Layer | Key Libraries |
| --- | --- |
| Backend framework | FastAPI 0.135, Starlette, Uvicorn |
| ORM / DB | SQLModel 0.0.37, SQLAlchemy 2.0, psycopg2-binary |
| Auth | PyJWT, pwdlib (Argon2 + bcrypt), Authlib (OIDC) |
| Frontend framework | React 19, React Router 7, Vite 7 |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui |
| Frontend state | Zustand 5 |
| HTTP client | Axios 1.x |
| Agent HTTP router | gorilla/mux 1.8 |
| Agent WOL | stdlib `net` package (UDP) |

## Security Model

!!! note "Authentication & Authorization"
    - All `/api/*` endpoints require a valid JWT except `/api/auth/login`, `/api/setup/*`, and `/api/agents/register`.
    - JWT tokens are signed with HS256 using `JWT_SECRET` (must be changed in production).
    - Tokens include `sub` (user ID) and `exp` (expiration timestamp).
    - Token lifetime: 24 hours (configurable via `JWT_EXPIRATION_HOURS`).

!!! warning "Agent Authorization"
    - Each agent receives a **unique bearer token** at registration time.
    - Agents authenticate heartbeats: `POST /api/agents/heartbeat` with `Authorization: Bearer {token}`.
    - Backend authenticates WOL dispatch to agents using the same token.
    - Token compromise on one agent does **not** affect other agents.

!!! info "Additional Security"
    - CORS is restricted to configured origins (default: `localhost:3000`, `localhost:5173`).
    - Passwords are hashed with **Argon2** (primary) with **bcrypt** as a legacy fallback.
    - Rate limiting available on sensitive endpoints (recommended for production).

## Further Reading

- [Backend Architecture](backend.md)
- [Frontend Architecture](frontend.md)
- [Agent Architecture](agent.md)
