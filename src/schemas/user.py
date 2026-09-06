from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """Uniformed forces system role definition for RBAC."""
    COMMANDER = "COMMANDER"
    MEDICAL_OFFICER = "MEDICAL_OFFICER"
    PERSONNEL = "PERSONNEL"


class UserBase(BaseModel):
    username: str = Field(..., description="Unique username or service number identifier")
    role: UserRole = Field(..., description="Assigned role controlling authorization tier")
    full_name: Optional[str] = Field(None, description="Display name and military rank")
    is_active: bool = Field(True, description="Account active status")


class UserResponse(UserBase):
    """Safe user profile response excluding confidential credentials."""
    id: str = Field(..., description="Unique identifier")

    model_config = {"from_attributes": True}
