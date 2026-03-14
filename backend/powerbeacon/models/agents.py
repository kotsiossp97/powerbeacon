import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Optional

from powerbeacon.models.links import DeviceAgentLink
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from powerbeacon.models.clusters import Cluster
    from powerbeacon.models.devices import Device


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class AgentOS(str, Enum):
    LINUX = "linux"
    WINDOWS = "windows"
    DARWIN = "darwin"


class AgentStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"


class AgentBase(SQLModel):
    hostname: str
    ip: str = Field(max_length=45, index=True)  # Support IPv6
    port: int = Field(default=18080)  # Port the agent API listens on
    os: AgentOS
    version: str
    cluster_id: uuid.UUID | None = Field(default=None, foreign_key="clusters.id", index=True)


class AgentRegistration(SQLModel):
    """Agent registration request payload"""

    hostname: str
    ip: str
    port: int = 18080
    os: str
    version: str


class AgentRegistrationResponse(SQLModel):
    """Agent registration response"""

    agent_id: str
    token: str


class AgentHeartbeat(SQLModel):
    """Agent heartbeat request payload"""

    agent_id: str


class Agent(AgentBase, table=True):
    """Agent database model"""

    __tablename__ = "agents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    token: str = Field(index=True)  # Authentication token for agent
    status: AgentStatus = Field(default=AgentStatus.OFFLINE)
    last_seen: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    cluster: Optional["Cluster"] = Relationship(back_populates="agents")
    devices: list["Device"] = Relationship(
        back_populates="agents",
        link_model=DeviceAgentLink,
    )


class AgentPublic(AgentBase):
    """Public agent response model"""

    id: uuid.UUID
    owner_id: uuid.UUID | None = None
    owner_name: str | None = None
    status: AgentStatus
    last_seen: datetime
    created_at: datetime
    cluster_name: str | None = None
    device_count: int = 0


class AgentsPublic(SQLModel):
    """List of public agents"""

    agents: list[AgentPublic]
    count: int
