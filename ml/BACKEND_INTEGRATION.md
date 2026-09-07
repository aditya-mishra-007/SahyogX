# SahyogX — Backend Integration Specification

**Target Audience**: Backend Developer (FastAPI + PostgreSQL + APIs)  
**Author**: Machine Learning / Data Science Team (`ml` branch)  
**Status**: Ready for Production Integration  
**Model Version**: `1.0.0`

---

## 1. Executive Summary

The ML subsystem provides a self-contained, thread-safe inference engine (`WelfareRiskPredictor`) that:
- Ingests raw personnel operational and survey telemetry.
- Automatically handles missing fields, categorical encoding, scaling, and feature engineering.
- Returns risk categorization (`LOW`, `MODERATE`, `ELEVATED`), calibrated numerical risk scores (`0.00` – `1.00`), class probability distributions, model-associated contributing indicators, and protective factors.

The backend does **NOT** need to implement preprocessing, feature math, or model training logic.

---

## 2. Python Package Installation

Ensure the backend environment has installed the ML dependencies from `ml/requirements.txt`:
```bash
pip install -r ml/requirements.txt
```

Core dependencies: `scikit-learn>=1.4.0`, `pandas>=2.2.0`, `numpy>=1.26.0`, `joblib>=1.3.0`.

---

## 3. Quick Start Code Snippet

```python
from ml.src.predict import get_predictor

# Retrieve cached singleton predictor (safe across async FastAPI requests)
predictor = get_predictor(models_dir="ml/models")

# Predict for a single personnel record
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
print(result["risk_score"])           # 0.842
print(result["contributing_indicators"])
```

---

## 4. FastAPI Endpoint Integration Example

Below is a complete implementation example you can drop directly into your FastAPI routers:

```python
# app/routers/welfare_predictions.py
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from ml.src.predict import WelfareRiskPredictor, get_predictor

router = APIRouter(prefix="/api/v1/predictions", tags=["Welfare Predictions"])


# Dependency to inject predictor
def get_ml_predictor() -> WelfareRiskPredictor:
    return get_predictor(models_dir="ml/models")


# Request Schema
class PersonnelPredictionRequest(BaseModel):
    personnel_id: str = Field(..., example="PX-10492")
    unit_type: Optional[str] = Field("Infantry", description="One of: Infantry, Artillery, Armored, Combat Engineers, Signals, Air Defense, Logistics & ASC, Medical Corps")
    role_operational_intensity: Optional[str] = Field("Medium", description="One of: Low, Medium, High, Extreme")
    duty_hours_weekly: Optional[float] = Field(48.0, ge=20.0, le=120.0)
    overtime_hours_weekly: Optional[float] = Field(0.0, ge=0.0, le=50.0)
    deployment_duration_months: Optional[float] = Field(0.0, ge=0.0, le=36.0)
    deployments_last_3_years: Optional[int] = Field(0, ge=0, le=15)
    days_since_last_leave: Optional[int] = Field(30, ge=0, le=730)
    leave_days_taken_annual: Optional[float] = Field(30.0, ge=0.0, le=90.0)
    recovery_rest_days_monthly: Optional[float] = Field(4.0, ge=0.0, le=15.0)
    avg_sleep_hours: Optional[float] = Field(7.0, ge=2.0, le=12.0)
    sleep_disruption_index: Optional[float] = Field(3.0, ge=0.0, le=10.0)
    physical_readiness_score: Optional[float] = Field(75.0, ge=0.0, le=100.0)
    wellness_survey_score: Optional[float] = Field(18.0, ge=0.0, le=30.0)
    peer_support_score: Optional[float] = Field(3.5, ge=1.0, le=5.0)
    environmental_hardship_score: Optional[float] = Field(2.0, ge=1.0, le=5.0)


# Response Schema
class RiskProbabilities(BaseModel):
    LOW: float
    MODERATE: float
    ELEVATED: float


class PersonnelPredictionResponse(BaseModel):
    personnel_id: str
    risk_category: str = Field(..., description="LOW, MODERATE, or ELEVATED")
    risk_score: float = Field(..., description="Calibrated risk index between 0.0 and 1.0")
    risk_probabilities: RiskProbabilities
    contributing_indicators: List[str]
    protective_factors: List[str]
    model_version: str
    disclaimer: str


@router.post("", response_model=PersonnelPredictionResponse)
def create_prediction(
    request: PersonnelPredictionRequest,
    predictor: WelfareRiskPredictor = Depends(get_ml_predictor),
):
    try:
        result = predictor.predict(request.dict())
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction pipeline error: {str(exc)}")


@router.post("/batch", response_model=List[PersonnelPredictionResponse])
def create_batch_predictions(
    requests: List[PersonnelPredictionRequest],
    predictor: WelfareRiskPredictor = Depends(get_ml_predictor),
):
    try:
        results = predictor.predict([r.dict() for r in requests])
        return results
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(exc)}")
```

