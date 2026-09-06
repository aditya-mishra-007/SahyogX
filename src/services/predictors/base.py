from abc import ABC, abstractmethod
from typing import Tuple, List
from src.schemas.prediction import (
    PersonnelStressFeatures,
    PredictionSource,
    RiskCategory,
    RiskFactor,
)


class BaseStressPredictor(ABC):
    """
    Abstract Model-Agnostic Stress Predictor Contract.
    All predictive engines (heuristic baseline, scikit-learn, XGBoost, ONNX, etc.)
    must conform to this interface.
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Human-readable identifier for the model."""
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Version tag of the prediction model."""
        pass

    @property
    @abstractmethod
    def prediction_source(self) -> PredictionSource:
        """Categorical classification of prediction engine source."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Indicates whether this predictor has loaded all artifacts and is ready for inference."""
        pass

    @abstractmethod
    async def predict(
        self, features: PersonnelStressFeatures
    ) -> Tuple[float, RiskCategory, float, List[RiskFactor]]:
        """
        Executes inference on the aggregated feature vector.

        Returns:
            Tuple containing:
            - risk_score: float bounded within [0.0, 1.0]
            - risk_category: RiskCategory (LOW, MODERATE, HIGH, CRITICAL)
            - confidence_score: float bounded within [0.0, 1.0]
            - primary_risk_factors: List[RiskFactor] with explainable contributors
        """
        pass
