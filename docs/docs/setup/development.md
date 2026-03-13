---
icon: lucide/code
tags:
  - Setup
---
# Local Development

Use this setup when you want fast iteration, debugging, and direct access to backend/frontend processes.

```mermaid
flowchart LR
  A[Prepare env] --> B[Run PostgreSQL]
  B --> C[Start backend]
  C --> D[Start frontend]
  D --> E[Run optional agent]
  E --> F[Verify login and wake flow]
  style A fill:#2563eb,stroke:#1e3a8a,color:#fff
  style F fill:#16a34a,stroke:#166534,color:#fff
```

## Prerequisites

- Python 3.13+
- Node.js 20+
- PostgreSQL 16+
- Git

!!! info "Who should use this"
    Choose Local Development if you are implementing features, debugging routes, or iterating on frontend and backend together.

## 1. Clone and Configure

```bash linenums="1"
git clone https://github.com/kotsiossp97/powerbeacon.git
cd powerbeacon
```

Create root environment file:

Linux/macOS:

```bash linenums="1"
cp .env.example .env
```

PowerShell:

```powershell linenums="1"
Copy-Item .env.example .env
```

## 2. Start PostgreSQL

Ensure PostgreSQL is running and create a `powerbeacon` database with user credentials matching your `DB_URL`.

Recommended local URL:

```env
DB_URL=postgresql+psycopg2://powerbeacon:changeMe@localhost:5432/powerbeacon
```

## 3. Run Backend (FastAPI)

From repository root:

```bash linenums="1"
cd backend
uv run fastapi dev main.py --host 0.0.0.0 --port 8000
```

Alternatively, using `pip`:

=== "Linux/macOS"

    ```bash linenums="1"
    cd backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    fastapi dev main.py --host 0.0.0.0 --port 8000
    ```

=== "PowerShell"

    ```powershell linenums="1"
    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    fastapi dev main.py --host 0.0.0.0 --port 8000
    ```

Backend URLs:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/api/docs`
- Health: `http://localhost:8000/health`

## 4. Run Frontend (Vite)

Open a second terminal from repository root:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

If needed, configure API base URL in frontend environment to point at `http://localhost:8000`.

!!! tip "Fast frontend loop"
    Keep backend and frontend in separate terminals to preserve hot reload on both sides.

## 5. Agent Development (Optional)

From repository root:

```bash
cd agent
go mod download
go test ./...
```

Build local binaries:

```bash
go build -o build/powerbeacon-agent ./cmd/agent
```

## 6. Verification Checklist

1. Backend health endpoint returns `ok`.
2. Frontend loads without runtime errors.
3. Login works.
4. Device list API returns data.
5. Wake action request is accepted by backend.

## Useful Commands

Backend formatting and linting:

```bash
cd backend
uv run ruff check --fix
uv run ruff format
```

Frontend lint/build:

```bash
cd frontend
npm run lint
npm run build
```

Agent tests:

```bash
cd agent
go test ./...
```

## Troubleshooting

### CORS issues in browser

Confirm backend CORS allows `http://localhost:5173` or your active frontend origin.

### DB connection errors

Confirm PostgreSQL is running and `DB_URL` points to correct host, user, password, and database.

### Frontend cannot reach backend

1. Confirm backend is running on port `8000`.
2. Confirm frontend API base URL is set correctly.
3. Check browser network tab for failing requests.

### Authentication problems

For local mode, verify:

```env
JWT_SECRET=<non-default-secret>
```

For OIDC, verify issuer/client settings in `.env` and that provider endpoints are reachable.

!!! warning "Token confusion"
    If login behavior seems inconsistent, clear `localStorage` in the browser and retry. Stale JWTs commonly cause misleading UI states.

## Next Step

Return to [Setup Overview](initial.md) or continue to architecture docs.