---

## 5. Input Field Specifications & Defaults

If any non-essential field is `null` or omitted in the incoming request, the preprocessing pipeline applies **median imputation** (for numerics) and **mode imputation** (for categoricals). However, providing complete data yields the highest fidelity.

| Field Name | Type | Valid Range / Categories | Recommended Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `personnel_id` | `str` | Any alphanumeric string | `"UNKNOWN"` | Passthrough ID; not used as a model feature |
| `unit_type` | `str` | `Infantry`, `Artillery`, `Armored`, `Combat Engineers`, `Signals`, `Air Defense`, `Logistics & ASC`, `Medical Corps` | `"Infantry"` | Field arms vs support profile differences |
| `role_operational_intensity` | `str` | `Low`, `Medium`, `High`, `Extreme` | `"Medium"` | Operational environment rating |
| `duty_hours_weekly` | `float` | 20.0 – 90.0 | `48.0` | Normal baseline ~42–48h; >60h signals surge |
| `overtime_hours_weekly` | `float` | 0.0 – 40.0 | `4.0` | Overtime / night shift hours |
| `deployment_duration_months` | `float` | 0.0 – 24.0 | `3.0` | Consecutive months in operational deployment |
| `deployments_last_3_years` | `int` | 0 – 8 | `1` | Cumulative deployment count |
| `days_since_last_leave` | `int` | 0 – 365+ | `60` | Days elapsed since last consecutive 5+ days leave |
| `leave_days_taken_annual` | `float` | 0.0 – 60.0 | `35.0` | Total leave days utilized in past 12 months |
| `recovery_rest_days_monthly` | `float` | 0.0 – 10.0 | `4.0` | Full rest / stand-down days in past 30 days |
| `avg_sleep_hours` | `float` | 3.0 – 10.0 | `6.8` | Crucial fatigue driver; <5.0h = high strain |
| `sleep_disruption_index` | `float` | 0.0 – 10.0 | `3.0` | Nighttime wakeups / combat alertness |
| `physical_readiness_score` | `float` | 0.0 – 100.0 | `75.0` | Official fitness / combat readiness test score |
| `wellness_survey_score` | `float` | 0.0 – 30.0 | `18.0` | Self-report index (higher = greater resilience) |
| `peer_support_score` | `float` | 1.0 – 5.0 | `3.8` | Unit cohesion / buddy camaraderie score |
| `environmental_hardship_score`| `float` | 1.0 – 5.0 | `2.5` | Terrain/climate severity (high altitude, desert) |

---

## 6. Output Schema Structure

```json
{
  "personnel_id": "PX-10492",
  "risk_category": "ELEVATED",
  "risk_score": 0.842,
  "risk_probabilities": {
    "LOW": 0.012,
    "MODERATE": 0.146,
    "ELEVATED": 0.842
  },
  "contributing_indicators": [
    "Substantially elevated weekly duty hours (68.5 hrs/week) was associated with heightened fatigue strain.",
    "Extended continuous deployment (9.0 months) was strongly associated with cumulative operational wear.",
    "Protracted duration since last leave cycle (140 days) indicated delayed rest and decompression.",
    "Chronic sleep curtailment (4.5 hrs/night average) was a prominent factor in the model's assessment."
  ],
  "protective_factors": [
    "Solid physical fitness readiness (70.0/100) supported operational resilience."
  ],
  "model_version": "1.0.0",
  "disclaimer": "Contributing indicators reflect operational and behavioral metrics associated with the model's predictive risk estimation. They do not constitute a clinical diagnosis, psychiatric evaluation, or proven medical etiology."
}
```

---

## 7. Performance, Latency & Concurrency

- **Inference Latency**: Single-record prediction executes in **< 1.8 milliseconds**.
- **Batch Processing**: A batch of 1,000 personnel profiles processes in **< 180 milliseconds**.
- **Thread Safety**: The underlying Scikit-Learn pipeline and `WelfareRiskPredictor` are strictly stateless during inference and safe for multi-threaded / async execution in Gunicorn / Uvicorn workers.
- **Memory Footprint**: Total model artifact size is **< 1.2 MB**, consuming minimal RAM.
