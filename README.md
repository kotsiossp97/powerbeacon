[![Docker Image CI/CD](https://github.com/kotsiossp97/powerbeacon/actions/workflows/docker-image.yml/badge.svg)](https://github.com/kotsiossp97/powerbeacon/actions/workflows/docker-image.yml)
[![Documentation](https://github.com/kotsiossp97/powerbeacon/actions/workflows/docs.yml/badge.svg)](https://github.com/kotsiossp97/powerbeacon/actions/workflows/docs.yml)

# PowerBeacon

PowerBeacon is a self-hosted Wake-on-LAN orchestration platform built around three layers: a FastAPI backend, a React frontend, and one or more Go agents that run close to the target LAN.

## Current domain model

- Clusters group related devices and agents.
- Devices belong to zero or one cluster.
- Devices can be associated with multiple agents.
- A wake request fans out through every associated online agent for the target device.
- Cluster detail pages allow waking one device or the whole cluster.

## Core capabilities

- Cluster management for organizing devices and agents
- Multi-agent Wake-on-LAN delivery for individual devices
- Cluster-level wake orchestration
- Agent registration, heartbeat tracking, and cluster visibility
- Local auth and OIDC authentication
- Responsive UI for devices, clusters, agents, users, and settings

## Architecture summary

```text
Frontend -> Backend API -> PowerBeacon Agent -> LAN broadcast -> Target device
```

The backend stays the control plane. It never sends magic packets directly; all WOL traffic is dispatched through registered agents.

## Quick start

### Docker Compose

```bash
docker compose up -d
```

### Development Compose

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Local development

Backend:

```bash
cd backend
pip install -e .
python main.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Agent:

```bash
cd agent
make deps
make run
```

## Development note

The schema has been refactored directly for the current development phase. If you still have a database from the older single-agent device model, reset it before starting this version of the app.

## Key API routes

- `POST /api/auth/login`
- `GET /api/devices` and `POST /api/devices/{id}/wake`
- `GET /api/clusters`, `GET /api/clusters/{id}`, and `POST /api/clusters/{id}/wake`
- `GET /api/agents`, `POST /api/agents/register`, and `POST /api/agents/heartbeat`

## Wake behavior

When a device is woken, PowerBeacon resolves every agent associated with that device and attempts dispatch through all online agents. This improves reliability when the same machine can be reached from multiple relay hosts or overlapping network segments.

## Docker Desktop reminder

On Windows and macOS Docker Desktop, container-originated LAN broadcasts are unreliable. Install the PowerBeacon agent on a host with direct LAN access and let the backend dispatch through that host.

## Documentation

- Interactive API docs: `http://localhost:8000/api/docs`
- Project docs: [PowerBeacon Documentation](https://kotsiossp97.github.io/powerbeacon/)

## License

MIT
