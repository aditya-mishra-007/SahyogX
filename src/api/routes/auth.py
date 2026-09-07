import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel, Field
from typing import Optional

from src.api.deps import get_current_user
from src.core.database import get_db
from src.core.security import create_access_token
from src.schemas.auth import Token
from src.schemas.user import UserResponse, UserRole
from src.services.audit_service import log_audit_event
from src.services.auth_service import authenticate_user_async, register_user_async

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    username: str = Field(..., description="Service number or username")
    password: str = Field(..., description="Password")
    role: UserRole = Field(default=UserRole.PERSONNEL, description="User role: PERSONNEL, COMMANDER, or MEDICAL_OFFICER")
    full_name: Optional[str] = Field(None, description="Display name and military rank")



@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User Login & JWT Token Generation",
    response_description="Returns signed JWT Bearer access token upon successful authentication",
)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Token:
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
    client_ip = request.client.host if request.client else None

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required",
        )

    user = await authenticate_user_async(username=username, password=password, db=db)
    if not user:
        logger.warning(f"Failed authentication attempt for username: '{username}'")
        await log_audit_event(
            db=db,
            action="LOGIN_FAILURE",
            user_id=username,
            resource_type="AUTH",
            ip_address=client_ip,
            details={"attempted_username": username, "reason": "INVALID_CREDENTIALS"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        await log_audit_event(
            db=db,
            action="LOGIN_FAILURE",
            user_id=user.username,
            resource_type="AUTH",
            ip_address=client_ip,
            details={"attempted_username": username, "reason": "ACCOUNT_DEACTIVATED"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(
        subject=user.username,
        role=user.role.value,
    )
    logger.info(f"User '{user.username}' successfully authenticated as role [{user.role.value}]")

    await log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        user_id=user.username,
        user_role=user.role.value,
        resource_type="AUTH",
        resource_id=user.id,
        ip_address=client_ip,
        details={"role": user.role.value},
    )

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


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    response_description="Registers user and returns JWT Bearer token",
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """
    Registers a new soldier or officer account.
    Once registered, the user can immediately log in anytime.
    """
    username = data.username.strip().lower()
    if not username or not data.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username / Service Number and password are required",
        )

    user = await register_user_async(
        username=username,
        password=data.password.strip(),
        role=data.role,
        full_name=data.full_name,
        db=db,
    )

    access_token = create_access_token(
        subject=user.username,
        role=user.role.value,
    )

    return Token(access_token=access_token, token_type="bearer")

