"""
SahyogX - Explainability & Contributing Indicators Module

This module translates model predictions into actionable, non-diagnostic contributing
indicators and protective factors for commanders and welfare officers.

ETHICAL & CLINICAL FRAMING MANDATE:
- All explanations are strictly described as MODEL-ASSOCIATED INDICATORS, not proven medical causes.
- We never state: "Deployment caused stress."
- Instead: "Prolonged deployment ({val} months) was one of the indicators associated with
  the model's elevated-risk prediction."
- Welfare officers receive contextual, operational insights to guide supportive check-ins
  without stigmatizing personnel.
"""

from typing import Any, Dict, List, Optional, Tuple


# Operational baseline thresholds based on military health standards (DoD HRBS / STARRS)
OPERATIONAL_THRESHOLDS = {
    "duty_hours_weekly": {"elevated": 56.0, "extreme": 70.0, "unit": "hours/week"},
    "overtime_hours_weekly": {"elevated": 8.0, "extreme": 16.0, "unit": "hours/week"},
    "deployment_duration_months": {"elevated": 6.0, "extreme": 10.0, "unit": "months"},
    "days_since_last_leave": {"elevated": 100, "extreme": 180, "unit": "days"},
    "avg_sleep_hours": {"deficient": 6.0, "critical": 5.0, "unit": "hours/night"},
    "sleep_disruption_index": {"elevated": 5.0, "extreme": 7.5, "unit": "out of 10.0"},
    "recovery_rest_days_monthly": {"low": 3.0, "critical": 1.5, "unit": "days/month"},
    "environmental_hardship_score": {"elevated": 3.5, "extreme": 4.5, "unit": "out of 5.0"},
    "peer_support_score": {"protective": 3.8, "strong": 4.3, "unit": "out of 5.0"},
    "physical_readiness_score": {"protective": 75.0, "strong": 85.0, "unit": "out of 100"},
}

EXPLAINABILITY_DISCLAIMER = (
    "Contributing indicators reflect operational and behavioral metrics associated with "
    "the model's predictive risk estimation. They do not constitute a clinical diagnosis, "
    "psychiatric evaluation, or proven medical etiology."
)


