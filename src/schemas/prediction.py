from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskCategory(str, Enum):
    """Normalized stress risk tiers for military personnel."""
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PredictionSource(str, Enum):
    """Source engine producing the prediction."""
    ML_MODEL = "ML_MODEL"
    HEURISTIC_BASELINE = "HEURISTIC_BASELINE"


class RiskFactor(BaseModel):
    """Single contributing risk factor identifying stressors."""
    factor_name: str = Field(..., description="Machine-readable stressor code")
    impact_level: RiskCategory = Field(..., description="Contribution severity category")
    description: str = Field(..., description="Explainable human-readable rationale")
    score_contribution: float = Field(
        ...,
        description="Additive risk score contribution (e.g., +0.15)",
        ge=0.0,
        le=1.0,
    )


class PersonnelStressFeatures(BaseModel):
    """
    ML-ready aggregated feature representation extracted from personnel,
    duty logs, operational deployments, leave history, and wellness surveys.
    """
    personnel_id: int = Field(..., description="Personnel database identifier")
    service_number: str = Field(..., description="Official military service number")
    service_months: int = Field(..., description="Total cumulative service months", ge=0)

    # Duty & Operational Workload Features (30-day window)
    recent_duty_hours: float = Field(
        ...,
        description="Total duty hours logged over recent 30 days",
        ge=0.0,
    )
    recent_night_duties: int = Field(
        ...,
        description="Number of night sentry/patrol shifts over recent 30 days",
        ge=0,
    )
    recent_max_consecutive_days: int = Field(
        ...,
        description="Maximum consecutive duty days without a 24h rest period",
        ge=0,
    )
    avg_workload_score: float = Field(
        ...,
        description="Average duty workload rating (1.0 - 10.0)",
        ge=1.0,
        le=10.0,
    )

    # Deployment Features
    has_active_deployment: bool = Field(
        ...,
        description="Whether personnel is currently on operational deployment",
    )
    active_deployment_days: int = Field(
        ...,
        description="Duration in days of active operational deployment",
        ge=0,
    )
    active_deployment_intensity: str = Field(
        ...,
        description="Intensity rating of active posting (EXTREME, HIGH, MODERATE, LOW, NONE)",
    )
    active_deployment_type: str = Field(
        ...,
        description="Type of active posting (e.g., HIGH_ALTITUDE, COUNTER_INSURGENCY, NONE)",
    )
    lifetime_hardship_deployments: int = Field(
        ...,
        description="Count of lifetime high-intensity / hardship deployments",
        ge=0,
    )

    # Leave & Recovery Features
    days_since_last_leave: int = Field(
        ...,
        description="Elapsed days since conclusion of last approved leave period",
        ge=0,
    )
    total_leave_days_past_year: int = Field(
        ...,
        description="Total approved leave days taken in the preceding 365 days",
        ge=0,
    )
    rejected_leave_requests: int = Field(
        ...,
        description="Count of denied or rejected leave applications",
        ge=0,
    )

    # Clinical & Subjective Wellness Features
    has_survey_data: bool = Field(
        ...,
        description="Whether personnel has submitted any wellness surveys",
    )
    latest_stress_score: float = Field(
        ...,
        description="Self-reported stress score from latest survey (0.0 to 10.0)",
        ge=0.0,
        le=10.0,
    )
    latest_sleep_quality_score: float = Field(
        ...,
        description="Self-reported sleep quality from latest survey (0.0 to 10.0)",
        ge=0.0,
        le=10.0,
    )
    latest_fatigue_score: float = Field(
        ...,
        description="Self-reported exhaustion/fatigue rating (0.0 to 10.0)",
        ge=0.0,
        le=10.0,
    )
    latest_wellbeing_score: float = Field(
        ...,
        description="Self-reported general welfare morale rating (0.0 to 10.0)",
        ge=0.0,
        le=10.0,
    )
    avg_stress_score_past_90d: float = Field(
        ...,
        description="Mean stress score across surveys in past 90 days",
        ge=0.0,
        le=10.0,
    )
    avg_sleep_score_past_90d: float = Field(
        ...,
        description="Mean sleep quality score across surveys in past 90 days",
        ge=0.0,
        le=10.0,
    )
    flagged_for_counselor: bool = Field(
        ...,
        description="Whether any survey has severe risk flags or counselor referrals",
    )

    def to_vector(self) -> List[float]:
        """
        Transforms features into a normalized float vector [0.0 - 1.0]
        suitable for tabular ML inference (e.g., Random Forest, Gradient Boosting).
        """
        return [
            min(self.service_months / 240.0, 1.0),
            min(self.recent_duty_hours / 300.0, 1.0),
            min(self.recent_night_duties / 20.0, 1.0),
            min(self.recent_max_consecutive_days / 15.0, 1.0),
            (self.avg_workload_score - 1.0) / 9.0,
            1.0 if self.has_active_deployment else 0.0,
            min(self.active_deployment_days / 365.0, 1.0),
            1.0 if self.active_deployment_intensity == "EXTREME" else (
                0.75 if self.active_deployment_intensity == "HIGH" else (
                    0.5 if self.active_deployment_intensity == "MODERATE" else 0.2
                )
            ),
            1.0 if self.active_deployment_type in ("HIGH_ALTITUDE", "COUNTER_INSURGENCY") else 0.3,
            min(self.lifetime_hardship_deployments / 5.0, 1.0),
            min(self.days_since_last_leave / 365.0, 1.0),
            min(self.total_leave_days_past_year / 60.0, 1.0),
            min(self.rejected_leave_requests / 3.0, 1.0),
            self.latest_stress_score / 10.0,
            (10.0 - self.latest_sleep_quality_score) / 10.0,  # Invert so higher = more risk
            self.latest_fatigue_score / 10.0,
            (10.0 - self.latest_wellbeing_score) / 10.0,  # Invert so higher = more risk
            self.avg_stress_score_past_90d / 10.0,
            1.0 if self.flagged_for_counselor else 0.0,
        ]


