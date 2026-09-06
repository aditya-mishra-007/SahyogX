from typing import Optional
from pydantic import BaseModel, Field
from src.schemas.user import UserRole


class Token(BaseModel):
    """OAuth2 standard bearer token response."""
    access_token: str = Field(..., description="Signed JWT access token")
    token_type: str = Field("bearer", description="Token type prefix")


class TokenPayload(BaseModel):
    """Parsed JWT claims payload."""
    sub: Optional[str] = None
    role: Optional[UserRole] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    """JSON credentials payload for login."""
    username: str = Field(..., description="Registered username or service number")
    password: str = Field(..., description="Account password")
