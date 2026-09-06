import pickle
from datetime import date
from pathlib import Path
import pytest
from src.schemas.prediction import (
    PersonnelStressFeatures,
    PredictionSource,
    RiskCategory,
)
from src.services.predictors.heuristic import HeuristicStressPredictor
from src.services.predictors.ml_adapter import MLModelStressPredictor
from src.services.prediction_service import PredictionService


@pytest.fixture
def baseline_features() -> PersonnelStressFeatures:
    """Fixture providing a balanced, healthy baseline profile."""
    return PersonnelStressFeatures(
        personnel_id=1,
        service_number="SX-BASE-001",
        service_months=36,
        recent_duty_hours=140.0,
        recent_night_duties=2,
        recent_max_consecutive_days=3,
        avg_workload_score=4.0,
        has_active_deployment=False,
        active_deployment_days=0,
        active_deployment_intensity="NONE",
        active_deployment_type="NONE",
        lifetime_hardship_deployments=0,
        days_since_last_leave=45,
        total_leave_days_past_year=30,
        rejected_leave_requests=0,
        has_survey_data=True,
        latest_stress_score=2.5,
        latest_sleep_quality_score=8.5,
        latest_fatigue_score=2.0,
        latest_wellbeing_score=8.5,
        avg_stress_score_past_90d=2.5,
        avg_sleep_score_past_90d=8.5,
        flagged_for_counselor=False,
    )


@pytest.mark.asyncio
async def test_heuristic_low_risk(baseline_features: PersonnelStressFeatures):
    """Verifies that a well-rested soldier produces a LOW risk score."""
    predictor = HeuristicStressPredictor()
    score, category, confidence, factors = await predictor.predict(baseline_features)

    assert 0.0 <= score < 0.35
    assert category == RiskCategory.LOW
    assert confidence >= 0.80
    assert len(factors) == 0  # No severe stressors to flag


@pytest.mark.asyncio
async def test_heuristic_critical_risk():
    """Verifies that a severely exhausted, deployed, leave-deprived soldier reaches CRITICAL risk."""
    predictor = HeuristicStressPredictor()
    severe_features = PersonnelStressFeatures(
        personnel_id=99,
        service_number="SX-CRIT-999",
        service_months=60,
        recent_duty_hours=290.0,
        recent_night_duties=16,
        recent_max_consecutive_days=14,
        avg_workload_score=9.5,
        has_active_deployment=True,
        active_deployment_days=240,
        active_deployment_intensity="EXTREME",
        active_deployment_type="HIGH_ALTITUDE",
        lifetime_hardship_deployments=3,
        days_since_last_leave=280,
        total_leave_days_past_year=5,
        rejected_leave_requests=2,
        has_survey_data=True,
        latest_stress_score=9.2,
        latest_sleep_quality_score=1.5,
        latest_fatigue_score=9.5,
        latest_wellbeing_score=1.5,
        avg_stress_score_past_90d=8.8,
        avg_sleep_score_past_90d=2.0,
        flagged_for_counselor=True,
    )

    score, category, confidence, factors = await predictor.predict(severe_features)

    assert 0.80 <= score <= 1.0
    assert category == RiskCategory.CRITICAL
    assert len(factors) >= 4

    # Verify risk factors contain explainable rationale
    factor_names = [f.factor_name for f in factors]
    assert "frequent_night_duties" in factor_names
    assert "prolonged_consecutive_duty" in factor_names
    assert "active_hardship_deployment" in factor_names
    assert "counselor_clinical_referral" in factor_names


@pytest.mark.asyncio
async def test_heuristic_deterministic_and_bounded(baseline_features: PersonnelStressFeatures):
    """Confirms heuristic predictor is completely deterministic and bounded strictly in [0.0, 1.0]."""
    predictor = HeuristicStressPredictor()

    score1, cat1, _, _ = await predictor.predict(baseline_features)
    score2, cat2, _, _ = await predictor.predict(baseline_features)

    assert score1 == score2
    assert cat1 == cat2
    assert 0.0 <= score1 <= 1.0


@pytest.mark.asyncio
async def test_heuristic_missing_survey_fallback():
    """Verifies that absence of clinical survey redistributes weights and lowers confidence."""
    predictor = HeuristicStressPredictor()
    no_survey_features = PersonnelStressFeatures(
        personnel_id=12,
        service_number="SX-NOSURV-012",
        service_months=12,
        recent_duty_hours=200.0,
        recent_night_duties=8,
        recent_max_consecutive_days=6,
        avg_workload_score=6.5,
        has_active_deployment=False,
        active_deployment_days=0,
        active_deployment_intensity="NONE",
        active_deployment_type="NONE",
        lifetime_hardship_deployments=0,
        days_since_last_leave=150,
        total_leave_days_past_year=15,
        rejected_leave_requests=0,
        has_survey_data=False,
        latest_stress_score=5.0,
        latest_sleep_quality_score=5.0,
        latest_fatigue_score=5.0,
        latest_wellbeing_score=5.0,
        avg_stress_score_past_90d=5.0,
        avg_sleep_score_past_90d=5.0,
        flagged_for_counselor=False,
    )

    score, category, confidence, factors = await predictor.predict(no_survey_features)

    assert 0.0 <= score <= 1.0
    assert confidence == 0.72  # Lower confidence due to lack of self-reported survey data


