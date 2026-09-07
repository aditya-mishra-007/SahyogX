"""
Tests for OperationalWelfareFeatureEngineer
"""

import pandas as pd
from ml.src.feature_engineering import (
    OperationalWelfareFeatureEngineer,
    add_engineered_features,
)


def test_feature_engineering_calculation():
    sample_df = pd.DataFrame([{
        "duty_hours_weekly": 60.0,
        "overtime_hours_weekly": 10.0,
        "deployment_duration_months": 8.0,
        "deployments_last_3_years": 2,
        "days_since_last_leave": 120,
        "leave_days_taken_annual": 20.0,
        "recovery_rest_days_monthly": 2.0,
        "avg_sleep_hours": 5.0,
        "sleep_disruption_index": 6.0,
        "physical_readiness_score": 70.0,
        "wellness_survey_score": 15.0,
        "peer_support_score": 3.0,
        "environmental_hardship_score": 3.0,
    }])

    fe = OperationalWelfareFeatureEngineer()
    res = fe.transform(sample_df)

    # 1. sleep_deficit_hours = 7.5 - 5.0 = 2.5
    assert res["sleep_deficit_hours"].iloc[0] == 2.5

    # 2. deployment_to_recovery_ratio = 8.0 / 2.0 = 4.0
    assert res["deployment_to_recovery_ratio"].iloc[0] == 4.0

    # 3. leave_deprivation_index = 120 / 20.0 = 6.0
    assert res["leave_deprivation_index"].iloc[0] == 6.0

    # 4. Check composite fatigue > 0
    assert res["composite_fatigue_index"].iloc[0] > 0

    # 5. Check all engineered features present
    for name in fe.engineered_feature_names_:
        assert name in res.columns


def test_feature_engineering_pipeline_compatibility():
    fe = OperationalWelfareFeatureEngineer()
    assert hasattr(fe, "fit")
    assert hasattr(fe, "transform")
    assert hasattr(fe, "fit_transform")

    sample_df = pd.DataFrame({
        "avg_sleep_hours": [6.0, 8.0],
        "duty_hours_weekly": [50.0, 40.0],
    })
    transformed = fe.fit(sample_df).transform(sample_df)
    assert "sleep_deficit_hours" in transformed.columns


def test_add_engineered_features_function():
    sample_df = pd.DataFrame({
        "avg_sleep_hours": [5.5, 7.5],
        "duty_hours_weekly": [52.0, 42.0],
    })
    result = add_engineered_features(sample_df)
    assert "sleep_deficit_hours" in result.columns
    assert "composite_fatigue_index" in result.columns
