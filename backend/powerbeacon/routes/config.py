"""
Configuration API routes for OIDC and other settings.
"""

from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status

from powerbeacon.core.deps import get_current_active_superuser, SessionDep
from powerbeacon.crud.config_crud import (
    create_or_update_oidc_settings,
    get_oidc_settings,
)
from powerbeacon.services.oidc import configure_oauth_client
from powerbeacon.models.config import OIDCSettingsCreate

router = APIRouter(prefix="/config", tags=["Configuration"])


class OIDCConfig(BaseModel):
    """OIDC configuration model."""

    enabled: bool
    server_metadata_url: str | None = None
    client_id: str | None = None
    client_secret: str | None = None


class OIDCConfigPublic(BaseModel):
    """Public OIDC configuration (without secret)."""

    enabled: bool
    server_metadata_url: str | None = None
    client_id: str | None = None


@router.get("/oidc")
async def get_oidc_config(session: SessionDep) -> OIDCConfigPublic:
    """
    Get OIDC configuration (public - without secret).
    This endpoint is public to allow the frontend to determine auth mode.
    """
    settings = get_oidc_settings(session)

    if not settings:
        return OIDCConfigPublic(enabled=False)

    return OIDCConfigPublic(
        enabled=settings.enabled,
        server_metadata_url=settings.server_metadata_url if settings.enabled else None,
        client_id=settings.client_id if settings.enabled else None,
    )


@router.put("/oidc", dependencies=[Depends(get_current_active_superuser)])
async def update_oidc_config(config: OIDCConfig, session: SessionDep) -> dict:
    """Update OIDC configuration (superuser only)."""
    existing = get_oidc_settings(session)

    if config.enabled:
        if (
            not config.server_metadata_url
            or not config.client_id
            or (not config.client_secret and not existing)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Server metadata URL, client ID, and client secret are required when enabling OIDC",
            )

    settings_in = OIDCSettingsCreate(
        enabled=config.enabled,
        server_metadata_url=config.server_metadata_url,
        client_id=config.client_id,
        client_secret=config.client_secret,
    )

    updated_settings = create_or_update_oidc_settings(session, settings_in)

    # Reconfigure OAuth client with updated settings
    configure_oauth_client()
    return {
        "message": "OIDC configuration updated successfully",
        "enabled": updated_settings.enabled,
    }
