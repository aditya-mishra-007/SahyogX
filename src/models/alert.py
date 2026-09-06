from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class Alert(Base, TimestampMixin):
    """
    Early Warning System (EWS) Alert entity.
    Tracks critical stress triggers, acute fatigue risks, and intervention lifecycle.
    """
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    personnel_id: Mapped[int] = mapped_column(
        ForeignKey("personnel.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    risk_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Calculated stress risk score at time of alert creation [0.0 - 1.0]",
    )
    risk_category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        comment="HIGH or CRITICAL",
    )
    trigger_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="DUTY_OVERLOAD, HARDSHIP_DEPLOYMENT, LEAVE_DEPRIVATION, CLINICAL_SURVEY_DISTRESS, COMPOSITE_ML_RISK",
    )
    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Short summary of the welfare alert",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Detailed breakdown of the contributing operational stressors",
    )
    severity: Mapped[str] = mapped_column(
        String(30),
        default="HIGH",
        nullable=False,
        comment="HIGH or CRITICAL",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="NEW",
        index=True,
        nullable=False,
        comment="NEW, ACKNOWLEDGED, IN_REVIEW, RESOLVED, DISMISSED",
    )
    recommended_action: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Recommended mitigation intervention (R&R, shift rotation, clinical referral)",
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Audit remarks recording the specific actions taken upon resolution",
    )
    resolved_by: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Username or service number of authorizing officer who resolved the alert",
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when alert was resolved or dismissed",
    )

    # Relational associations
    personnel: Mapped["Personnel"] = relationship(
        "Personnel",
        back_populates="alerts",
    )

    __table_args__ = (
        Index("ix_alerts_status_severity", "status", "severity"),
        Index("ix_alerts_personnel_status", "personnel_id", "status"),
        Index("ix_alerts_created_at", "created_at"),
    )
