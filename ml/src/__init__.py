"""
SahyogX ML Core Source Modules:
- data_generator: Synthetic personnel welfare dataset generator
- preprocessing: Missing value imputation, encodings, and scaling
- feature_engineering: Operational strain, sleep deficit, and leave indices
- train: Model training and cross-validation
- evaluate: Comprehensive classification performance evaluation
- explainability: Feature attribution and model-associated indicator derivations
- predict: Production inference interface for FastAPI backend
"""

from .predict import WelfareRiskPredictor, get_predictor

__all__ = [
    "WelfareRiskPredictor",
    "get_predictor",
]
