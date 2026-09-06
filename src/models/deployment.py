from datetime import date
from typing import Optional
from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class Deployment(Base, TimestampMixin):
    """
    Personnel field deployment and posting history.
    Tracks high-altitude, operational hardship, and operational rotation.
    """
    __tablename__ = "deployments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    personnel_id: Mapped[int] = mapped_column(
        ForeignKey("personnel.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    location: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
        comment="Theatre or post location (e.g. Siachen, Kupwara, Thar)",
    )
    deployment_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="HIGH_ALTITUDE, COUNTER_INSURGENCY, BORDER_OUTPOST, PEACE_STATION",
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Deployment start date",
    )
    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        comment="Deployment conclusion date (null if currently active)",
    )
    operational_intensity: Mapped[str] = mapped_column(
        String(30),
        default="MODERATE",
        nullable=False,
        comment="LOW, MODERATE, HIGH, EXTREME",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
        index=True,
        nullable=False,
        comment="ACTIVE, COMPLETED, TERMINATED",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Terrain/operational context and observations",
    )

    # Relational associations
    personnel: Mapped["Personnel"] = relationship(
        "Personnel",
        back_populates="deployments",
    )

    __table_args__ = (
        Index("ix_deployments_personnel_dates", "personnel_id", "start_date"),
        Index("ix_deployments_status_type", "status", "deployment_type"),
    )
