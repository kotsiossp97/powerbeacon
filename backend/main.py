"""
Main FastAPI application.
"""

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from powerbeacon.core import settings
from powerbeacon.models.generic import ErrorResponse
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

# Import routers
from powerbeacon.routes import agents, clusters, config, devices, login, setup, users
from starlette.middleware.sessions import SessionMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform any startup tasks here (e.g., initialize database, load models)
    from powerbeacon.core.db import engine, init_db
    from sqlmodel import Session

    with Session(engine) as session:
        init_db(session)
    yield  # This is where the application runs


app = FastAPI(
    title="PowerBeacon API",
    description="Wake-on-LAN and device management API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    # root_path="/api",
    openapi_url="/api/openapi.json",
)

# Trust reverse proxy headers (X-Forwarded-Proto, X-Forwarded-For) so that
# request.url_for() returns the correct scheme (https) when behind a TLS proxy.
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Add session middleware
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # Add trusted host middleware
# app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

api_router = APIRouter(prefix="/api")
# Include routers
api_router.include_router(setup.router)
api_router.include_router(config.router)
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(devices.router)
api_router.include_router(agents.router)
api_router.include_router(clusters.router)
app.include_router(api_router)


# Health check endpoint
@app.get("/health", tags=["Health"])
def health():
    """Health check endpoint."""
    return {"status": "ok", "message": "PowerBeacon API is running"}


# Agent installation scripts
@app.get("/install-agent.sh", tags=["Agent"])
async def get_linux_install_script():
    """Serve the Linux/macOS agent installation script."""
    import os

    from fastapi.responses import PlainTextResponse

    script_path = os.path.join(os.path.dirname(__file__), "agents", "install", "install-agent.sh")

    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="Installation script not found")

    with open(script_path, "r") as f:
        content = f.read()

    return PlainTextResponse(content=content, media_type="text/x-shellscript")


@app.get("/install-agent.ps1", tags=["Agent"])
async def get_windows_install_script():
    """Serve the Windows agent installation script."""
    import os

    from fastapi.responses import PlainTextResponse

    script_path = os.path.join(os.path.dirname(__file__), "agents", "install", "install-agent.ps1")

    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="Installation script not found")

    with open(script_path, "r") as f:
        content = f.read()

    return PlainTextResponse(content=content, media_type="text/plain")


# Agent binaries
@app.get("/agents/{platform}-{arch}", tags=["Agent"])
@app.get("/agents/{platform}-{arch}.exe", tags=["Agent"])
async def get_agent_binary(platform: str, arch: str):
    """Serve agent binaries for different platforms."""
    import os

    from fastapi.responses import FileResponse

    # Determine file extension
    ext = ".exe" if platform == "windows" else ""

    binary_path = os.path.join(
        os.path.dirname(__file__),
        "agents",
        "binaries",
        f"powerbeacon-agent-{platform}-{arch}{ext}",
    )

    if not os.path.exists(binary_path):
        raise HTTPException(status_code=404, detail=f"Agent binary not found for {platform}-{arch}")

    # Set appropriate media type
    media_type = "application/octet-stream"

    return FileResponse(path=binary_path, media_type=media_type, filename=f"powerbeacon-agent{ext}")


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            status_code=500, message="An unexpected error occurred.", details=str(exc)
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(status_code=exc.status_code, message=exc.detail).model_dump(),
    )
