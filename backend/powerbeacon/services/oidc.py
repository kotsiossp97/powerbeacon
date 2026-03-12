from authlib.integrations.starlette_client import OAuth
from powerbeacon.core.db import engine
from sqlmodel import Session
from powerbeacon.crud.config_crud import (
    get_oidc_settings,
)

oauth = OAuth()


def configure_oauth_client():
    # Fetch config from database
    with Session(engine) as session:
        oidc_settings = get_oidc_settings(session)
    if not oidc_settings:
        return None

    # Unregister existing client if it exists to avoid duplicates on config update
    if "powerbeacon" in oauth._clients:
        del oauth._clients["powerbeacon"]

    oauth.register(
        name="powerbeacon",
        client_id=oidc_settings.client_id,
        client_secret=oidc_settings.client_secret,
        server_metadata_url=oidc_settings.server_metadata_url,
        client_kwargs={"scope": "openid profile email"},
    )
    oauth.create_client("powerbeacon")
    return oauth
