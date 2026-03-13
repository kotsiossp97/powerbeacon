import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from powerbeacon.models.clusters import Cluster
    from powerbeacon.models.devices import Device


class UserRole(str, Enum):
    SUPERUSER = "superuser"
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    username: str = Field(unique=True, index=True, max_length=255)
    email: str | None = Field(default=None, unique=True, index=True, max_length=255)
    is_active: bool = True
    role: UserRole = UserRole.VIEWER
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=5, max_length=128)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    username: str | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=5, max_length=128)
    email: str | None = Field(default=None, unique=True, index=True, max_length=255)  # type: ignore


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=5, max_length=128)
    new_password: str = Field(min_length=5, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    devices: list["Device"] = Relationship(back_populates="owner")
    clusters: list["Cluster"] = Relationship(back_populates="owner")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=5, max_length=128)
