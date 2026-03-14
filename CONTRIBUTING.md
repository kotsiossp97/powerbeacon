# Contributing to PowerBeacon

First off, thank you for considering contributing to PowerBeacon! It's people like you that make PowerBeacon such a great tool.

## Architecture Overview
PowerBeacon uses a centralized backend as the control plane and a Go agent as the execution plane. 
- **Frontend:** React application (`frontend/`)
- **Backend:** Python FastAPI application (`backend/`)
- **Agent:** Go application for Wake-on-LAN dispatch (`agent/`)
- **Docs:** Zensical (`docs/`)

Please review `ARCHITECTURE.md` and `IMPLEMENTATION.md` for detailed context before making architectural changes.

## Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js (v18+)
- Go (1.26+)
- Docker & Docker Compose

### Getting Started

#### 1. Full Stack via Docker (Recommended for quick testing)
```bash
docker compose -f docker-compose.dev.yml up -d
```

#### 2. Frontend Development
```bash
cd frontend
npm install
npm run dev
```

#### 3. Backend Development
```bash
cd backend
uv sync
uv run fastapi dev main.py
```

#### 4. Agent Development
```bash
cd agent
make deps
make local # or make build
make run
```

## Pull Request Process

1. **Fork the repository** and create your branch from `main`.
2. **Make your changes**, ensuring you keep changes minimal and localized. Avoid broad refactors unless explicitly discussed in an issue.
3. **Run checks and tests** for the components you modified:
   - Frontend: `npm run lint`
   - Backend: `uv run ruff check --fix` and `uv run ruff format`
   - Agent: `make test`
4. **Ensure your code matches the existing style** in each subproject.
5. **Issue a Pull Request** using the provided template and link any relevant issues.

## Code Conventions
- **Frontend:** Use `react-router` package imports. Alias `@/*` maps to `frontend/src/*`. Use centralized API helpers.
- **Backend:** Keep routes under `/api` and follow the router-per-domain structure in `backend/powerbeacon/routes/`.
- **Agent:** Keep token-protected `/wol` behavior and heartbeat/registration lifecycle intact.