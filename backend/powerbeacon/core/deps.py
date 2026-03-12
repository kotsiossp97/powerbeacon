from collections.abc import Generator
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from powerbeacon.core.db import engine
from powerbeacon.core import settings, security
from powerbeacon.models.generic import TokenPayload
from powerbeacon.models.users import User


reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, UUID(token_data.sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.role == "superuser":
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user


CurrentActiveSuperuser = Annotated[User, Depends(get_current_active_superuser)]


def get_user_management_access(current_user: CurrentUser) -> User:
    """Check if user has access to view users (user, admin, or superuser)"""
    if current_user.role not in ["user", "admin", "superuser"]:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user


UserManagementAccess = Annotated[User, Depends(get_user_management_access)]
