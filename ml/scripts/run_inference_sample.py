#!/usr/bin/env python3
"""
CLI script to demonstrate inference and explainability outputs
across sample profiles (LOW, MODERATE, ELEVATED).
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ml.src.predict import WelfareRiskPredictor


def main():
    print("Loading SahyogX Welfare Risk Predictor...")
    predictor = WelfareRiskPredictor.from_directory("ml/models")

    sample_profiles = [
        {
            "_description": "PROFILE A: Healthy baseline soldier with balanced duty and rest",
            "personnel_id": "PX-10101",
            "unit_type": "Signals",
            "role_operational_intensity": "Low",
            "duty_hours_weekly": 42.0,
            "overtime_hours_weekly": 1.5,
            "deployment_duration_months": 1.0,
            "deployments_last_3_years": 1,
            "days_since_last_leave": 35,
            "leave_days_taken_annual": 45.0,
            "recovery_rest_days_monthly": 6.0,
            "avg_sleep_hours": 7.5,
            "sleep_disruption_index": 1.5,
            "physical_readiness_score": 88.0,
            "wellness_survey_score": 24.0,
            "peer_support_score": 4.5,
            "environmental_hardship_score": 1.2,
        },
        {
            "_description": "PROFILE B: Field operational soldier experiencing moderate fatigue lag",
            "personnel_id": "PX-10202",
            "unit_type": "Artillery",
            "role_operational_intensity": "Medium",
            "duty_hours_weekly": 56.0,
            "overtime_hours_weekly": 7.0,
            "deployment_duration_months": 4.5,
            "deployments_last_3_years": 2,
            "days_since_last_leave": 110,
            "leave_days_taken_annual": 28.0,
            "recovery_rest_days_monthly": 3.0,
            "avg_sleep_hours": 5.8,
            "sleep_disruption_index": 4.5,
            "physical_readiness_score": 76.0,
            "wellness_survey_score": 16.5,
            "peer_support_score": 3.6,
            "environmental_hardship_score": 3.0,
        },
        {
            "_description": "PROFILE C: High-altitude combat soldier under acute operational strain",
            "personnel_id": "PX-10303",
            "unit_type": "Infantry",
            "role_operational_intensity": "Extreme",
            "duty_hours_weekly": 74.0,
            "overtime_hours_weekly": 18.0,
            "deployment_duration_months": 11.5,
            "deployments_last_3_years": 4,
            "days_since_last_leave": 195,
            "leave_days_taken_annual": 12.0,
            "recovery_rest_days_monthly": 1.0,
            "avg_sleep_hours": 4.2,
            "sleep_disruption_index": 8.5,
            "physical_readiness_score": 68.0,
            "wellness_survey_score": 9.0,
            "peer_support_score": 3.2,
            "environmental_hardship_score": 4.8,
        },
    ]

    print("\n" + "=" * 80)
    print("DEMO: SAHYOGX PREDICTIVE PERSONNEL WELFARE INFERENCE ENGINE")
    print("=" * 80)

    for profile in sample_profiles:
        desc = profile.pop("_description")
        print(f"\n>>> TEST SCENARIO: {desc}")
        print(
            f"Personnel ID: {profile['personnel_id']} | "
            f"Unit: {profile['unit_type']} | "
            f"Intensity: {profile['role_operational_intensity']}"
        )
        print(
            f"Weekly Duty: {profile['duty_hours_weekly']}h | "
            f"Deployment: {profile['deployment_duration_months']} mo | "
            f"Sleep: {profile['avg_sleep_hours']}h"
        )

        prediction = predictor.predict(profile)

        print("\n--- Model Output ---")
        print(f"Risk Category : {prediction['risk_category']}")
        print(f"Risk Score    : {prediction['risk_score']:.3f} (0.0 to 1.0)")
        print(f"Probabilities : {prediction['risk_probabilities']}")
        print("\nModel-Associated Contributing Indicators:")
        for ind in prediction["contributing_indicators"]:
            print(f"  * {ind}")
        print("\nProtective Resilience Factors:")
        for prot in prediction["protective_factors"]:
            print(f"  + {prot}")
        print("-" * 80)


if __name__ == "__main__":
    main()
