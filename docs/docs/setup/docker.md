---
icon: fontawesome/brands/docker
tags:
  - Setup
---

# Docker Setup

This is the recommended setup path for running PowerBeacon with minimal host dependencies.

## Prerequisites

- Docker Engine / Docker Desktop
- Docker Compose v2 (`docker compose`)
- Open ports: `3000` (frontend), `8000` (backend), `5432` (db for dev compose)

## Environment Preparation

Create `.env` from the template at the repository root.

Linux/macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

At minimum, set these values:

```env
DB_PASSWORD=changeMe
JWT_SECRET=replace-with-strong-secret
```

## Run Production-Like Stack

Uses `docker-compose.yml`.

```bash
docker compose up --build
```

Endpoints:

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/api/docs`
- Health: `http://localhost:8000/health`

Stop:

```bash
docker compose down
```

## Run Development Stack (Hot Reload)

Uses `docker-compose.dev.yml`.

```bash
docker compose -f docker-compose.dev.yml up --build
```

Endpoints:

- Frontend (Vite): `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL (host): `localhost:5432`

Logs:

```bash
docker compose -f docker-compose.dev.yml logs -f
```

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

## Verify Containers

```bash
docker compose ps
```

Expected services:

- `db`
- `backend`
- `frontend`

## WOL Mode Notes

Default compose config uses relay mode:

```env
WOL_MODE=relay
WOL_RELAY_URL=http://host.docker.internal:8089
WOL_RELAY_TOKEN=change-me-relay-token
```

Important behavior:

- On Docker Desktop (Windows/macOS), direct UDP broadcast from containers is often unreliable for LAN wake.
- For reliable production wake, run a relay on a Linux host within the same LAN broadcast domain as target devices.

## Troubleshooting

### Build fails

1. Rebuild without cache:

```bash
docker compose build --no-cache
```

2. Check available disk space.

### Port conflict

If startup fails with bind errors, free or remap conflicting ports (`3000`, `5173`, `8000`, `5432`).

### Backend cannot connect to DB

1. Confirm `db` is healthy:

```bash
docker compose ps
```

2. Confirm `DB_PASSWORD` in `.env` matches compose environment assumptions.

### Clean reset

Use this when local state is corrupted:

```bash
docker compose down -v
docker compose up --build
```

## Next Step

If you plan to develop features, continue with [Local Development](development.md).
