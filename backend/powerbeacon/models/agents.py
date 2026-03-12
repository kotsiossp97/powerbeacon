import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


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


class AgentPublic(AgentBase):
    """Public agent response model"""
    id: uuid.UUID
    status: AgentStatus
    last_seen: datetime
    created_at: datetime


class AgentsPublic(SQLModel):
    """List of public agents"""
    agents: list[AgentPublic]
    count: int