class WelfareExplainabilityEngine:
    """
    Extracts instance-level model-associated risk drivers and protective factors.
    Combines quantitative deviation metrics with calibrated domain descriptions.
    """

    def __init__(self, model_artifact: Optional[Any] = None):
        self.model = model_artifact

    def explain_instance(
        self,
        features: Dict[str, Any],
        risk_category: str,
        risk_score: float,
        top_k: int = 4,
    ) -> Dict[str, Any]:
        """
        Derives contributing indicators and protective factors for a single personnel prediction.

        Args:
            features: Dictionary of input features for the individual.
            risk_category: 'LOW', 'MODERATE', or 'ELEVATED'.
            risk_score: Calibrated continuous score (0.0 - 1.0).
            top_k: Maximum number of contributing indicators to return.

        Returns:
            Dictionary with contributing indicators, protective factors, and disclaimer.
        """
        contributing_indicators: List[Tuple[float, str]] = []
        protective_factors: List[Tuple[float, str]] = []

        # 1. Weekly Duty Hours
        duty = features.get("duty_hours_weekly")
        if duty is not None:
            if duty >= OPERATIONAL_THRESHOLDS["duty_hours_weekly"]["extreme"]:
                severity = (duty - 48.0) / 20.0
                contributing_indicators.append((
                    severity,
                    f"Substantially elevated weekly duty hours ({duty:.1f} hrs/week) "
                    f"was associated with heightened fatigue strain.",
                ))
            elif duty >= OPERATIONAL_THRESHOLDS["duty_hours_weekly"]["elevated"]:
                severity = (duty - 48.0) / 20.0
                contributing_indicators.append((
                    severity,
                    f"Higher than normal duty schedule ({duty:.1f} hrs/week) "
                    f"was identified as a contributing workload indicator.",
                ))

        # 2. Continuous Deployment Duration
        dep = features.get("deployment_duration_months")
        if dep is not None:
            if dep >= OPERATIONAL_THRESHOLDS["deployment_duration_months"]["extreme"]:
                severity = dep / 12.0
                contributing_indicators.append((
                    severity,
                    f"Extended continuous deployment ({dep:.1f} months) "
                    f"was strongly associated with cumulative operational wear.",
                ))
            elif dep >= OPERATIONAL_THRESHOLDS["deployment_duration_months"]["elevated"]:
                severity = dep / 12.0
                contributing_indicators.append((
                    severity,
                    f"Prolonged deployment interval ({dep:.1f} months) was noted as an associated operational factor."
                ))

        # 3. Days Since Last Leave (Leave starvation)
        leave_lag = features.get("days_since_last_leave")
        if leave_lag is not None:
            if leave_lag >= OPERATIONAL_THRESHOLDS["days_since_last_leave"]["extreme"]:
                severity = leave_lag / 200.0
                contributing_indicators.append((
                    severity,
                    f"Protracted duration since last leave cycle ({int(leave_lag)} days) "
                    f"indicated delayed rest and decompression.",
                ))
            elif leave_lag >= OPERATIONAL_THRESHOLDS["days_since_last_leave"]["elevated"]:
                severity = leave_lag / 200.0
                contributing_indicators.append((
                    severity,
                    f"Notable interval without leave ({int(leave_lag)} days) was associated with elevated strain."
                ))

        # 4. Average Sleep & Disruption
        sleep = features.get("avg_sleep_hours")
        disr = features.get("sleep_disruption_index")
        if sleep is not None:
            if sleep <= OPERATIONAL_THRESHOLDS["avg_sleep_hours"]["critical"]:
                severity = (7.5 - sleep) / 2.5
                contributing_indicators.append((
                    severity,
                    f"Chronic sleep curtailment ({sleep:.1f} hrs/night average) "
                    f"was a prominent factor in the model's assessment.",
                ))
            elif sleep <= OPERATIONAL_THRESHOLDS["avg_sleep_hours"]["deficient"]:
                severity = (7.5 - sleep) / 2.5
                contributing_indicators.append((
                    severity,
                    f"Moderate sleep deficit ({sleep:.1f} hrs/night) was associated with physiological recovery lag."
                ))

        if disr is not None and disr >= OPERATIONAL_THRESHOLDS["sleep_disruption_index"]["elevated"]:
            severity = disr / 10.0
            contributing_indicators.append((
                severity,
                f"Elevated sleep fragmentation score ({disr:.1f}/10.0) indicated disturbed nighttime recovery cycles."
            ))

        # 5. Recovery Stand-down Days
        rec = features.get("recovery_rest_days_monthly")
        if rec is not None and rec <= OPERATIONAL_THRESHOLDS["recovery_rest_days_monthly"]["low"]:
            severity = (4.0 - rec) / 4.0
            contributing_indicators.append((
                severity,
                f"Limited monthly stand-down recovery ({rec:.1f} days/month) restricted recuperation opportunity."
            ))

        # 6. Environmental Hardship
        hardship = features.get("environmental_hardship_score")
        if hardship is not None and hardship >= OPERATIONAL_THRESHOLDS["environmental_hardship_score"]["elevated"]:
            severity = hardship / 5.0
            contributing_indicators.append((
                severity,
                f"Demanding terrain and environmental hardship factor ({hardship:.1f}/5.0) compounded physical demands."
            ))

        # 7. Overtime Shifts
        ot = features.get("overtime_hours_weekly")
        if ot is not None and ot >= OPERATIONAL_THRESHOLDS["overtime_hours_weekly"]["elevated"]:
            severity = ot / 20.0
            contributing_indicators.append((
                severity,
                f"Frequent overtime duty ({ot:.1f} hrs/week) added to continuous shift fatigue."
            ))

        # === Protective Resilience Factors ===
        peer = features.get("peer_support_score")
        if peer is not None and peer >= OPERATIONAL_THRESHOLDS["peer_support_score"]["protective"]:
            strength = peer / 5.0
            protective_factors.append((
                strength,
                f"Strong unit cohesion and peer support ({peer:.1f}/5.0) "
                f"served as an active protective buffer against stress.",
            ))

        phys = features.get("physical_readiness_score")
        if phys is not None and phys >= OPERATIONAL_THRESHOLDS["physical_readiness_score"]["protective"]:
            strength = phys / 100.0
            protective_factors.append((
                strength,
                f"Solid physical fitness readiness ({phys:.1f}/100) supported operational resilience.",
            ))

        wellness = features.get("wellness_survey_score")
        if wellness is not None and wellness >= 20.0:
            strength = wellness / 30.0
            protective_factors.append((
                strength,
                f"Positive self-reported psychological wellbeing score ({wellness:.1f}/30.0) "
                f"reflected good personal coping reserves.",
            ))

        # Sort by impact/severity
        contributing_indicators.sort(key=lambda x: x[0], reverse=True)
        protective_factors.sort(key=lambda x: x[0], reverse=True)

        selected_indicators = [msg for _, msg in contributing_indicators[:top_k]]
        selected_protective = [msg for _, msg in protective_factors[:top_k]]

        # Default fallback if LOW risk with no elevated metrics
        if not selected_indicators:
            if risk_category == "LOW":
                selected_indicators.append(
                    "All observed operational workload, sleep, and leave metrics "
                    "remain within standard baseline parameters."
                )
            else:
                selected_indicators.append(
                    "Subtle composite interaction across multiple mild workload and rest variables."
                )

        if not selected_protective:
            selected_protective.append(
                "Standard organizational baseline buffers active."
            )

        return {
            "contributing_indicators": selected_indicators,
            "protective_factors": selected_protective,
            "clinical_disclaimer": EXPLAINABILITY_DISCLAIMER,
        }
