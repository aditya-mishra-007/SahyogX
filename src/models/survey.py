from datetime import date
from typing import Optional
from sqlalchemy import Date, Float, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class WellnessSurvey(Base, TimestampMixin):
    """
    Self-reported and clinician-assisted wellness & psychological stress screening.
    Captures stress scores, sleep metrics, fatigue indices, and subjective wellbeing.
    """
    __tablename__ = "wellness_surveys"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    personnel_id: Mapped[int] = mapped_column(
        ForeignKey("personnel.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    survey_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
        comment="Date assessment was submitted",
    )
    stress_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Perceived stress level (0.0=No stress, 10.0=Severe crisis)",
    )
    sleep_quality_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Sleep quality rating (0.0=Insomnia/Disrupted, 10.0=Optimal rest)",
    )
    fatigue_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Exhaustion rating (0.0=Fully energized, 10.0=Chronic exhaustion)",
    )
    wellbeing_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="General morale and welfare score (0.0=Distress, 10.0=Thriving)",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Confidential counselor or individual remarks",
    )

    # Relational associations
    personnel: Mapped["Personnel"] = relationship(
        "Personnel",
        back_populates="surveys",
    )

    __table_args__ = (
        Index("ix_wellness_surveys_personnel_date", "personnel_id", "survey_date"),
        Index("ix_wellness_surveys_stress_fatigue", "stress_score", "fatigue_score"),
    )