def test_feature_vector_serialization(baseline_features: PersonnelStressFeatures):
    """Verifies that to_vector() produces 19 bounded float values suitable for ML inference."""
    vec = baseline_features.to_vector()
    assert isinstance(vec, list)
    assert len(vec) == 19
    for val in vec:
        assert isinstance(val, (int, float))
        assert 0.0 <= val <= 1.0


def test_ml_adapter_unavailable_behavior():
    """Tests ML adapter behavior when no model file exists (default state)."""
    adapter = MLModelStressPredictor(model_path="nonexistent/path/to/model.joblib")
    assert adapter.is_available() is False
    assert adapter.prediction_source == PredictionSource.ML_MODEL

    available, path, err = adapter.get_status_detail()
    assert available is False
    assert "not found" in err.lower() or "failed" in err.lower()


class DummyEstimator:
    """Mock ML estimator for testing artifact loading and inference."""
    def predict_proba(self, X):
        # Returns [p(low), p(high)]
        return [[0.15, 0.85]]


@pytest.mark.asyncio
async def test_ml_adapter_with_mock_artifact(tmp_path: Path, baseline_features: PersonnelStressFeatures):
    """Tests ML adapter loading and inference using a serialized mock estimator."""
    mock_file = tmp_path / "mock_stress_model.pkl"
    with open(mock_file, "wb") as f:
        pickle.dump(DummyEstimator(), f)

    adapter = MLModelStressPredictor(model_path=str(mock_file))
    assert adapter.is_available() is True
    assert adapter.model_version == "1.0.0"

    score, category, conf, factors = await adapter.predict(baseline_features)
    assert score == 0.85
    assert category == RiskCategory.CRITICAL
    assert len(factors) == 1
    assert factors[0].factor_name == "ml_multivariate_inference"


def test_prediction_service_engine_selection():
    """Verifies that PredictionService chooses heuristic when ML is unavailable."""
    unavailable_ml = MLModelStressPredictor(model_path="nonexistent.joblib")
    heuristic = HeuristicStressPredictor()
    service = PredictionService(ml_predictor=unavailable_ml, heuristic_predictor=heuristic)

    active = service.get_active_predictor()
    assert active.prediction_source == PredictionSource.HEURISTIC_BASELINE
    assert active.model_name == "SahyogX-HeuristicBaseline"

    status = service.get_engine_status()
    assert status.ml_artifact_available is False
    assert "heuristic fallback" in status.status_message.lower()


@pytest.mark.asyncio
async def test_feature_aggregation_nonexistent_personnel():
    """Confirms feature aggregation returns None for an invalid personnel ID."""
    from src.core.database import AsyncSessionLocal
    from src.services.feature_aggregator import aggregate_personnel_features

    async with AsyncSessionLocal() as session:
        features = await aggregate_personnel_features(session, 999999)
        assert features is None


@pytest.mark.asyncio
async def test_feature_aggregation_sparse_personnel():
    """
    Confirms feature aggregation safely handles a brand new personnel record
    with zero duty logs, zero deployments, zero leaves, and zero wellness surveys.
    """
    import uuid
    from src.core.database import AsyncSessionLocal
    from src.models.personnel import Personnel
    from src.services.feature_aggregator import aggregate_personnel_features

    async with AsyncSessionLocal() as session:
        sparse_p = Personnel(
            service_number=f"SX-SPARSE-{uuid.uuid4().hex[:6].upper()}",
            name="Sparse Test Soldier",
            rank="Sepoy",
            role="Infantry",
            unit="14 Rajputana Rifles",
            joining_date=date.today(),
            status="ACTIVE",
        )
        session.add(sparse_p)
        await session.commit()
        await session.refresh(sparse_p)

        features = await aggregate_personnel_features(session, sparse_p.id)
        assert features is not None
        assert features.personnel_id == sparse_p.id
        assert features.recent_duty_hours == 0.0
        assert features.recent_night_duties == 0
        assert features.recent_max_consecutive_days == 0
        assert features.has_active_deployment is False
        assert features.active_deployment_days == 0
        assert features.active_deployment_intensity == "NONE"
        assert features.has_survey_data is False
        assert features.flagged_for_counselor is False

        # Verify to_vector() runs safely with no division by zero
        vec = features.to_vector()
        assert len(vec) == 19
        assert all(0.0 <= x <= 1.0 for x in vec)
