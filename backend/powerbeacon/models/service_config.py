import uuid
from datetime import datetime, timezone

from pydantic import BaseModel
from sqlalchemy import DateTime
from sqlmodel import JSON, Column, Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class ServiceConfigBase(SQLModel):
    """Service configuration settings."""

    service_name: str
    config_data: dict | None = Field(default=None, sa_column=Column(JSON))


class ServiceConfigCreate(ServiceConfigBase):
    """Create service configuration settings."""

    pass


class ServiceConfig(ServiceConfigBase, table=True):
    """Service configuration settings stored in database."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )


class ServiceConfigPublic(ServiceConfigBase):
    """Public service configuration settings (without secret)."""

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


## Response Models
class ServiceSettings(BaseModel):
    service_name: str
    config_data: dict | None = None
    updated_at: datetime | None = None
