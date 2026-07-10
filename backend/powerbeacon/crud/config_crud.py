"""CRUD operations for OIDC and other settings."""

from sqlmodel import Session, select

from powerbeacon.models.config import OIDCSettings, OIDCSettingsCreate
from powerbeacon.models.service_config import ServiceConfig, ServiceConfigCreate


def get_oidc_settings(session: Session) -> OIDCSettings | None:
    """Get the current OIDC settings. There should be only one row."""
    statement = select(OIDCSettings).limit(1)
    return session.exec(statement).first()


def create_or_update_oidc_settings(
    session: Session, settings_in: OIDCSettingsCreate
) -> OIDCSettings:
    """Create or update OIDC settings."""
    existing = get_oidc_settings(session)

    if existing:
        # Update existing
        existing.enabled = settings_in.enabled
        existing.server_metadata_url = settings_in.server_metadata_url
        existing.client_id = settings_in.client_id
        if settings_in.client_secret:
            existing.client_secret = settings_in.client_secret
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        db_obj = OIDCSettings.model_validate(settings_in)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj


def get_service_settings(
    session: Session, service_name: str | None = None
) -> list[ServiceConfig] | ServiceConfig | None:
    if service_name is None:
        statement = select(ServiceConfig)
        return session.exec(statement).all()

    statement = select(ServiceConfig).where(ServiceConfig.service_name == service_name).limit(1)
    return session.exec(statement).first()


def create_or_update_service_settings(
    session: Session,
    service_config_in: ServiceConfigCreate,
    should_update=True,
) -> ServiceConfig:
    """Create or update service settings."""
    existing = get_service_settings(session, service_config_in.service_name)

    if existing:
        if not should_update:
            return existing
        # Update existing
        existing.config_data = service_config_in.config_data
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        db_obj = ServiceConfig.model_validate(service_config_in)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj
