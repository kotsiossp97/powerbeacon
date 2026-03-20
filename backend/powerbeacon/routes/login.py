import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from powerbeacon.core import security, settings
from powerbeacon.core.deps import CurrentUser, SessionDep
from powerbeacon.crud import user_crud
from powerbeacon.models.generic import Token
from powerbeacon.models.users import UserCreate, UserPublic
from powerbeacon.services.oidc import configure_oauth_client

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me")
async def get_current_user(current_user: CurrentUser) -> UserPublic:
    """
    Get current authenticated user info.
    """
    return current_user


@router.post("/login")
async def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = user_crud.authenticate(
        session=session, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    access_token_expires = dt.timedelta(hours=settings.jwt_expiration_hours)
    return Token(
        access_token=security.create_access_token(user.id, expires_delta=access_token_expires)
    )


@router.get("/login/oauth")
async def login_oidc(request: Request):
    redirect_uri = request.url_for("oauth_callback")
    oauth = configure_oauth_client()
    if not oauth:
        return RedirectResponse(url=request.url_for("login_access_token"))
    return await oauth.powerbeacon.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def oauth_callback(request: Request, db: SessionDep):
    """
    OAuth callback endpoint. After successful authentication, redirects back to frontend with token.
    """
    oauth = configure_oauth_client()
    if not oauth:
        return RedirectResponse(url=request.url_for("login_access_token"))
    token = await oauth.powerbeacon.authorize_access_token(request)
    user_info = token.get("userinfo")

    user = user_crud.get_user_by_username(session=db, username=user_info.get("preferred_username"))

    if not user:
        user_in = UserCreate(
            username=user_info.get("preferred_username"),
            email=user_info.get("email"),
            password=user_info.get("sub"),
            full_name=user_info.get("name"),
        )
        user = user_crud.create_user(session=db, user_create=user_in)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

    access_token_expires = dt.timedelta(hours=settings.jwt_expiration_hours)
    jwt_token = security.create_access_token(user.id, expires_delta=access_token_expires)

    # Redirect back to frontend with token
    frontend_url = f"{request.url.scheme}://{request.url.netloc}"
    return RedirectResponse(url=f"{frontend_url}/login?token={jwt_token}")
