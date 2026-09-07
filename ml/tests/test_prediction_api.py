"""
Tests for Backend Prediction API and WelfareRiskPredictor Contract
"""

import pytest
from ml.src.data_generator import SyntheticPersonnelDataGenerator
from ml.src.predict import WelfareRiskPredictor
from ml.src.train import run_full_training_pipeline


@pytest.fixture(scope="module")
def trained_artifacts(tmp_path_factory):
    tmp_dir = tmp_path_factory.mktemp("ml_artifacts")
    raw_csv = str(tmp_dir / "raw.csv")
    proc_dir = str(tmp_dir / "processed")
    models_dir = str(tmp_dir / "models")

    # Generate small dataset for fast test
    gen = SyntheticPersonnelDataGenerator(random_seed=42)
    df = gen.generate(num_samples=300)
    df.to_csv(raw_csv, index=False)

    run_full_training_pipeline(
        raw_data_path=raw_csv,
        processed_dir=proc_dir,
        models_dir=models_dir,
        random_state=42,
    )

    return models_dir


def test_predictor_single_record(trained_artifacts):
    predictor = WelfareRiskPredictor.from_directory(trained_artifacts)

    sample = {
        "personnel_id": "PX-9999",
        "unit_type": "Infantry",
        "role_operational_intensity": "High",
        "duty_hours_weekly": 65.0,
        "overtime_hours_weekly": 12.0,
        "deployment_duration_months": 8.0,
        "deployments_last_3_years": 2,
        "days_since_last_leave": 150,
        "leave_days_taken_annual": 20.0,
        "recovery_rest_days_monthly": 2.0,
        "avg_sleep_hours": 4.8,
        "sleep_disruption_index": 7.0,
        "physical_readiness_score": 75.0,
        "wellness_survey_score": 12.0,
        "peer_support_score": 3.2,
        "environmental_hardship_score": 4.0,
    }

    result = predictor.predict(sample)

    assert isinstance(result, dict)
    assert result["personnel_id"] == "PX-9999"
    assert result["risk_category"] in ["LOW", "MODERATE", "ELEVATED"]
    assert 0.0 <= result["risk_score"] <= 1.0
    assert "LOW" in result["risk_probabilities"]
    assert "MODERATE" in result["risk_probabilities"]
    assert "ELEVATED" in result["risk_probabilities"]
    assert isinstance(result["contributing_indicators"], list)
    assert len(result["contributing_indicators"]) > 0
    assert isinstance(result["protective_factors"], list)
    assert "disclaimer" in result


def test_predictor_batch(trained_artifacts):
    predictor = WelfareRiskPredictor.from_directory(trained_artifacts)

    records = [
        {"personnel_id": "PX-1", "duty_hours_weekly": 40.0, "avg_sleep_hours": 7.5},
        {"personnel_id": "PX-2", "duty_hours_weekly": 75.0, "avg_sleep_hours": 4.0},
    ]

    results = predictor.predict(records)
    assert isinstance(results, list)
    assert len(results) == 2
    assert results[0]["personnel_id"] == "PX-1"
    assert results[1]["personnel_id"] == "PX-2"
