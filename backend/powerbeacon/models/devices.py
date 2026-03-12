import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Column, JSON
from sqlmodel import Field, SQLModel
from enum import Enum


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class OSType(str, Enum):
    LINUX = "linux"
    WINDOWS = "windows"
    MACOS = "macos"


class DeviceBase(SQLModel):
    name: str
    mac_address: str = Field(unique=True, index=True)
    ip_address: str | None = Field(default=None, max_length=20, index=True)
    os_type: OSType
    is_active: bool = True
    description: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    agent_id: uuid.UUID | None = Field(
        default=None, foreign_key="agents.id", index=True
    )


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(DeviceBase):
    ip: str | None = None
    mac: str | None = None


class Device(DeviceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID | None = Field(default=None, index=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )


class DevicePublic(DeviceBase):
    id: uuid.UUID
    created_at: datetime | None = None
    owner_name: str | None = None
    agent_hostname: str | None = None


class DevicesPublic(SQLModel):
    devices: list[DevicePublic]
    count: int
