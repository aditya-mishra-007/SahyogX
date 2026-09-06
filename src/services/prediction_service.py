"""
Unified Stress Prediction Service for SahyogX Phase 3.

Orchestrates data fetching, feature aggregation, engine selection (ML Model vs.
Heuristic Baseline fallback), result validation, and unit analytics.
"""

from datetime import datetime, timezone
import logging
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.models.personnel import Personnel
from src.schemas.prediction import (
    ModelStatusResponse,
    PersonnelStressFeatures,
    PredictionSource,
    RiskCategory,
    StressPredictionResponse,
    UnitStressRiskSummary,
)
from src.services.feature_aggregator import aggregate_personnel_features
from src.services.predictors.base import BaseStressPredictor
from src.services.predictors.heuristic import HeuristicStressPredictor
from src.services.predictors.ml_adapter import MLModelStressPredictor

logger = logging.getLogger("sahyogx.prediction_service")


class PredictionService:
    """
    Coordinates predictive risk evaluation across military personnel.
    Maintains singleton/cached instances of ML adapter and heuristic fallback.
    """

    def __init__(
        self,
        ml_predictor: Optional[BaseStressPredictor] = None,
        heuristic_predictor: Optional[BaseStressPredictor] = None,
    ):
        self.ml_predictor = ml_predictor or MLModelStressPredictor()
        self.heuristic_predictor = heuristic_predictor or HeuristicStressPredictor()

    def get_active_predictor(self) -> BaseStressPredictor:
        """
        Selects ML predictor if available; otherwise safely falls back to Heuristic predictor.
        """
        if self.ml_predictor.is_available():
            return self.ml_predictor

        if settings.ML_FALLBACK_TO_HEURISTIC:
            return self.heuristic_predictor

        raise RuntimeError(
            "ML model artifact is unavailable and heuristic fallback is disabled in settings."
        )

    async def predict_personnel_stress(
        self, db: AsyncSession, personnel_id: int
    ) -> Optional[StressPredictionResponse]:
        """
        Executes stress risk prediction for a single personnel.
        Returns None if personnel does not exist.
        """
        # 1. Feature Aggregation Layer
        features = await aggregate_personnel_features(db, personnel_id)
        if not features:
            logger.warning("Prediction requested for nonexistent personnel ID: %s", personnel_id)
            return None

        # 2. Predictor Selection
        predictor = self.get_active_predictor()

        # 3. Model Inference
        risk_score, category, confidence, factors = await predictor.predict(features)

        now_utc = datetime.now(timezone.utc)

        # 4. Construct Validated Response
        return StressPredictionResponse(
            personnel_id=features.personnel_id,
            service_number=features.service_number,
            risk_score=risk_score,
            risk_category=category,
            prediction_source=predictor.prediction_source,
            model_name=predictor.model_name,
            model_version=predictor.model_version,
            confidence_score=confidence,
            predicted_at=now_utc,
            primary_risk_factors=factors,
            features_summary=features,
        )

    async def predict_unit_stress(
        self, db: AsyncSession, unit_name: str
    ) -> UnitStressRiskSummary:
        """
        Evaluates predictive stress risk for all active personnel assigned to a military unit.
        Returns unit risk distribution summary and individual predictions.
        """
        # Fetch personnel assigned to the given unit
        stmt = select(Personnel.id).where(
            Personnel.unit == unit_name.strip()
        ).order_by(Personnel.id.asc())
        res = await db.execute(stmt)
        personnel_ids = list(res.scalars().all())

        predictions: List[StressPredictionResponse] = []
        low_count = 0
        mod_count = 0
        high_count = 0
        crit_count = 0
        total_score = 0.0

        for p_id in personnel_ids:
            pred = await self.predict_personnel_stress(db, p_id)
            if pred:
                predictions.append(pred)
                total_score += pred.risk_score
                if pred.risk_category == RiskCategory.LOW:
                    low_count += 1
                elif pred.risk_category == RiskCategory.MODERATE:
                    mod_count += 1
                elif pred.risk_category == RiskCategory.HIGH:
                    high_count += 1
                elif pred.risk_category == RiskCategory.CRITICAL:
                    crit_count += 1

        total_evaluated = len(predictions)
        avg_score = round(total_score / total_evaluated, 3) if total_evaluated > 0 else 0.0

        return UnitStressRiskSummary(
            unit=unit_name.strip(),
            total_evaluated=total_evaluated,
            low_risk_count=low_count,
            moderate_risk_count=mod_count,
            high_risk_count=high_count,
            critical_risk_count=crit_count,
            unit_average_risk_score=avg_score,
            personnel_predictions=predictions,
        )

    def get_engine_status(self) -> ModelStatusResponse:
        """Reports active engine state, discovery diagnostics, and fallback health."""
        ml_available = self.ml_predictor.is_available()
        active_pred = self.get_active_predictor()

        if isinstance(self.ml_predictor, MLModelStressPredictor):
            available, loaded_path, error_msg = self.ml_predictor.get_status_detail()
        else:
            available = ml_available
            loaded_path = None
            error_msg = None

        if ml_available:
            status_msg = (
                f"Production ML model active ({active_pred.model_name} v{active_pred.model_version}). "
                "Inference running via serialized artifact."
            )
        else:
            status_msg = (
                "ML model artifact unavailable; system currently uses the deterministic heuristic fallback. "
                f"Active engine: {active_pred.model_name} v{active_pred.model_version}."
            )

        return ModelStatusResponse(
            ml_artifact_available=ml_available,
            active_model_name=active_pred.model_name,
            active_model_version=active_pred.model_version,
            model_path=loaded_path,
            fallback_enabled=settings.ML_FALLBACK_TO_HEURISTIC,
            supported_features_count=19,
            status_message=status_msg,
        )


# Global default service instance
prediction_service = PredictionService()
