import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status

from src.api.deps import get_current_user
from src.core.security import create_access_token
from src.schemas.auth import Token
from src.schemas.user import UserResponse
from src.services.auth_service import authenticate_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User Login & JWT Token Generation",
    response_description="Returns signed JWT Bearer access token upon successful authentication",
)
async def login(request: Request) -> Token:
    """
    Authenticates user credentials and issues a signed JWT access token.
    Compatible with:
    - Standard JSON payload: `{"username": "...", "password": "..."}`
    - Form-data / OAuth2 payload: `application/x-www-form-urlencoded`
    """
    content_type = request.headers.get("content-type", "")
    username = ""
    password = ""

    if (
        "application/x-www-form-urlencoded" in content_type
        or "multipart/form-data" in content_type
    ):
        form = await request.form()
        username = form.get("username", "")
        password = form.get("password", "")
    else:
        try:
            body = await request.json()
            if isinstance(body, dict):
                username = body.get("username", "")
                password = body.get("password", "")
        except Exception:
            pass

    username = str(username).strip()
    password = str(password).strip()

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required",
        )

    user = authenticate_user(username=username, password=password)
    if not user:
        logger.warning(f"Failed authentication attempt for username: '{username}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(
        subject=user.username,
        role=user.role.value,
    )
    logger.info(f"User '{user.username}' successfully authenticated as role [{user.role.value}]")

    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile",
    response_description="Returns safe user details for the currently active session",
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Returns the authenticated user's profile and granted role.
    Requires a valid JWT Bearer token in the Authorization header.
    """
    return current_user
