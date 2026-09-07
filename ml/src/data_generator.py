"""
SahyogX - Synthetic Personnel Welfare & Stress Dataset Generator

DISCLAIMER:
"Synthetic data is used for prototype/testing purposes and does not represent actual personnel."

RESEARCH CONTEXT & DATASET JUSTIFICATION:
In military and uniformed service domains (e.g., Indian Armed Forces, US DoD, NATO),
operational deployment records, daily duty logs, tactical unit assignments, and leave
schedules are strictly classified or controlled under Operational Security (OPSEC)
and personnel privacy regulations.

Public defense health datasets—such as the Army Study to Assess Risk and Resilience
in Servicemembers (Army STARRS, ICPSR 35198/36340) and the Department of Defense Health
Related Behaviors Survey (DoD HRBS)—provide macro-level epidemiology, survey distributions,
and risk/protective correlations, but do NOT provide granular operational deployment/leave
telemetry.

This module provides a mathematically grounded, reproducible synthetic generator that
simulates realistic operational, physiological, and organizational stress dynamics
observed in military wellness research without compromising security or privacy.
"""

import argparse
import os
import numpy as np
import pandas as pd


SYNTHETIC_DATA_DISCLAIMER = (
    "Synthetic data is used for prototype/testing purposes and does not represent actual personnel."
)

UNIT_TYPES = [
    "Infantry",
    "Artillery",
    "Armored",
    "Combat Engineers",
    "Signals",
    "Air Defense",
    "Logistics & ASC",
    "Medical Corps",
]

OPERATIONAL_INTENSITIES = ["Low", "Medium", "High", "Extreme"]


