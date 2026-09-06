from datetime import date
from typing import List, Optional
from sqlalchemy import Date, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class Personnel(Base, TimestampMixin):
    """
    Uniformed forces personnel entity.
    Stores core identity, rank, regiment, and service status.
    """
    __tablename__ = "personnel"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    service_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique military service identifier (e.g. SX-10492)",
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Synthetic personnel display name",
    )
    rank: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="Military rank (e.g., Sepoy, Havildar, Subedar, Captain)",
    )
    role: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="Corps or operational specialty (e.g., Infantry, Signals, Medical)",
    )
    unit: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
        comment="Assigned battalion or regiment",
    )
    joining_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Date of commission or enlistment",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
        index=True,
        nullable=False,
        comment="ACTIVE, ON_LEAVE, DEPLOYED, HOSPITALISED, INACTIVE",
    )
    contact_email: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Synthetic official contact email",
    )
    emergency_contact: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Emergency contact identifier",
    )

    # Relational associations
    deployments: Mapped[List["Deployment"]] = relationship(
        "Deployment",
        back_populates="personnel",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    duty_logs: Mapped[List["DutyLog"]] = relationship(
        "DutyLog",
        back_populates="personnel",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    leaves: Mapped[List["LeaveRecord"]] = relationship(
        "LeaveRecord",
        back_populates="personnel",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    surveys: Mapped[List["WellnessSurvey"]] = relationship(
        "WellnessSurvey",
        back_populates="personnel",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="personnel",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_personnel_unit_rank", "unit", "rank"),
        Index("ix_personnel_status_unit", "status", "unit"),
    )
