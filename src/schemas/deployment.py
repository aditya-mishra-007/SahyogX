from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class DeploymentBase(BaseModel):
    personnel_id: int = Field(..., description="Target personnel database ID")
    location: str = Field(
        ...,
        max_length=100,
        description="Theatre, post, or sector",
        examples=["Siachen Glacier - Sector 4"],
    )
    deployment_type: str = Field(
        ...,
        max_length=50,
        description="HIGH_ALTITUDE, COUNTER_INSURGENCY, BORDER_OUTPOST, PEACE_STATION",
        examples=["HIGH_ALTITUDE"],
    )
    start_date: date = Field(..., description="Start date of deployment")
    end_date: Optional[date] = Field(None, description="End date (null if currently active)")
    operational_intensity: str = Field(
        default="MODERATE",
        max_length=30,
        description="LOW, MODERATE, HIGH, EXTREME",
        examples=["HIGH"],
    )
    status: str = Field(
        default="ACTIVE",
        max_length=30,
        description="ACTIVE, COMPLETED, TERMINATED",
        examples=["ACTIVE"],
    )
    notes: Optional[str] = Field(None, description="Operational remarks or terrain notes")

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self


class DeploymentCreate(DeploymentBase):
    pass


class DeploymentUpdate(BaseModel):
    location: Optional[str] = Field(None, max_length=100)
    deployment_type: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    operational_intensity: Optional[str] = Field(None, max_length=30)
    status: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self


class DeploymentResponse(DeploymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeploymentListResponse(BaseModel):
    items: List[DeploymentResponse]
    total: int
    skip: int
    limit: int
