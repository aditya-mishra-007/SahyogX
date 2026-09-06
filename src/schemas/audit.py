from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AuditActionType(str, Enum):
    """Enumeration of audited security and operational actions."""
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILURE = "LOGIN_FAILURE"
    DATA_EXPORT_CSV = "DATA_EXPORT_CSV"
    DATA_EXPORT_JSON = "DATA_EXPORT_JSON"
    ALERT_ACKNOWLEDGE = "ALERT_ACKNOWLEDGE"
    ALERT_RESOLVE = "ALERT_RESOLVE"
    ALERT_DISMISS = "ALERT_DISMISS"
    ALERT_CREATE = "ALERT_CREATE"
    PREDICTION_RUN = "PREDICTION_RUN"
    PERSONNEL_CREATE = "PERSONNEL_CREATE"
    SURVEY_SUBMIT = "SURVEY_SUBMIT"
    SYSTEM_READY_CHECK = "SYSTEM_READY_CHECK"


class AuditLogResponse(BaseModel):
    """Schema for individual audit log entry representation."""
    id: str = Field(..., description="Unique audit event UUID")
    user_id: Optional[str] = Field(None, description="Username or subject identifier")
    user_role: Optional[str] = Field(None, description="Authorized user role at event time")
    action: str = Field(..., description="Audit action category")
    resource_type: Optional[str] = Field(None, description="Target entity type")
    resource_id: Optional[str] = Field(None, description="Target entity identifier")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    details: Optional[str] = Field(None, description="Event details or parameters (sanitized)")
    created_at: datetime = Field(..., description="UTC event timestamp")

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log queries."""
    total: int = Field(..., description="Total matching audit records")
    page: int = Field(..., description="Current page index")
    page_size: int = Field(..., description="Items per page")
    items: List[AuditLogResponse] = Field(..., description="Audit records for current page")
