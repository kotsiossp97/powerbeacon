import uuid

from sqlmodel import Field, SQLModel


class DeviceAgentLink(SQLModel, table=True):
    __tablename__ = "device_agent_links"

    device_id: uuid.UUID = Field(foreign_key="devices.id", primary_key=True)
    agent_id: uuid.UUID = Field(foreign_key="agents.id", primary_key=True)
