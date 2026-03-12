# PowerBeacon

A self-hosted web application for remote device management via Wake-on-LAN and SSH. Control your homelabor office network with a modern, secure interface.

## Features

- **Wake-on-LAN** - Wake up devices remotely
- **Device Management** - Add, edit, delete devices with custom tags
- **Flexible Authentication** - OIDC or local authentication
- **Audit Logging** - Track all actions with timestamp and user
- **REST API** - Fully documented with OpenAPI/Swagger
- **Modern UI** - React + Tailwind responsive interface
- **Containerized** - Docker Compose setup for easy deployment

## Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- Or: Python 3.11+, Node.js 20+, PostgreSQL 16+

### Using Docker Compose (Production)

```bash
# Clone repo
git clone <repo-url>
cd kotsios-powerbeacon

# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Visit http://localhost:3000

# Login with demo credentials:
# Username: admin
# Password: admin
```

### Using Docker Compose (Development)

For development with hot-reloading:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Frontend: http://localhost:5173 (Vite HMR)
# Backend: http://localhost:8000
# Database: localhost:5432

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

⚠️ Changes to source files automatically reload!
- Backend: Code changes restart uvicorn
- Frontend: CSS/TypeScript changes update instantly via HMR

### Wake-on-LAN In Containerized Environments

On Docker Desktop (Windows/macOS), containers run inside a VM and cannot reliably send LAN broadcast WOL packets directly.

PowerBeacon now supports a production-safe relay mode:

- `WOL_MODE=udp`: backend sends packet directly (best for native Linux hosts with LAN access)
- `WOL_MODE=relay`: backend calls an authenticated WOL relay service running on the LAN broadcast domain

Recommended production topology:

- Keep `backend`, `frontend`, and `db` containerized as usual
- Run `wol-relay` as a separate container on a Linux host in the target LAN (same broadcast domain as devices)
- Configure backend with `WOL_MODE=relay`, `WOL_RELAY_URL`, and `WOL_RELAY_TOKEN`

Important limitation:

- Running `wol-relay` on the same Docker Desktop host (Windows/macOS) is not enough for LAN WOL in many setups.
- Docker Desktop packets egress from VM/NAT interfaces instead of the physical LAN NIC, so magic packets may never reach sleeping devices.
- Place `wol-relay` on a Linux machine with native LAN access (mini PC, Raspberry Pi, NAS, VM on the LAN).

Example relay deployment:

```bash
# On the Linux host that has direct LAN access
export WOL_RELAY_TOKEN='replace-with-long-random-secret'
docker compose -f docker-compose.wol-relay.yml up -d --build
```

Example backend relay configuration:

```env
WOL_MODE=relay
WOL_BROADCAST_IP=192.168.1.255
WOL_PORT=9
WOL_RELAY_URL=http://<lan-linux-relay-host-ip>:8089
WOL_RELAY_TOKEN=replace-with-long-random-secret
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development setup.

### Local Development (Without Docker)

For direct Python/Node development without Docker:

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=.
export DB_URL="postgresql://powerbeacon:changeMe@localhost:5432/powerbeacon"
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Project Status

PowerBeacon is **production-ready** with the following components fully implemented:

- ✅ REST API with 15+ endpoints (FastAPI with async/await)
- ✅ React frontend with complete UI (5 pages, responsive design)
- ✅ PostgreSQL database with schema and models
- ✅ Authentication system (local auth + OIDC support)
- ✅ Role-based authorization (admin/user)
- ✅ Audit logging with searchable trails
- ✅ Wake-on-LAN implementation (UDP magic packets)
- ✅ Docker production deployment (tested, ready)
- ✅ Development environment with hot-reload
- ✅ Comprehensive documentation (6 guides, 2000+ lines)
- ✅ CLI helper utility (15+ commands)

## Architecture Highlights

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with async support
- **PostgreSQL** - Relational database
- **JWT** - Token-based authentication
- **Argon2** - Password hashing

### Frontend

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Client routing
- **Axios** - HTTP client

### Deployment

- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Nginx** - Reverse proxy & static serving
- **PostgreSQL** - Data persistence

## Configuration

### Environment Variables

See `.env.example` for all available options.

#### Authentication Modes

**Local Auth** (default):

```env
JWT_SECRET=your-secret-key
```

**OIDC** (e.g., Keycloak, Auth0):

```env
OIDC_ISSUER_URL=https://keycloak.example.com/realms/master
OIDC_CLIENT_ID=powerbeacon
OIDC_CLIENT_SECRET=secret
```

## API Documentation

Once running, visit `/docs` (Swagger) or `/redoc` (ReDoc) for full API documentation.

### Key Endpoints

- `POST /api/auth/login` - Login (local auth)
- `GET /api/auth/me` - Get current user
- `GET /api/devices` - List devices
- `POST /api/devices` - Create device
- `POST /api/devices/{id}/wake` - Wake device
- `GET /api/audit` - View audit logs (admin)
- `GET /api/users` - Manage users (admin, local auth)

## Security

- All endpoints require authentication
- CORS restricted to configured origins
- JWT tokens with expiry
- Password hashing with Argon2
- Rate limiting on sensitive endpoints
- Audit logging for all actions
- HTTPS via reverse proxy (recommended)

## Roadmap

- [ ] Device grouping & organization
- [ ] Scheduled wake operations
- [ ] Webhooks for automation
- [ ] SNMP status monitoring
- [ ] Email notifications
- [ ] Mobile app
- [ ] Multi-tenant support

## Troubleshooting

### Database connection failed

Check `DB_URL` in `.env` and ensure PostgreSQL is running.

### Wake packets not working

- Ensure container has `NET_RAW` capability (see docker-compose.yml)
- Check network broadcast configuration
- Verify device MAC address is correct
- On Docker Desktop (Windows/macOS), use relay mode (`WOL_MODE=relay`) instead of direct UDP broadcast from the backend container

### OIDC authentication issues

- Verify OIDC provider settings
- Check `OIDC_ISSUER_URL` is accessible
- Ensure `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` are correct

## Development

For comprehensive development setup guide including:
- Docker-based development with hot-reload
- Local development without Docker
- IDE setup and debugging
- Testing and code quality tools
- Performance optimization

See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete details.

### Quick Backend Test

```bash
cd backend
pytest
```

### Database Migrations

```bash
cd backend
alembic upgrade head  # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
```

## Contributing

PRs welcome! Please ensure:

- Code follows existing style
- Tests pass
- Commit messages are descriptive

## License

MIT License - see LICENSE file

## Support

For issues and questions, please open a GitHub issue.
