from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AlertStatus(str, Enum):
    """Lifecycle status of an Early Warning System alert."""
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class AlertSeverity(str, Enum):
    """Urgency level of the alert."""
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertTriggerType(str, Enum):
    """Category of stress trigger that caused the alert."""
    DUTY_OVERLOAD = "DUTY_OVERLOAD"
    HARDSHIP_DEPLOYMENT = "HARDSHIP_DEPLOYMENT"
    LEAVE_DEPRIVATION = "LEAVE_DEPRIVATION"
    CLINICAL_SURVEY_DISTRESS = "CLINICAL_SURVEY_DISTRESS"
    COMPOSITE_ML_RISK = "COMPOSITE_ML_RISK"


class InterventionRecommendation(BaseModel):
    """Specific mitigation action generated for a welfare alert."""
    category: str = Field(..., description="Mitigation domain: OPERATIONAL_REST, SHIFT_ROTATION, LEAVE_GRANT, CLINICAL_REFERRAL")
    title: str = Field(..., description="Short intervention title")
    action: str = Field(..., description="Actionable execution steps for commander or medical officer")
    urgency: str = Field(..., description="IMMEDIATE, WITHIN_24H, WITHIN_7D")


class AlertBase(BaseModel):
    personnel_id: int = Field(..., description="Target personnel database identifier")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Predictive risk score at trigger time")
    risk_category: str = Field(..., description="HIGH or CRITICAL")
    trigger_type: AlertTriggerType = Field(..., description="Categorical stress trigger")
    title: str = Field(..., max_length=150, description="Short summary of the alert")
    description: str = Field(..., description="Detailed contributing stress factors")
    severity: AlertSeverity = Field(default=AlertSeverity.HIGH, description="Alert urgency")
    recommended_action: Optional[str] = Field(None, description="Suggested mitigation plan")


class AlertCreate(AlertBase):
    """Schema for creating a new alert."""
    pass


class AlertUpdate(BaseModel):
    """Schema for updating alert status or assignment."""
    status: Optional[AlertStatus] = None
    recommended_action: Optional[str] = None
    resolution_notes: Optional[str] = None


class AlertResolutionPayload(BaseModel):
    """Payload submitted when resolving or dismissing an alert."""
    action_taken: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Specific intervention executed (e.g. Granted 10-day leave, rotated from night duty)",
    )
    resolution_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Audit commentary and follow-up review schedule",
    )
    status: AlertStatus = Field(
        default=AlertStatus.RESOLVED,
        description="RESOLVED or DISMISSED",
    )


class AlertResponse(AlertBase):
    """Full alert response schema including lifecycle and audit telemetry."""
    id: int
    status: AlertStatus
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Personnel details for frontend display
    personnel_name: Optional[str] = None
    personnel_service_number: Optional[str] = None
    personnel_rank: Optional[str] = None
    personnel_unit: Optional[str] = None

    # Dynamic interventions
    interventions: List[InterventionRecommendation] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    """Paginated list of alerts."""
    items: List[AlertResponse]
    total: int
    skip: int
    limit: int


class AlertScanRequest(BaseModel):
    """Parameters for running an automated risk threshold scan."""
    unit: Optional[str] = Field(None, description="Optional unit filter; scans entire force if omitted")
    min_risk_threshold: float = Field(
        0.60,
        ge=0.40,
        le=1.0,
        description="Minimum risk score required to generate an alert (default: 0.60)",
    )


class AlertScanResult(BaseModel):
    """Summary of automated alert generation scan."""
    total_scanned: int
    alerts_created: int
    existing_active_skipped: int
    scan_timestamp: datetime
