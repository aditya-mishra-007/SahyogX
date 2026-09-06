from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SurveyBase(BaseModel):
    personnel_id: int = Field(..., description="Target personnel database ID")
    survey_date: date = Field(..., description="Date survey was taken")
    stress_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="Perceived stress level (0.0=None, 10.0=Extreme)",
        examples=[4.5],
    )
    sleep_quality_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="Sleep quality rating (0.0=Severe insomnia, 10.0=Optimal rest)",
        examples=[7.0],
    )
    fatigue_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="Physical and mental exhaustion (0.0=Energetic, 10.0=Severe exhaustion)",
        examples=[3.5],
    )
    wellbeing_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="Overall subjective morale and welfare (0.0=Low, 10.0=Thriving)",
        examples=[8.0],
    )
    notes: Optional[str] = Field(None, description="Confidential observations or comments")


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(BaseModel):
    survey_date: Optional[date] = None
    stress_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    sleep_quality_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    fatigue_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    wellbeing_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    notes: Optional[str] = None


class SurveyResponse(SurveyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SurveyListResponse(BaseModel):
    items: List[SurveyResponse]
    total: int
    skip: int
    limit: int


class SurveyAggregationResponse(BaseModel):
    personnel_id: int
    total_surveys: int
    average_stress_score: float
    average_sleep_quality_score: float
    average_fatigue_score: float
    average_wellbeing_score: float
    latest_survey_date: Optional[date] = None
    stress_risk_indicator: str = Field(
        ...,
        description="Calculated qualitative risk level: LOW, MODERATE, HIGH, CRITICAL",
    )
