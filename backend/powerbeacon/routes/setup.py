"""
Setup and onboarding routes
"""

from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select

from powerbeacon.core.deps import SessionDep
from powerbeacon.crud import user_crud
from powerbeacon.models.users import User, UserCreate, UserPublic, UserRole

router = APIRouter(prefix="/setup", tags=["Setup"])


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
async def initialize_system(*, session: SessionDep, user_in: UserCreate) -> Any:
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

    # Override role to ensure first user is superuser
    user_in.role = UserRole.SUPERUSER

    # Check if username already exists (shouldn't happen, but just in case)
    existing_user = user_crud.get_user_by_username(
        session=session, username=user_in.username
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )

    user = user_crud.create_user(session=session, user_create=user_in)
    return user
