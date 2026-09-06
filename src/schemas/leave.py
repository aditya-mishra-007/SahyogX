from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class LeaveBase(BaseModel):
    personnel_id: int = Field(..., description="Target personnel database ID")
    leave_type: str = Field(
        ...,
        max_length=50,
        description="ANNUAL, CASUAL, COMPASSIONATE, MEDICAL",
        examples=["ANNUAL"],
    )
    start_date: date = Field(..., description="Leave commencement date")
    end_date: date = Field(..., description="Leave expiration date")
    duration_days: Optional[int] = Field(
        None,
        ge=1,
        description="Duration in days (auto-calculated from start and end dates if omitted)",
    )
    status: str = Field(
        default="PENDING",
        max_length=30,
        description="PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED",
        examples=["PENDING"],
    )
    reason: Optional[str] = Field(None, description="Stated reason for leave")

    @model_validator(mode="after")
    def calculate_and_validate_duration(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        computed_days = (self.end_date - self.start_date).days + 1
        if self.duration_days is None:
            self.duration_days = computed_days
        return self


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    leave_type: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, max_length=30)
    reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValueError("end_date cannot be earlier than start_date")
            if self.duration_days is None:
                self.duration_days = (self.end_date - self.start_date).days + 1
        return self


class LeaveResponse(BaseModel):
    id: int
    personnel_id: int
    leave_type: str
    start_date: date
    end_date: date
    duration_days: int
    status: str
    reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaveListResponse(BaseModel):
    items: List[LeaveResponse]
    total: int
    skip: int
    limit: int
