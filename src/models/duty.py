from datetime import date
from sqlalchemy import Boolean, Date, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class DutyLog(Base, TimestampMixin):
    """
    Daily operational workload and duty shift record.
    Tracks duty duration, night shifts, and cumulative fatigue metrics.
    """
    __tablename__ = "duty_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    personnel_id: Mapped[int] = mapped_column(
        ForeignKey("personnel.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    duty_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
        comment="Date duty was performed",
    )
    duty_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="SENTRY, COMBAT_PATROL, CONVOY_ESCORT, NIGHT_GUARD, ADMINISTRATIVE",
    )
    hours_worked: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Total hours on duty within 24-hour cycle (0.0 to 24.0)",
    )
    night_duty: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Flag indicating shift included night hours (22:00-06:00)",
    )
    consecutive_duty_days: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="Consecutive active duty days without a 24h rest period",
    )
    workload_score: Mapped[float] = mapped_column(
        Float,
        default=5.0,
        nullable=False,
        comment="Subjective/calculated duty intensity rating (1.0 to 10.0)",
    )

    # Relational associations
    personnel: Mapped["Personnel"] = relationship(
        "Personnel",
        back_populates="duty_logs",
    )

    __table_args__ = (
        Index("ix_duty_logs_personnel_date", "personnel_id", "duty_date"),
        Index("ix_duty_logs_night_consecutive", "night_duty", "consecutive_duty_days"),
    )
