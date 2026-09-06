from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from src.core.config import settings
from src.core.database import get_db
from src.core.security import decode_access_token
from src.schemas.user import UserResponse, UserRole
from src.services.auth_service import get_user_by_username

# OAuth2 scheme configured for Swagger UI Bearer Authorization
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    scheme_name="OAuth2PasswordBearer",
    description="Enter JWT Bearer token obtained from POST /api/v1/auth/login",
    auto_error=True,
)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """
    Decodes the JWT access token, validates claims and user existence,
    and returns the authenticated UserResponse object.
    Raises HTTP 401 Unauthorized if invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except (jwt.PyJWTError, Exception):
        raise credentials_exception

    user = get_user_by_username(username)
    if user is None or not user.is_active:
        raise credentials_exception

    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
        is_active=user.is_active,
    )


def require_role(*allowed_roles: UserRole) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Restricts endpoint execution to users possessing one of the allowed roles.
    Raises HTTP 403 Forbidden if user lacks sufficient privileges.
    """
    async def role_checker(
        current_user: UserResponse = Depends(get_current_user),
    ) -> UserResponse:
        if current_user.role not in allowed_roles:
            role_names = ", ".join(r.value for r in allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role(s): {role_names}",
            )
        return current_user

    return role_checker


# Named RBAC dependencies for clean route definitions
require_commander = require_role(UserRole.COMMANDER)
require_medical_officer = require_role(UserRole.MEDICAL_OFFICER)
require_personnel = require_role(UserRole.PERSONNEL)
