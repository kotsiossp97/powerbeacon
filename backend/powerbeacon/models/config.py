import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class OIDCSettingsBase(SQLModel):
    """OIDC settings configuration."""

    enabled: bool = False
    server_metadata_url: str | None = Field(default=None, max_length=500)
    client_id: str | None = Field(default=None, max_length=255)
    client_secret: str | None = Field(default=None, max_length=1000)


class OIDCSettingsCreate(OIDCSettingsBase):
    """Create OIDC settings."""

    pass


class OIDCSettings(OIDCSettingsBase, table=True):
    """OIDC settings stored in database."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )


class OIDCSettingsPublic(OIDCSettingsBase):
    """Public OIDC settings (without secret)."""

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
