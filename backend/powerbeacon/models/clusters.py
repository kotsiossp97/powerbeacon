import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from powerbeacon.models.agents import AgentPublic
from powerbeacon.models.devices import DevicePublic
from sqlalchemy import JSON, Column, DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from powerbeacon.models.agents import Agent
    from powerbeacon.models.devices import Device
    from powerbeacon.models.users import User


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class ClusterBase(SQLModel):
    name: str
    description: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))


class ClusterCreate(ClusterBase):
    device_ids: list[uuid.UUID] = Field(default_factory=list)
    agent_ids: list[uuid.UUID] = Field(default_factory=list)


class ClusterUpdate(SQLModel):
    name: str | None = None
    description: str | None = None
    tags: list[str] | None = None
    device_ids: list[uuid.UUID] | None = None
    agent_ids: list[uuid.UUID] | None = None


class Cluster(ClusterBase, table=True):
    __tablename__ = "clusters"

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
    owner: Optional["User"] = Relationship(back_populates="clusters")
    devices: list["Device"] = Relationship(back_populates="cluster")
    agents: list["Agent"] = Relationship(back_populates="cluster")


class ClusterPublic(ClusterBase):
    id: uuid.UUID
    owner_id: uuid.UUID | None = None
    owner_name: str | None = None
    device_count: int = 0
    agent_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClusterDetailPublic(ClusterPublic):
    devices: list[DevicePublic] = Field(default_factory=list)
    agents: list[AgentPublic] = Field(default_factory=list)


class ClustersPublic(SQLModel):
    clusters: list[ClusterPublic]
    count: int
