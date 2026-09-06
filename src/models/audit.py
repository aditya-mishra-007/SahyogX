from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class AuditLog(Base):
    """
    Append-only security and operational audit trail.
    Records system access, analytical queries, alert handling, and data exports.
    """
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique audit event UUID",
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        comment="Username, service number, or subject identifier",
    )
    user_role: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        index=True,
        comment="Authorized role at event time: COMMANDER, MEDICAL_OFFICER, PERSONNEL, SYSTEM",
    )
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Action performed: LOGIN_SUCCESS, DATA_EXPORT, ALERT_ACKNOWLEDGE, etc.",
    )
    resource_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Resource type affected: PERSONNEL, ALERT, EXPORT, AUTH",
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Identifier of target entity",
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        comment="Client network IP address",
    )
    details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Structured context or JSON payload with sensitive PII scrubbed",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Timestamp when event occurred in UTC",
    )

    __table_args__ = (
        Index("ix_audit_logs_action_created", "action", "created_at"),
        Index("ix_audit_logs_user_created", "user_id", "created_at"),
    )
