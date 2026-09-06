from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskBreakdown(BaseModel):
    """Distribution counts of personnel across the 4 risk tiers."""
    low: int = Field(0, description="Count in LOW risk tier")
    moderate: int = Field(0, description="Count in MODERATE risk tier")
    high: int = Field(0, description="Count in HIGH risk tier")
    critical: int = Field(0, description="Count in CRITICAL risk tier")


class UnitHeatmapItem(BaseModel):
    """Stress heatmap point for a specific military unit / battalion."""
    unit: str = Field(..., description="Battalion or regiment name")
    total_personnel: int = Field(..., description="Total strength of unit")
    average_risk_score: float = Field(..., description="Unit mean risk score [0.0 - 1.0]")
    risk_level: str = Field(..., description="Categorical classification: LOW, MODERATE, HIGH, CRITICAL")
    active_alerts_count: int = Field(0, description="Count of open/unresolved alerts")
    critical_alerts_count: int = Field(0, description="Count of active CRITICAL severity alerts")
    risk_breakdown: RiskBreakdown
    high_risk_percentage: float = Field(
        ...,
        description="Percentage of unit members falling in HIGH or CRITICAL risk tiers",
    )


class UnitHeatmapResponse(BaseModel):
    """Force-wide multi-unit stress risk heatmap."""
    units: List[UnitHeatmapItem]
    force_total_personnel: int
    force_average_risk_score: float
    most_vulnerable_unit: Optional[str] = None
    generated_at: datetime


class TheatreRiskMetric(BaseModel):
    """Risk analytics segmented by operational theatre and terrain difficulty."""
    theatre: str = Field(..., description="Operational area / deployment location")
    deployment_type: str = Field(..., description="Terrain: HIGH_ALTITUDE, COUNTER_INSURGENCY, BORDER_OUTPOST, etc.")
    active_deployments: int = Field(..., description="Number of currently deployed personnel")
    average_stress_score: float = Field(..., description="Mean stress score of deployed personnel")
    hardship_level: str = Field(..., description="Operational hardship: EXTREME, HIGH, MODERATE, LOW")


class TheatreRiskResponse(BaseModel):
    """Force-wide operational theatre risk distribution."""
    theatres: List[TheatreRiskMetric]
    total_active_deployments: int
    generated_at: datetime


class UnitWelfareSummary(BaseModel):
    """Deep-dive welfare and operational strain profile for a single battalion."""
    unit: str
    total_strength: int
    average_risk_score: float
    risk_level: str
    active_deployments_count: int
    average_duty_hours_past_30d: float
    average_night_duties_past_30d: float
    average_consecutive_duty_days: float
    leave_deprivation_rate: float = Field(
        ...,
        description="Percentage of soldiers who have not taken leave in over 180 days",
    )
    active_alerts_count: int
    critical_alerts_count: int
    risk_breakdown: RiskBreakdown
    generated_at: datetime
