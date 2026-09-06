"""
Authentication Service (Database & Development Hybrid Implementation)
Seamlessly connects PostgreSQL-backed User model with Phase 1 development fallback.
"""

from typing import Dict, Optional
from dataclasses import dataclass
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.schemas.user import UserRole
from src.core.security import get_password_hash, verify_password

logger = logging.getLogger("sahyogx.auth_service")


@dataclass
class UserInDB:
    id: str
    username: str
    password_hash: str
    role: UserRole
    full_name: str
    is_active: bool = True


# Pre-hashed default credentials for development, fallback & Swagger testing
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
    """Retrieves a user by username from the static in-memory user registry."""
    return _PHASE1_DEV_USERS.get(username.strip().lower())


def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """Retrieves a user by ID from the static registry."""
    for user in _PHASE1_DEV_USERS.values():
        if user.id == user_id:
            return user
    return None


async def get_user_from_db_or_dev(
    db: Optional[AsyncSession],
    username: str,
) -> Optional[UserInDB]:
    """
    Retrieves user from PostgreSQL users table if available.
    Falls back smoothly to _PHASE1_DEV_USERS for testing and seed accounts.
    """
    clean_username = username.strip().lower()
    if db is not None:
        try:
            stmt = select(User).where(User.username == clean_username)
            res = await db.execute(stmt)
            db_user = res.scalar_one_or_none()
            if db_user:
                return UserInDB(
                    id=db_user.id,
                    username=db_user.username,
                    password_hash=db_user.password_hash,
                    role=UserRole(db_user.role),
                    full_name=db_user.full_name,
                    is_active=db_user.is_active,
                )
        except Exception as exc:
            logger.debug(f"DB lookup fallback to static registry: {exc}")

    return get_user_by_username(clean_username)


async def authenticate_user_async(
    username: str,
    password: str,
    db: Optional[AsyncSession] = None,
) -> Optional[UserInDB]:
    """
    Asynchronously authenticates a user against DB or fallback registry.
    """
    user = await get_user_from_db_or_dev(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """
    Synchronous authentication against static registry (backward compatibility).
    """
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