class SyntheticPersonnelDataGenerator:
    """
    Generates high-fidelity synthetic personnel records for stress and welfare monitoring.
    Incorporates operational load, sleep deficit, leave starvation, and protective buffers.
    """

    def __init__(self, random_seed: int = 42):
        self.random_seed = random_seed
        self.rng = np.random.default_rng(random_seed)

    def generate(
        self,
        num_samples: int = 5000,
        inject_missingness: bool = True,
        missing_rate: float = 0.02,
    ) -> pd.DataFrame:
        """
        Generates synthetic personnel records.

        Args:
            num_samples: Number of records to generate.
            inject_missingness: Whether to inject realistic missing values (e.g., skipped surveys).
            missing_rate: Proportion of missing values to inject into survey columns.

        Returns:
            pd.DataFrame containing synthetic personnel welfare records.
        """
        n = num_samples
        rng = self.rng

        # Identifiers
        personnel_ids = [f"PX-{10000 + i}" for i in range(n)]

        # Unit assignments with realistic operational distribution
        unit_probs = [0.25, 0.15, 0.12, 0.12, 0.12, 0.08, 0.10, 0.06]
        unit_type = rng.choice(UNIT_TYPES, size=n, p=unit_probs)

        # Operational intensity depends partly on unit type
        intensity_levels = []
        for u in unit_type:
            if u in ["Infantry", "Combat Engineers"]:
                p = [0.10, 0.25, 0.40, 0.25]
            elif u in ["Artillery", "Armored", "Air Defense"]:
                p = [0.15, 0.35, 0.35, 0.15]
            else:  # Signals, Logistics, Medical
                p = [0.35, 0.45, 0.15, 0.05]
            intensity_levels.append(rng.choice(OPERATIONAL_INTENSITIES, p=p))
        role_operational_intensity = np.array(intensity_levels)

        # Operational Intensity weight for correlated duty metrics
        intensity_weights = {
            "Low": 0.0,
            "Medium": 0.3,
            "High": 0.7,
            "Extreme": 1.0,
        }
        int_w = np.array([intensity_weights[lvl] for lvl in role_operational_intensity])

        # Duty hours weekly: Base ~44h + intensity bump + normal variance
        base_duty = 44.0 + int_w * 18.0 + rng.normal(0, 5.0, size=n)
        duty_hours_weekly = np.clip(base_duty, 36.0, 84.0).round(1)

        # Overtime / extended shifts
        overtime_hours = np.maximum(0.0, (duty_hours_weekly - 48.0) * 0.7 + rng.normal(0, 2.0, size=n))
        overtime_hours_weekly = np.clip(overtime_hours, 0.0, 32.0).round(1)

        # Continuous deployment duration in months (0 to 18 months)
        dep_base = 2.0 + int_w * 5.0 + rng.exponential(scale=3.0, size=n)
        deployment_duration_months = np.clip(dep_base, 0.0, 18.0).round(1)

        # Deployment frequency in last 3 years (0 to 5)
        deployments_last_3_years = rng.poisson(lam=1.5 + int_w * 0.8, size=n)
        deployments_last_3_years = np.clip(deployments_last_3_years, 0, 6)

        # Days since last consecutive 5+ day leave
        # Units under high deployment often defer leave
        leave_lag_base = 45 + (deployment_duration_months * 18.0) + rng.exponential(scale=30.0, size=n)
        days_since_last_leave = np.clip(leave_lag_base, 10, 365).astype(int)

        # Leave days taken in past 12 months (Standard entitlement: 60 annual + 20 casual in defense)
        leave_taken = 55.0 - (int_w * 22.0) - (deployment_duration_months * 1.5) + rng.normal(0, 6.0, size=n)
        leave_days_taken_annual = np.clip(leave_taken, 5.0, 60.0).round(1)

        # Recovery rest days in past 30 days (stand-down days)
        recovery_days = 5.5 - (int_w * 2.8) - (duty_hours_weekly / 30.0) + rng.normal(0, 1.0, size=n)
        recovery_rest_days_monthly = np.clip(recovery_days, 0.0, 8.0).round(1)

        # Sleep indicators (Critical military stress factor from DoD HRBS)
        # Duty hours and operational intensity directly curtail sleep opportunity
        sleep_mean = 7.2 - (int_w * 1.5) - (duty_hours_weekly - 40.0) * 0.04
        avg_sleep_hours = np.clip(sleep_mean + rng.normal(0, 0.6, size=n), 3.5, 8.5).round(1)

        # Sleep disruption index (0 to 10 scale)
        disruption_base = (
            int_w * 4.0
            + (8.0 - avg_sleep_hours) * 1.2
            + (duty_hours_weekly > 60).astype(float) * 1.8
            + rng.normal(0, 0.8, size=n)
        )
        sleep_disruption_index = np.clip(disruption_base, 0.0, 10.0).round(1)

        # Physical readiness test score (40 to 100)
        # Good sleep and moderate duty maintain fitness; extreme exhaustion degrades it
        phys_base = 82.0 - (int_w * 8.0) + (avg_sleep_hours - 6.0) * 2.5 + rng.normal(0, 7.0, size=n)
        physical_readiness_score = np.clip(phys_base, 40.0, 100.0).round(1)

        # Unit peer support / cohesion (1.0 to 5.0 Likert scale)
        # Documented in Army STARRS as key resilience factor
        peer_support = 3.8 + rng.normal(0, 0.6, size=n)
        peer_support_score = np.clip(peer_support, 1.0, 5.0).round(1)

        # Environmental hardship score (1 to 5: altitude, temperature, terrain)
        hardship_base = 1.0 + int_w * 2.8 + rng.uniform(0.0, 1.2, size=n)
        environmental_hardship_score = np.clip(hardship_base, 1.0, 5.0).round(1)

        # Standardized wellness survey score (0 to 30 scale, higher = better mental wellbeing)
        # Correlates with sleep, peer support, and inverse duty load
        wellness_base = (
            18.0
            + (avg_sleep_hours - 6.0) * 2.0
            + (peer_support_score - 3.0) * 2.5
            - (duty_hours_weekly - 48.0) * 0.22
            - (deployment_duration_months - 4.0) * 0.35
            + rng.normal(0, 2.2, size=n)
        )
        wellness_survey_score = np.clip(wellness_base, 0.0, 30.0).round(1)

        # Calculate Ground Truth Stress/Welfare Risk Score (0.0 to 1.0)
        # Ground truth embodies realistic, multi-domain interactions:
        # 1. Operational Load Factor (0 to 1)
        f_load = (
            0.35 * np.clip((duty_hours_weekly - 45.0) / 30.0, 0.0, 1.0)
            + 0.30 * np.clip((deployment_duration_months - 3.0) / 12.0, 0.0, 1.0)
            + 0.20 * np.clip((days_since_last_leave - 60.0) / 200.0, 0.0, 1.0)
            + 0.15 * np.clip((environmental_hardship_score - 1.0) / 4.0, 0.0, 1.0)
        )

        # 2. Physiological Exhaustion Factor (0 to 1)
        f_exhaustion = (
            0.50 * np.clip((6.8 - avg_sleep_hours) / 3.0, 0.0, 1.0)
            + 0.35 * np.clip(sleep_disruption_index / 10.0, 0.0, 1.0)
            + 0.15 * np.clip((5.0 - recovery_rest_days_monthly) / 5.0, 0.0, 1.0)
        )

        # 3. Protective Resilience Buffer (0 to 1, reduces stress)
        f_buffer = (
            0.40 * np.clip((peer_support_score - 1.0) / 4.0, 0.0, 1.0)
            + 0.35 * np.clip(wellness_survey_score / 30.0, 0.0, 1.0)
            + 0.25 * np.clip((physical_readiness_score - 50.0) / 50.0, 0.0, 1.0)
        )

        # Combined composite stress risk: Load + Exhaustion - Buffer + Stochastic interaction
        latent_risk = 0.52 * f_load + 0.53 * f_exhaustion - 0.35 * f_buffer
        latent_risk += 0.08 * (f_load * f_exhaustion)  # Compound strain interaction
        latent_risk += rng.normal(0.0, 0.04, size=n)   # Unobserved real-world variance

        risk_score = np.clip(latent_risk, 0.02, 0.98).round(3)

        # Categorize into 3 calibrated tiers:
        # LOW: < 0.38
        # MODERATE: 0.38 <= score < 0.65
        # ELEVATED: >= 0.65
        risk_categories = []
        for s in risk_score:
            if s < 0.38:
                risk_categories.append("LOW")
            elif s < 0.65:
                risk_categories.append("MODERATE")
            else:
                risk_categories.append("ELEVATED")

        df = pd.DataFrame({
            "personnel_id": personnel_ids,
            "unit_type": unit_type,
            "role_operational_intensity": role_operational_intensity,
            "duty_hours_weekly": duty_hours_weekly,
            "overtime_hours_weekly": overtime_hours_weekly,
            "deployment_duration_months": deployment_duration_months,
            "deployments_last_3_years": deployments_last_3_years,
            "days_since_last_leave": days_since_last_leave,
            "leave_days_taken_annual": leave_days_taken_annual,
            "recovery_rest_days_monthly": recovery_rest_days_monthly,
            "avg_sleep_hours": avg_sleep_hours,
            "sleep_disruption_index": sleep_disruption_index,
            "physical_readiness_score": physical_readiness_score,
            "wellness_survey_score": wellness_survey_score,
            "peer_support_score": peer_support_score,
            "environmental_hardship_score": environmental_hardship_score,
            "risk_score": risk_score,
            "risk_category": risk_categories,
        })

        if inject_missingness and missing_rate > 0:
            # Surveys and self-reports occasionally have missing values in operational field environments
            mask_wellness = rng.random(size=n) < missing_rate
            mask_phys = rng.random(size=n) < missing_rate
            mask_sleep_disr = rng.random(size=n) < (missing_rate * 0.7)
            df.loc[mask_wellness, "wellness_survey_score"] = np.nan
            df.loc[mask_phys, "physical_readiness_score"] = np.nan
            df.loc[mask_sleep_disr, "sleep_disruption_index"] = np.nan

        return df


def generate_and_save_data(
    output_path: str,
    num_samples: int = 5000,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generates synthetic data and saves to CSV with metadata header.
    """
    dirname = os.path.dirname(output_path)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    generator = SyntheticPersonnelDataGenerator(random_seed=seed)
    df = generator.generate(num_samples=num_samples)

    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} synthetic records saved to: {output_path}")
    print(f"Class distribution:\n{df['risk_category'].value_counts(normalize=True).round(3)}")
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic personnel welfare dataset.")
    parser.add_argument("--samples", type=int, default=5000, help="Number of records to generate")
    parser.add_argument(
        "--output",
        type=str,
        default="ml/data/raw/personnel_welfare_synthetic_raw.csv",
        help="Output path",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    generate_and_save_data(args.output, num_samples=args.samples, seed=args.seed)
