"""
Tests for SyntheticPersonnelDataGenerator
"""

import pandas as pd
from ml.src.data_generator import (
    SyntheticPersonnelDataGenerator,
    UNIT_TYPES,
    OPERATIONAL_INTENSITIES,
    SYNTHETIC_DATA_DISCLAIMER,
)


def test_generator_shape_and_columns():
    gen = SyntheticPersonnelDataGenerator(random_seed=123)
    df = gen.generate(num_samples=100, inject_missingness=False)

    assert len(df) == 100
    expected_cols = [
        "personnel_id",
        "unit_type",
        "role_operational_intensity",
        "duty_hours_weekly",
        "overtime_hours_weekly",
        "deployment_duration_months",
        "deployments_last_3_years",
        "days_since_last_leave",
        "leave_days_taken_annual",
        "recovery_rest_days_monthly",
        "avg_sleep_hours",
        "sleep_disruption_index",
        "physical_readiness_score",
        "wellness_survey_score",
        "peer_support_score",
        "environmental_hardship_score",
        "risk_score",
        "risk_category",
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing expected column {col}"


def test_generator_reproducibility():
    gen1 = SyntheticPersonnelDataGenerator(random_seed=42)
    df1 = gen1.generate(num_samples=50, inject_missingness=False)

    gen2 = SyntheticPersonnelDataGenerator(random_seed=42)
    df2 = gen2.generate(num_samples=50, inject_missingness=False)

    pd.testing.assert_frame_equal(df1, df2)


def test_generator_value_bounds():
    gen = SyntheticPersonnelDataGenerator(random_seed=99)
    df = gen.generate(num_samples=300, inject_missingness=False)

    # Unit and intensity domains
    assert set(df["unit_type"]).issubset(set(UNIT_TYPES))
    assert set(df["role_operational_intensity"]).issubset(set(OPERATIONAL_INTENSITIES))

    # Metric bounds
    assert (df["duty_hours_weekly"] >= 36.0).all() and (df["duty_hours_weekly"] <= 85.0).all()
    assert (df["avg_sleep_hours"] >= 3.0).all() and (df["avg_sleep_hours"] <= 9.0).all()
    assert (df["risk_score"] >= 0.0).all() and (df["risk_score"] <= 1.0).all()
    assert set(df["risk_category"]).issubset({"LOW", "MODERATE", "ELEVATED"})


def test_generator_missingness_injection():
    gen = SyntheticPersonnelDataGenerator(random_seed=77)
    df = gen.generate(num_samples=500, inject_missingness=True, missing_rate=0.05)

    # Missing values should be present in optional survey fields
    assert df["wellness_survey_score"].isna().sum() > 0
    assert df["physical_readiness_score"].isna().sum() > 0


def test_synthetic_data_disclaimer():
    assert "Synthetic data" in SYNTHETIC_DATA_DISCLAIMER
    assert "does not represent actual personnel" in SYNTHETIC_DATA_DISCLAIMER
