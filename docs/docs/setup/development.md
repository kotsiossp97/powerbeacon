---
icon: lucide/code
tags:
  - Setup
---
# Local Development

Use this setup when you want fast iteration, debugging, and direct access to backend/frontend processes.

## Prerequisites

- Python 3.13+
- Node.js 20+
- PostgreSQL 16+
- Git

## 1. Clone and Configure

```bash
git clone https://github.com/kotsiossp97/powerbeacon.git
cd kotsios-powerbeacon
```

Create root environment file:

Linux/macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
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

```bash
cd backend
python -m venv .venv
```

Activate environment:

Linux/macOS:

```bash
source .venv/bin/activate
```

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run API with auto-reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
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

## 5. Agent Development (Optional)

From repository root:

```bash
cd agent
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

Backend tests:

```bash
cd backend
pytest
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

## Next Step

Return to [Setup Overview](initial.md) or continue to architecture docs.

