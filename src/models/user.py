from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """
    Uniformed system account entity.
    Stores credential hashes and authorization tiers for authentication.
    """
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        comment="Unique user UUID or identifier",
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique login username or official service number",
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Bcrypt password hash",
    )
    role: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
        comment="COMMANDER, MEDICAL_OFFICER, PERSONNEL",
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Official display name and military rank",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Account active status",
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of most recent successful authentication",
    )

    __table_args__ = (
        Index("ix_users_role_status", "role", "is_active"),
    )
