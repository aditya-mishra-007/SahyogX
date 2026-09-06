from datetime import date
from typing import Optional
from sqlalchemy import Date, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class LeaveRecord(Base, TimestampMixin):
    """
    Personnel leave entitlement and utilization tracking.
    Critical indicator for predicting leave deprivation and chronic burnout.
    """
    __tablename__ = "leave_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    personnel_id: Mapped[int] = mapped_column(
        ForeignKey("personnel.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    leave_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="ANNUAL, CASUAL, COMPASSIONATE, MEDICAL",
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Start date of requested leave",
    )
    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="End date of requested leave",
    )
    duration_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Total inclusive leave days",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        index=True,
        nullable=False,
        comment="PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED",
    )
    reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Stated reason or welfare context",
    )

    # Relational associations
    personnel: Mapped["Personnel"] = relationship(
        "Personnel",
        back_populates="leaves",
    )

    __table_args__ = (
        Index("ix_leave_records_personnel_dates", "personnel_id", "start_date"),
        Index("ix_leave_records_status_type", "status", "leave_type"),
    )
