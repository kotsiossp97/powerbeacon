import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from powerbeacon.core.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
    UserManagementAccess,
)
from powerbeacon.crud import user_crud
from powerbeacon.models.generic import Message
from powerbeacon.models.users import (
    User,
    UserCreate,
    UserPublic,
    UsersPublic,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=UsersPublic)
async def list_users(
    session: SessionDep,
    current_user: UserManagementAccess,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users. Users with 'user' role can only see username, full_name, and created_at.
    Admins and superusers can see all user information.
    """
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    count_statement = select(User)
    count = len(session.exec(count_statement).all())

    # If user role is 'user', filter response to only show certain fields
    if current_user.role == "user":
        filtered_users = [
            UserPublic(
                id=user.id,
                username=user.username,
                full_name=user.full_name,
                created_at=user.created_at,
                email=None,
                role="user",  # Don't expose actual role
                is_active=True,  # Don't expose actual status
            )
            for user in users
        ]
        return UsersPublic(data=filtered_users, count=count)

    return UsersPublic(data=users, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
async def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = user_crud.get_user_by_username(session=session, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    user = user_crud.create_user(session=session, user_create=user_in)
    return user


@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if current_user.role != "superuser":
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch(
    "/{user_id}",
    response_model=UserPublic,
)
async def update_user(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    - Superuser: can update all fields (username, email, full_name, password, role, is_active)
    - Admin: can only update role and is_active
    - User/Viewer: cannot update other users (no access)
    """
    # Only superuser and admin can edit users
    if current_user.role not in ["superuser", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )

    # Admins can only edit role and is_active
    if current_user.role == "admin":
        if user_in.username or user_in.email or user_in.full_name or user_in.password:
            raise HTTPException(
                status_code=403,
                detail="Admins can only edit user role and active status",
            )

    # Check if changing username to one that already exists
    if user_in.username and user_in.username != db_user.username:
        existing_user = user_crud.get_user_by_username(session=session, username=user_in.username)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=409, detail="User with this username already exists")

    db_user = user_crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
async def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")
