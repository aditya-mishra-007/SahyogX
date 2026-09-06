"""
Deterministic Heuristic Stress Predictor for SahyogX Phase 3.

Provides an explainable, bounded, and auditable baseline stress risk calculation
derived directly from military domain signals:
1. Operational Duty / Night Sentry Workload (25% weight)
2. Deployment Hardship & Theatre Severity (25% weight)
3. Leave Deprivation & Recovery Deficit (20% weight)
4. Clinical Wellness & Survey Screening (30% weight, dynamically re-weighted if absent)
"""

from typing import List, Tuple
from src.schemas.prediction import (
    PersonnelStressFeatures,
    PredictionSource,
    RiskCategory,
    RiskFactor,
)
from src.services.predictors.base import BaseStressPredictor


class HeuristicStressPredictor(BaseStressPredictor):
    """
    Production-ready, deterministic baseline stress predictor.
    Guarantees mathematically bounded [0.0, 1.0] risk scores with explainable risk factors.
    """

    @property
    def model_name(self) -> str:
        return "SahyogX-HeuristicBaseline"

    @property
    def model_version(self) -> str:
        return "1.0.0"

    @property
    def prediction_source(self) -> PredictionSource:
        return PredictionSource.HEURISTIC_BASELINE

    def is_available(self) -> bool:
        return True

    async def predict(
        self, features: PersonnelStressFeatures
    ) -> Tuple[float, RiskCategory, float, List[RiskFactor]]:
        factors: List[RiskFactor] = []

        # ---------------------------------------------------------------------
        # Pillar 1: Duty / Workload Stress (Weight = 0.25)
        # ---------------------------------------------------------------------
        # Night duties (>5 shifts in 30d adds risk; 15+ is maximum risk)
        night_score = min(max(features.recent_night_duties - 5, 0) / 10.0, 1.0)
        # Consecutive duty days (>4 consecutive days adds risk; 12+ is maximum)
        consec_score = min(max(features.recent_max_consecutive_days - 4, 0) / 8.0, 1.0)
        # Workload hours (>180 hrs in 30d adds risk; 280+ is maximum)
        hours_score = min(max(features.recent_duty_hours - 180.0, 0.0) / 100.0, 1.0)
        # Subjective workload intensity rating (>6.0 adds risk)
        intensity_score = min(max(features.avg_workload_score - 6.0, 0.0) / 3.5, 1.0)

        p_duty = (
            0.35 * night_score
            + 0.30 * consec_score
            + 0.20 * hours_score
            + 0.15 * intensity_score
        )

        if night_score >= 0.4:
            factors.append(
                RiskFactor(
                    factor_name="frequent_night_duties",
                    impact_level=RiskCategory.HIGH if night_score >= 0.7 else RiskCategory.MODERATE,
                    description=f"Elevated night sentry duties ({features.recent_night_duties} night shifts in past 30 days)",
                    score_contribution=round(0.25 * 0.35 * night_score, 3),
                )
            )
        if consec_score >= 0.5:
            factors.append(
                RiskFactor(
                    factor_name="prolonged_consecutive_duty",
                    impact_level=RiskCategory.CRITICAL if consec_score >= 0.8 else RiskCategory.HIGH,
                    description=f"Extended consecutive duty streak ({features.recent_max_consecutive_days} consecutive days without rest)",
                    score_contribution=round(0.25 * 0.30 * consec_score, 3),
                )
            )
        if hours_score >= 0.5:
            factors.append(
                RiskFactor(
                    factor_name="high_workload_hours",
                    impact_level=RiskCategory.HIGH if hours_score >= 0.8 else RiskCategory.MODERATE,
                    description=f"High cumulative operational hours ({features.recent_duty_hours} hrs in last 30 days)",
                    score_contribution=round(0.25 * 0.20 * hours_score, 3),
                )
            )

        # ---------------------------------------------------------------------
        # Pillar 2: Deployment Hardship (Weight = 0.25)
        # ---------------------------------------------------------------------
        if features.has_active_deployment:
            # Base severity from operational intensity
            intensity_map = {
                "EXTREME": 0.85,
                "HIGH": 0.65,
                "MODERATE": 0.40,
                "LOW": 0.15,
                "NONE": 0.0,
            }
            base_intensity = intensity_map.get(features.active_deployment_intensity, 0.40)

            # Theatre modifier (High Altitude / Counter Insurgency)
            theatre_mod = 0.0
            if features.active_deployment_type in ("HIGH_ALTITUDE", "COUNTER_INSURGENCY"):
                theatre_mod = 0.15
            elif features.active_deployment_type == "BORDER_OUTPOST":
                theatre_mod = 0.10

            # Duration modifier (>90 days in active deployment adds fatigue)
            dur_mod = min(max(features.active_deployment_days - 90, 0) / 275.0 * 0.20, 0.20)

            p_deploy = min(base_intensity + theatre_mod + dur_mod, 1.0)

            if base_intensity >= 0.65 or theatre_mod > 0:
                factors.append(
                    RiskFactor(
                        factor_name="active_hardship_deployment",
                        impact_level=RiskCategory.HIGH if p_deploy >= 0.75 else RiskCategory.MODERATE,
                        description=(
                            f"Active deployment in {features.active_deployment_type} theatre "
                            f"({features.active_deployment_intensity} intensity, {features.active_deployment_days} days)"
                        ),
                        score_contribution=round(0.25 * p_deploy, 3),
                    )
                )
        else:
            # Lifetime residual hardship deployments
            p_deploy = min(features.lifetime_hardship_deployments * 0.05, 0.25)

        # ---------------------------------------------------------------------
        # Pillar 3: Leave Deprivation (Weight = 0.20)
        # ---------------------------------------------------------------------
        # Days since last leave (>120 days begins accumulation; 300+ is acute deprivation)
        deprive_score = min(max(features.days_since_last_leave - 120, 0) / 200.0, 1.0)
        # Leave taken in past year (<20 days indicates deficit)
        deficit_score = max((20 - features.total_leave_days_past_year) / 20.0, 0.0)
        # Rejected leave requests
        rejected_score = min(features.rejected_leave_requests * 0.35, 1.0)

        p_leave = (
            0.50 * deprive_score
            + 0.30 * deficit_score
            + 0.20 * rejected_score
        )

        if deprive_score >= 0.5:
            factors.append(
                RiskFactor(
                    factor_name="leave_deprivation",
                    impact_level=RiskCategory.HIGH if deprive_score >= 0.8 else RiskCategory.MODERATE,
                    description=f"Long duration since last authorized leave ({features.days_since_last_leave} days elapsed)",
                    score_contribution=round(0.20 * 0.50 * deprive_score, 3),
                )
            )
        if features.rejected_leave_requests > 0:
            factors.append(
                RiskFactor(
                    factor_name="rejected_leave_requests",
                    impact_level=RiskCategory.HIGH if features.rejected_leave_requests >= 2 else RiskCategory.MODERATE,
                    description=f"Recorded {features.rejected_leave_requests} rejected leave application(s)",
                    score_contribution=round(0.20 * 0.20 * rejected_score, 3),
                )
            )

        # ---------------------------------------------------------------------
        # Pillar 4: Clinical & Subjective Wellness (Weight = 0.30)
        # ---------------------------------------------------------------------
        if features.has_survey_data:
            w_duty = 0.25
            w_deploy = 0.25
            w_leave = 0.20
            w_survey = 0.30
            confidence = 0.88

            s_stress = features.latest_stress_score / 10.0
            s_sleep = (10.0 - features.latest_sleep_quality_score) / 10.0  # Inverted: 0 is optimal, 10 is insomnia
            s_fatigue = features.latest_fatigue_score / 10.0
            s_wellbeing = (10.0 - features.latest_wellbeing_score) / 10.0  # Inverted

            p_survey = (
                0.35 * s_stress
                + 0.25 * s_fatigue
                + 0.25 * s_sleep
                + 0.15 * s_wellbeing
            )

            if features.flagged_for_counselor:
                p_survey = min(p_survey + 0.15, 1.0)
                factors.append(
                    RiskFactor(
                        factor_name="counselor_clinical_referral",
                        impact_level=RiskCategory.CRITICAL,
                        description="Acute psychological stress or exhaustion trigger flagged on wellness assessment",
                        score_contribution=round(0.30 * 0.15, 3),
                    )
                )

            if s_stress >= 0.70:
                factors.append(
                    RiskFactor(
                        factor_name="elevated_perceived_stress",
                        impact_level=RiskCategory.HIGH if s_stress >= 0.85 else RiskCategory.MODERATE,
                        description=f"High self-reported stress score ({features.latest_stress_score:.1f}/10.0)",
                        score_contribution=round(0.30 * 0.35 * s_stress, 3),
                    )
                )
            if s_sleep >= 0.70:
                factors.append(
                    RiskFactor(
                        factor_name="severe_sleep_disturbance",
                        impact_level=RiskCategory.HIGH if s_sleep >= 0.85 else RiskCategory.MODERATE,
                        description=f"Chronic sleep disruption rating ({features.latest_sleep_quality_score:.1f}/10.0)",
                        score_contribution=round(0.30 * 0.25 * s_sleep, 3),
                    )
                )
            if s_fatigue >= 0.70:
                factors.append(
                    RiskFactor(
                        factor_name="chronic_operational_fatigue",
                        impact_level=RiskCategory.HIGH if s_fatigue >= 0.85 else RiskCategory.MODERATE,
                        description=f"Elevated physical exhaustion rating ({features.latest_fatigue_score:.1f}/10.0)",
                        score_contribution=round(0.30 * 0.25 * s_fatigue, 3),
                    )
                )
        else:
            # Proportionally redistribute survey weight among the other 3 operational pillars
            # 0.25 / 0.70 ~= 0.357, 0.25 / 0.70 ~= 0.357, 0.20 / 0.70 ~= 0.286
            w_duty = 0.36
            w_deploy = 0.36
            w_leave = 0.28
            w_survey = 0.0
            p_survey = 0.0
            confidence = 0.72  # Lower confidence due to lack of self-reported survey indicators

        # Composite score
        raw_score = (
            w_duty * p_duty
            + w_deploy * p_deploy
            + w_leave * p_leave
            + w_survey * p_survey
        )
        # Strictly clamp within [0.000, 1.000]
        risk_score = round(max(0.0, min(raw_score, 1.0)), 3)

        # Categorize
        if risk_score >= 0.80:
            category = RiskCategory.CRITICAL
        elif risk_score >= 0.60:
            category = RiskCategory.HIGH
        elif risk_score >= 0.35:
            category = RiskCategory.MODERATE
        else:
            category = RiskCategory.LOW

        # Sort primary risk factors by contribution descending
        factors.sort(key=lambda x: x.score_contribution, reverse=True)

        return risk_score, category, confidence, factors
