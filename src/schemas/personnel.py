from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PersonnelBase(BaseModel):
    service_number: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Unique military service identifier (e.g. SX-10492)",
        examples=["SX-10492"],
    )
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Synthetic personnel name",
        examples=["Havildar Rajesh Kumar"],
    )
    rank: str = Field(
        ...,
        max_length=50,
        description="Military rank",
        examples=["Havildar"],
    )
    role: str = Field(
        ...,
        max_length=50,
        description="Specialty or trade (e.g. Infantry, Signals, Artillery)",
        examples=["Infantry"],
    )
    unit: str = Field(
        ...,
        max_length=100,
        description="Assigned battalion or regiment",
        examples=["14 Rajputana Rifles"],
    )
    joining_date: date = Field(
        ...,
        description="Enlistment or commission date",
        examples=["2018-04-15"],
    )
    status: str = Field(
        default="ACTIVE",
        max_length=30,
        description="ACTIVE, ON_LEAVE, DEPLOYED, HOSPITALISED, INACTIVE",
        examples=["ACTIVE"],
    )
    contact_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Synthetic contact email",
        examples=["rajesh.kumar@defence.synthetic"],
    )
    emergency_contact: Optional[str] = Field(
        None,
        max_length=100,
        description="Emergency contact identifier or relation",
        examples=["Spouse - Smt. Sunita Kumar"],
    )


class PersonnelCreate(PersonnelBase):
    pass


class PersonnelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    rank: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=100)
    joining_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=30)
    contact_email: Optional[str] = Field(None, max_length=100)
    emergency_contact: Optional[str] = Field(None, max_length=100)


class PersonnelResponse(PersonnelBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PersonnelListResponse(BaseModel):
    items: List[PersonnelResponse]
    total: int
    skip: int
    limit: int
