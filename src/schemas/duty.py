from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DutyBase(BaseModel):
    personnel_id: int = Field(..., description="Target personnel database ID")
    duty_date: date = Field(..., description="Date of duty assignment")
    duty_type: str = Field(
        ...,
        max_length=50,
        description="SENTRY, COMBAT_PATROL, CONVOY_ESCORT, NIGHT_GUARD, ADMINISTRATIVE",
        examples=["NIGHT_GUARD"],
    )
    hours_worked: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Hours worked in shift (0.0 to 24.0)",
        examples=[12.0],
    )
    night_duty: bool = Field(
        default=False,
        description="True if shift included night hours (22:00-06:00)",
        examples=[True],
    )
    consecutive_duty_days: int = Field(
        default=1,
        ge=1,
        description="Consecutive duty days without 24h rest break",
        examples=[3],
    )
    workload_score: float = Field(
        default=5.0,
        ge=1.0,
        le=10.0,
        description="Calculated or observed workload strain (1.0 to 10.0)",
        examples=[7.5],
    )


class DutyCreate(DutyBase):
    pass


class DutyUpdate(BaseModel):
    duty_date: Optional[date] = None
    duty_type: Optional[str] = Field(None, max_length=50)
    hours_worked: Optional[float] = Field(None, ge=0.0, le=24.0)
    night_duty: Optional[bool] = None
    consecutive_duty_days: Optional[int] = Field(None, ge=1)
    workload_score: Optional[float] = Field(None, ge=1.0, le=10.0)


class DutyResponse(DutyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DutyListResponse(BaseModel):
    items: List[DutyResponse]
    total: int
    skip: int
    limit: int


class DutyWorkloadSummary(BaseModel):
    personnel_id: int
    total_duty_records: int
    total_hours_worked: float
    total_night_duties: int
    average_hours_per_duty: float
    average_workload_score: float
    max_consecutive_duty_days: int
