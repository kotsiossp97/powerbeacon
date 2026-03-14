"""
Setup and onboarding routes
"""

from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select

from powerbeacon.core.deps import SessionDep
from powerbeacon.crud import user_crud
from powerbeacon.crud.config_crud import create_or_update_oidc_settings
from powerbeacon.models.config import OIDCSettingsCreate
from powerbeacon.models.users import User, UserCreate, UserPublic, UserRole
from powerbeacon.services.oidc import configure_oauth_client

router = APIRouter(prefix="/setup", tags=["Setup"])


class SetupInitRequest(UserCreate):
    """Initial setup payload for first superuser and optional OIDC settings."""

    oidc: OIDCSettingsCreate | None = None


@router.get("/status")
async def get_setup_status(session: SessionDep) -> dict[str, Any]:
    """
    Check if initial setup has been completed.
    Returns whether any users exist in the system.
    """
    statement = select(func.count(User.id))
    user_count = session.exec(statement).one()

    return {
        "is_setup_complete": user_count > 0,
        "user_count": user_count,
    }


@router.post("/init", response_model=UserPublic)
async def initialize_system(*, session: SessionDep, user_in: SetupInitRequest) -> Any:
    """
    Initialize the system by creating the first superuser.
    This endpoint only works if no users exist in the system.
    """
    # Check if any users exist
    statement = select(func.count(User.id))
    user_count = session.exec(statement).one()

    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System is already initialized. Cannot create another initial user.",
        )

    if user_in.oidc and user_in.oidc.enabled:
        if (
            not user_in.oidc.server_metadata_url
            or not user_in.oidc.client_id
            or not user_in.oidc.client_secret
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Server metadata URL, client ID, and client secret are required when enabling OIDC",
            )

    user_create = UserCreate.model_validate(user_in.model_dump(exclude={"oidc"}))

    # Override role to ensure first user is superuser
    user_create.role = UserRole.SUPERUSER

    # Check if username already exists (shouldn't happen, but just in case)
    existing_user = user_crud.get_user_by_username(session=session, username=user_create.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )

    user = user_crud.create_user(session=session, user_create=user_create)

    if user_in.oidc:
        create_or_update_oidc_settings(session, user_in.oidc)
        configure_oauth_client()

    return user
