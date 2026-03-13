import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Optional

from powerbeacon.models.links import DeviceAgentLink
from sqlalchemy import JSON, Column, DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from powerbeacon.models.agents import Agent
    from powerbeacon.models.clusters import Cluster
    from powerbeacon.models.users import User


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class OSType(str, Enum):
    LINUX = "linux"
    WINDOWS = "windows"
    MACOS = "macos"


class DeviceBase(SQLModel):
    name: str
    mac_address: str = Field(unique=True, index=True)
    ip_address: str | None = Field(default=None, max_length=45, index=True)
    os_type: OSType
    is_active: bool = True
    description: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    cluster_id: uuid.UUID | None = Field(default=None, foreign_key="clusters.id", index=True)


class DeviceCreate(DeviceBase):
    agent_ids: list[uuid.UUID] = Field(default_factory=list)


class DeviceUpdate(SQLModel):
    name: str | None = None
    mac_address: str | None = None
    ip_address: str | None = None
    os_type: OSType | None = None
    is_active: bool | None = None
    description: str | None = None
    tags: list[str] | None = None
    cluster_id: uuid.UUID | None = None
    agent_ids: list[uuid.UUID] | None = None


class Device(DeviceBase, table=True):
    __tablename__ = "devices"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", index=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    owner: Optional["User"] = Relationship(back_populates="devices")
    cluster: Optional["Cluster"] = Relationship(back_populates="devices")
    agents: list["Agent"] = Relationship(
        back_populates="devices",
        link_model=DeviceAgentLink,
    )


class DeviceAgentPublic(SQLModel):
    id: uuid.UUID
    hostname: str
    ip: str
    status: str


class DevicePublic(DeviceBase):
    id: uuid.UUID
    owner_id: uuid.UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    owner_name: str | None = None
    cluster_name: str | None = None
    agents: list[DeviceAgentPublic] = Field(default_factory=list)


class DevicesPublic(SQLModel):
    devices: list[DevicePublic]
    count: int