class StressPredictionResponse(BaseModel):
    """Complete, validated predictive stress risk response."""
    personnel_id: int = Field(..., description="Target personnel database ID")
    service_number: str = Field(..., description="Target military service number")
    risk_score: float = Field(
        ...,
        description="Calculated composite stress risk score bounded in [0.0, 1.0]",
        ge=0.0,
        le=1.0,
    )
    risk_category: RiskCategory = Field(
        ...,
        description="Categorical risk tier: LOW, MODERATE, HIGH, CRITICAL",
    )
    prediction_source: PredictionSource = Field(
        ...,
        description="Source of prediction (ML_MODEL or HEURISTIC_BASELINE)",
    )
    model_name: str = Field(..., description="Active prediction model identifier")
    model_version: str = Field(..., description="Active prediction model version")
    confidence_score: float = Field(
        ...,
        description="Estimated confidence level in prediction [0.0, 1.0]",
        ge=0.0,
        le=1.0,
    )
    predicted_at: datetime = Field(
        ...,
        description="UTC timestamp when prediction was generated",
    )
    primary_risk_factors: List[RiskFactor] = Field(
        default_factory=list,
        description="Ordered list of primary stress contributors and reasons",
    )
    features_summary: PersonnelStressFeatures = Field(
        ...,
        description="Aggregated input features used for inference",
    )


class UnitStressRiskSummary(BaseModel):
    """Aggregated stress risk distribution for an entire military battalion/unit."""
    unit: str = Field(..., description="Battalion or regiment name")
    total_evaluated: int = Field(..., description="Total personnel evaluated in unit", ge=0)
    low_risk_count: int = Field(0, description="Personnel in LOW risk category", ge=0)
    moderate_risk_count: int = Field(0, description="Personnel in MODERATE risk category", ge=0)
    high_risk_count: int = Field(0, description="Personnel in HIGH risk category", ge=0)
    critical_risk_count: int = Field(0, description="Personnel in CRITICAL risk category", ge=0)
    unit_average_risk_score: float = Field(
        0.0,
        description="Average risk score across all unit members [0.0, 1.0]",
        ge=0.0,
        le=1.0,
    )
    personnel_predictions: List[StressPredictionResponse] = Field(
        default_factory=list,
        description="Individual member predictions",
    )


class ModelStatusResponse(BaseModel):
    """System diagnostic response detailing active prediction engine state."""
    ml_artifact_available: bool = Field(
        ...,
        description="Whether a compatible trained ML model was discovered and loaded",
    )
    active_model_name: str = Field(..., description="Name of currently serving model")
    active_model_version: str = Field(..., description="Version of currently serving model")
    model_path: Optional[str] = Field(
        None,
        description="Filesystem path of loaded model artifact if present",
    )
    fallback_enabled: bool = Field(
        ...,
        description="Whether heuristic fallback is configured and active",
    )
    supported_features_count: int = Field(
        ...,
        description="Number of normalized feature dimensions accepted by engine",
    )
    status_message: str = Field(..., description="Human-readable engine readiness summary")
