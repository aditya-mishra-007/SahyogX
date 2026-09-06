"""
Authentication Service (Phase 1 Development Implementation)

NOTE: This service implements an in-memory user registry tailored for Phase 1
development, testing, and Swagger UI validation. In Phase 2, this service will
seamlessly connect to the real PostgreSQL-backed SQLAlchemy User and Personnel ORM models.
"""

from typing import Dict, Optional
from dataclasses import dataclass
from src.schemas.user import UserRole
from src.core.security import get_password_hash, verify_password


@dataclass
class UserInDB:
    id: str
    username: str
    password_hash: str
    role: UserRole
    full_name: str
    is_active: bool = True


# Pre-hashed default credentials for development & Swagger testing
# Passwords:
# - commander: commander123
# - medical:   medical123
# - personnel: personnel123
_PHASE1_DEV_USERS: Dict[str, UserInDB] = {
    "commander": UserInDB(
        id="usr-cmd-001",
        username="commander",
        password_hash=get_password_hash("commander123"),
        role=UserRole.COMMANDER,
        full_name="Col. R. Sharma (Commanding Officer)",
        is_active=True,
    ),
    "medical": UserInDB(
        id="usr-med-002",
        username="medical",
        password_hash=get_password_hash("medical123"),
        role=UserRole.MEDICAL_OFFICER,
        full_name="Maj. Dr. A. Verma (Regimental Medical Officer)",
        is_active=True,
    ),
    "personnel": UserInDB(
        id="usr-prs-003",
        username="personnel",
        password_hash=get_password_hash("personnel123"),
        role=UserRole.PERSONNEL,
        full_name="Hav. K. Singh",
        is_active=True,
    ),
}


def get_user_by_username(username: str) -> Optional[UserInDB]:
    """Retrieves a user by username from the user registry."""
    return _PHASE1_DEV_USERS.get(username.strip().lower())


def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """Retrieves a user by ID from the user registry."""
    for user in _PHASE1_DEV_USERS.values():
        if user.id == user_id:
            return user
    return None


def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """
    Authenticates a user by validating the username and plaintext password
    against the stored bcrypt hash.
    Returns UserInDB if credentials are valid, None otherwise.
    """
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
