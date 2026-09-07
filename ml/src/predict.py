"""
SahyogX - Backend Prediction Interface

This module provides the public inference interface for the FastAPI backend developer.
It abstracts all internal feature engineering, scaling, model loading, and explainability.

Usage Example for Backend Developer:
    from ml.src.predict import get_predictor

    predictor = get_predictor()
    result = predictor.predict({
        "personnel_id": "PX-10492",
        "unit_type": "Infantry",
        "role_operational_intensity": "High",
        "duty_hours_weekly": 68.5,
        "overtime_hours_weekly": 14.0,
        "deployment_duration_months": 9.0,
        "deployments_last_3_years": 3,
        "days_since_last_leave": 140,
        "leave_days_taken_annual": 25.0,
        "recovery_rest_days_monthly": 1.5,
        "avg_sleep_hours": 4.5,
        "sleep_disruption_index": 7.5,
        "physical_readiness_score": 70.0,
        "wellness_survey_score": 12.0,
        "peer_support_score": 3.2,
        "environmental_hardship_score": 4.0,
    })

    print(result["risk_category"])        # 'ELEVATED'
    print(result["risk_score"])           # 0.84
    print(result["contributing_indicators"])
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union, overload
import joblib
import numpy as np
import pandas as pd

from .explainability import WelfareExplainabilityEngine
from .preprocessing import ALL_INPUT_FEATURES, BASE_NUMERICAL_FEATURES, TARGET_CLASSES


# Global singleton predictor instance
_GLOBAL_PREDICTOR = None


class WelfareRiskPredictor:
    """
    Self-contained inference engine for predicting uniformed personnel
    welfare and stress risk with contributing indicators.
    """

    def __init__(
        self,
        pipeline: Any,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.pipeline = pipeline
        self.metadata = metadata or {}
        self.model_version = self.metadata.get("model_version", "1.0.0")
        self.classes = self.metadata.get("target_classes", TARGET_CLASSES)
        self.explain_engine = WelfareExplainabilityEngine(model_artifact=pipeline)

    @classmethod
    def from_directory(cls, models_dir: Union[str, Path] = "ml/models") -> "WelfareRiskPredictor":
        """
        Loads pre-trained pipeline and metadata from the specified models directory.
        """
        models_path = Path(models_dir)

        pipeline_file = models_path / "welfare_risk_pipeline.joblib"
        metadata_file = models_path / "model_metadata.json"

        if not pipeline_file.exists():
            # Check individual artifacts as fallback
            preprocessor_file = models_path / "preprocessor.joblib"
            classifier_file = models_path / "best_model.joblib"
            if preprocessor_file.exists() and classifier_file.exists():
                from sklearn.pipeline import Pipeline
                preprocessor = joblib.load(preprocessor_file)
                classifier = joblib.load(classifier_file)
                pipeline = Pipeline([
                    ("preprocessor", preprocessor),
                    ("classifier", classifier),
                ])
            else:
                raise FileNotFoundError(
                    f"Model artifacts not found in {models_dir}. Please run training script first."
                )
        else:
            pipeline = joblib.load(pipeline_file)

        metadata = {}
        if metadata_file.exists():
            with open(metadata_file, "r") as f:
                metadata = json.load(f)

        return cls(pipeline=pipeline, metadata=metadata)

    def _prepare_input_df(self, raw_input: Dict[str, Any]) -> Tuple[pd.DataFrame, str]:
        """
        Validates and standardizes single-record input into a 1-row DataFrame.
        Handles string-to-float conversions for numerical features gracefully.
        """
        personnel_id = str(raw_input.get("personnel_id", "UNKNOWN"))
        row_data = {}
        for k in ALL_INPUT_FEATURES:
            val = raw_input.get(k, np.nan)
            if k in BASE_NUMERICAL_FEATURES:
                if val is not None and not (isinstance(val, float) and np.isnan(val)):
                    try:
                        row_data[k] = [float(val)]
                    except (ValueError, TypeError):
                        row_data[k] = [np.nan]
                else:
                    row_data[k] = [np.nan]
            else:
                row_data[k] = [val]
        return pd.DataFrame(row_data), personnel_id

    def predict_single(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates risk prediction and contributing indicators for a single personnel record.
        """
        df, personnel_id = self._prepare_input_df(features)

        # Predict probabilities and label
        pred_label = str(self.pipeline.predict(df)[0])
        probas = self.pipeline.predict_proba(df)[0]

        # Safely extract class labels from pipeline or fallback to target classes
        if hasattr(self.pipeline, "named_steps") and "classifier" in self.pipeline.named_steps:
            classifier = self.pipeline.named_steps["classifier"]
        else:
            classifier = self.pipeline
        raw_classes = getattr(classifier, "classes_", None)
        class_names = list(raw_classes) if raw_classes is not None else list(self.classes)
        prob_dict = {cls: float(np.round(p, 4)) for cls, p in zip(class_names, probas)}

        # Numerical continuous risk score:
        # Weighted expectation or elevated-class probability
        # Here we compute risk score as: 0.10*P(LOW) + 0.50*P(MODERATE) + 0.95*P(ELEVATED)
        p_low = prob_dict.get("LOW", 0.0)
        p_mod = prob_dict.get("MODERATE", 0.0)
        p_ele = prob_dict.get("ELEVATED", 0.0)
        calibrated_score = float(np.round(0.05 * p_low + 0.48 * p_mod + 0.92 * p_ele, 3))

        # Explainability
        explanation = self.explain_engine.explain_instance(
            features=features,
            risk_category=pred_label,
            risk_score=calibrated_score,
        )

        return {
            "personnel_id": personnel_id,
            "risk_category": pred_label,
            "risk_score": calibrated_score,
            "risk_probabilities": prob_dict,
            "contributing_indicators": explanation["contributing_indicators"],
            "protective_factors": explanation["protective_factors"],
            "model_version": self.model_version,
            "disclaimer": explanation["clinical_disclaimer"],
        }

    def predict_batch(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Batch prediction over a list of personnel dictionaries.
        """
        return [self.predict_single(r) for r in records]

    @overload
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        ...

    @overload
    def predict(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ...

    def predict(
        self, data: Union[Dict[str, Any], List[Dict[str, Any]]]
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Unified polymorphic predict method accepting either a single dict or list of dicts.
        """
        if isinstance(data, dict):
            return self.predict_single(data)
        elif isinstance(data, list):
            return self.predict_batch(data)
        else:
            raise ValueError(f"Unsupported data type {type(data)}. Expected dict or list of dicts.")


def get_predictor(models_dir: str = "ml/models") -> WelfareRiskPredictor:
    """
    Returns a cached singleton instance of WelfareRiskPredictor.
    Safe for repeated calls across FastAPI request cycles.
    """
    global _GLOBAL_PREDICTOR
    if _GLOBAL_PREDICTOR is None:
        # Handle relative or absolute paths gracefully
        base_dir = Path(__file__).resolve().parent.parent / "models"
        target_dir = Path(models_dir) if Path(models_dir).exists() else base_dir
        _GLOBAL_PREDICTOR = WelfareRiskPredictor.from_directory(target_dir)
    return _GLOBAL_PREDICTOR
