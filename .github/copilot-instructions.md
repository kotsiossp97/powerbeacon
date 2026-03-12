# Project Guidelines

## Architecture
- Treat the backend as the control plane and the Go agent as the execution plane.
- Do not implement direct Wake-on-LAN packet sending in backend routes/services; dispatch WOL through agents.
- Assume containerized backend/frontend may not have direct LAN broadcast access on Windows/macOS Docker Desktop. Prefer host-installed agents for reliable WOL.
- Preserve the boundary: frontend -> backend API -> agent -> LAN broadcast.

See `ARCHITECTURE.md` and `IMPLEMENTATION.md` for detailed context.

## Build and Test
- Python baseline: backend and docs require Python 3.13+.
- Root (Docker):
  - `docker compose up -d`
  - `docker compose -f docker-compose.dev.yml up -d`
- Frontend (`frontend/`):
  - `npm install`
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
- Backend (`backend/`):
  - `pip install -e .`
  - `python main.py` (or `uvicorn powerbeacon.main:app --reload`)
  - `ruff check .`
- Agent (`agent/`):
  - `make deps`
  - `make test`
  - `make local` or `make build`
  - `make run`
- Docs (`docs/`):
  - `pip install -e .`
  - `zensical serve -a 127.0.0.1:5000`
  - `zensical build`
  - Managed as a Python project using Zensical (`docs/pyproject.toml`, `docs/zensical.toml`).

Run checks only for the areas you changed, but do not skip component-specific lint/test when editing that component.

## Conventions
- Frontend uses `react-router` package imports (not `react-router-dom`).
- Frontend TypeScript path alias `@/*` maps to `frontend/src/*`.
- Frontend API calls should go through centralized API helpers (for auth token and 401 handling patterns).
- Backend auth login expects OAuth2 form-urlencoded payload at `/api/auth/login`.
- Setup/onboarding flow is `/api/setup/status` then `/api/setup/init`.
- OIDC configuration endpoints are `GET/PUT /api/config/oidc`.
- Keep backend routes under `/api` and follow existing router-per-domain structure in `backend/powerbeacon/routes/`.
- In agent code, keep token-protected `/wol` behavior and heartbeat/registration lifecycle intact.

## Code Style
- Match existing style in each subproject instead of introducing new patterns.
- Keep changes minimal and localized; avoid broad refactors unless explicitly requested.
- Prefer existing abstractions and module boundaries shown in:
  - `backend/main.py`
  - `backend/powerbeacon/routes/devices.py`
  - `frontend/src/api/client.ts`
  - `agent/cmd/agent/main.go`
  - `agent/internal/wol/wol.go`
