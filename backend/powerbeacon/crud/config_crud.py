"""CRUD operations for OIDC settings."""

from sqlmodel import Session, select

from powerbeacon.models.config import OIDCSettings, OIDCSettingsCreate


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
