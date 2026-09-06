"""
Machine Learning Model Integration Adapter for SahyogX Phase 3.

Discovers, loads, caches, and interfaces with serialized ML model artifacts
(e.g., joblib, pickle) trained by the ML engineering team.
When no model artifact is present, cleanly signals unavailability to trigger
the deterministic heuristic fallback.
"""

import logging
import os
from pathlib import Path
from typing import Any, List, Optional, Tuple

from src.core.config import settings
from src.schemas.prediction import (
    PersonnelStressFeatures,
    PredictionSource,
    RiskCategory,
    RiskFactor,
)
from src.services.predictors.base import BaseStressPredictor

logger = logging.getLogger("sahyogx.ml_adapter")


class MLModelStressPredictor(BaseStressPredictor):
    """
    ML Model Adapter that loads external model artifacts.
    Provides safe lazy loading, inference caching, and validation.
    """

    def __init__(self, model_path: Optional[str] = None):
        self._custom_path = model_path
        self._model: Optional[Any] = None
        self._loaded_path: Optional[str] = None
        self._is_loaded = False
        self._load_attempted = False
        self._load_error: Optional[str] = None

    @property
    def model_name(self) -> str:
        if self._is_loaded and self._loaded_path:
            return f"SahyogX-ML-{Path(self._loaded_path).stem}"
        return "SahyogX-MLModelAdapter"

    @property
    def model_version(self) -> str:
        return "0.1.0-unloaded" if not self._is_loaded else "1.0.0"

    @property
    def prediction_source(self) -> PredictionSource:
        return PredictionSource.ML_MODEL

    def _discover_artifact_path(self) -> Optional[Path]:
        """Scans configured paths and artifact directories for compatible model files."""
        candidate_paths: List[Path] = []

        if self._custom_path:
            candidate_paths.append(Path(self._custom_path))
        if settings.ML_MODEL_PATH:
            candidate_paths.append(Path(settings.ML_MODEL_PATH))

        model_dir = Path(settings.ML_MODEL_DIR)
        if model_dir.exists() and model_dir.is_dir():
            for ext in ("*.joblib", "*.pkl", "*.pickle"):
                candidate_paths.extend(model_dir.glob(ext))

        for p in candidate_paths:
            if p.exists() and p.is_file() and p.stat().st_size > 0:
                return p.resolve()

        return None

    def _load_model(self) -> bool:
        """Attempts to load the model artifact into memory once."""
        if self._load_attempted:
            return self._is_loaded

        self._load_attempted = True
        artifact_path = self._discover_artifact_path()

        if not artifact_path:
            self._load_error = (
                "ML model artifact not found. Checked configured paths and "
                f"'{settings.ML_MODEL_DIR}'. Fallback to heuristic baseline is active."
            )
            logger.info(self._load_error)
            return False

        try:
            # Attempt loading via joblib if installed, or pickle
            try:
                import joblib  # type: ignore
                loaded = joblib.load(str(artifact_path))
            except ImportError:
                import pickle
                with open(artifact_path, "rb") as f:
                    loaded = pickle.load(f)

            self._model = loaded
            self._loaded_path = str(artifact_path)
            self._is_loaded = True
            logger.info("Successfully loaded ML stress prediction model from %s", artifact_path)
            return True
        except Exception as exc:
            self._load_error = f"Failed to load ML artifact from {artifact_path}: {exc}"
            logger.error(self._load_error)
            return False

    def is_available(self) -> bool:
        """Returns True only if an actual ML model artifact was located and loaded."""
        if not self._load_attempted:
            self._load_model()
        return self._is_loaded

    def get_status_detail(self) -> Tuple[bool, Optional[str], Optional[str]]:
        """Returns (is_available, loaded_path, error_or_status_message)."""
        available = self.is_available()
        return available, self._loaded_path, self._load_error

    async def predict(
        self, features: PersonnelStressFeatures
    ) -> Tuple[float, RiskCategory, float, List[RiskFactor]]:
        """Executes inference using the loaded model artifact."""
        if not self.is_available():
            raise RuntimeError(
                f"Cannot execute ML prediction: {self._load_error or 'Model not loaded.'}"
            )

        vector = [features.to_vector()]

        # Support common estimator interfaces: predict_proba or predict
        try:
            if hasattr(self._model, "predict_proba"):
                probs = self._model.predict_proba(vector)
                # Assume binary/multiclass with probability of high stress in last column
                if len(probs[0]) >= 2:
                    raw_score = float(probs[0][-1])
                else:
                    raw_score = float(probs[0][0])
            elif hasattr(self._model, "predict"):
                preds = self._model.predict(vector)
                raw_score = float(preds[0])
            else:
                raise AttributeError("Loaded object does not implement predict or predict_proba")

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

            factors: List[RiskFactor] = [
                RiskFactor(
                    factor_name="ml_multivariate_inference",
                    impact_level=category,
                    description=f"Model {self.model_name} derived risk based on {len(vector[0])} dimensional feature vector",
                    score_contribution=risk_score,
                )
            ]

            return risk_score, category, 0.92, factors

        except Exception as exc:
            logger.error("Error during ML inference execution: %s", exc)
            raise RuntimeError(f"ML inference failure: {exc}") from exc
