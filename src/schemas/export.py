from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ExportFormat(str, Enum):
    """Supported data export formats."""
    CSV = "csv"
    JSON = "json"


class ExportMetadata(BaseModel):
    """Metadata envelope for security compliance and audit tracing."""
    unit: str = Field(..., description="Tactical military unit code")
    exported_by: str = Field(..., description="Username of exporting officer")
    exporter_role: str = Field(..., description="Role of authorizing user")
    export_timestamp: datetime = Field(..., description="UTC timestamp of report generation")
    record_count: int = Field(..., description="Total personnel or alert records included")
    data_classification: str = Field(
        default="OFFICIAL / RESTRICTED",
        description="Data classification label",
    )
    pii_redacted: bool = Field(
        default=True,
        description="Whether sensitive clinical or personal identifiers were redacted",
    )

    model_config = ConfigDict(from_attributes=True)


class UnitExportItem(BaseModel):
    """Sanitized personnel welfare and operational record for unit export."""
    service_number: str = Field(..., description="Official military service identifier")
    name: str = Field(..., description="Personnel full name")
    rank: str = Field(..., description="Military rank designation")
    unit: str = Field(..., description="Tactical unit assignment")
    current_role: str = Field(..., description="Functional duty role")
    is_active: bool = Field(..., description="Active duty status")
    total_deployments: int = Field(0, description="Total active/historical deployments")
    total_duty_shifts: int = Field(0, description="Total logged duty shifts")
    total_surveys: int = Field(0, description="Total wellness surveys completed")
    latest_risk_score: Optional[float] = Field(None, description="Most recent composite risk score [0.0 - 1.0]")
    latest_risk_category: Optional[str] = Field(None, description="LOW, MODERATE, HIGH, CRITICAL")
    active_alerts_count: int = Field(0, description="Unresolved warning alerts currently active")

    model_config = ConfigDict(from_attributes=True)


class UnitExportPayload(BaseModel):
    """Complete JSON export payload containing metadata and records."""
    metadata: ExportMetadata = Field(..., description="Export compliance metadata")
    records: List[UnitExportItem] = Field(..., description="Personnel welfare records")

    model_config = ConfigDict(from_attributes=True)
