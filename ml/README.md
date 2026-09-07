# SahyogX — Machine Learning & Data Science Subsystem
### AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces

> **ETHICAL & MEDICAL DISCLAIMER**:  
> The SahyogX ML Subsystem predicts **operational welfare and stress risk indicators** designed to assist commanders and welfare officers with proactive personnel outreach, rotational duty management, and rest scheduling.  
> **This system does NOT provide a medical diagnosis, clinical psychiatric evaluation, or psychological disorder determination.**  
> Synthetic data is used for prototype/testing purposes and does not represent actual personnel.

---

## Table of Contents
1. [Dataset Sources & OPSEC Justification](#1-dataset-sources--opsec-justification)
2. [Data Dictionary](#2-data-dictionary)
3. [Preprocessing Pipeline](#3-preprocessing-pipeline)
4. [Feature Engineering](#4-feature-engineering)
5. [Candidate Models Tested](#5-candidate-models-tested)
6. [Comprehensive Evaluation Results](#6-comprehensive-evaluation-results)
7. [Selected Model & Metric Justification](#7-selected-model--metric-justification)
8. [Model Artifacts & Serialization](#8-model-artifacts--serialization)
9. [Prediction Interface](#9-prediction-interface)
10. [Example Predictions & Explainability](#10-example-predictions--explainability)
11. [Backend Integration Specifications](#11-backend-integration-specifications)
12. [System Limitations](#12-system-limitations)
13. [Bias, Fairness & Ethical Governance](#13-bias-fairness--ethical-governance)
14. [Reproducibility & Test Execution](#14-reproducibility--test-execution)

---

## 1. Dataset Sources & OPSEC Justification

In uniformed military, paramilitary, and specialized law-enforcement services, daily duty logs, tactical unit assignments, active deployment durations, and operational leave schedules are strictly restricted under **Operational Security (OPSEC)**, national security defense directives, and personnel privacy mandates.

### Research Base & Public Datasets:
1. **Army Study to Assess Risk and Resilience in Servicemembers (Army STARRS / STARRS-LS)**:
   - *Source*: ICPSR Data Enclave (ICPSR 35198 / ICPSR 36340).
   - *Contribution*: Provided empirical correlation profiles between continuous operational stress, unit peer support buffers, physical resilience, and cumulative strain.
   - *Limitation*: Granular, real-time tactical deployment logs and unit movement telemetry are redacted in public-use files to safeguard active personnel.
2. **Department of Defense Health Related Behaviors Survey (DoD HRBS)**:
   - *Source*: DoD / RAND Corporation Defense Health Reports.
   - *Contribution*: Provided population-level baselines on military sleep deprivation (<5.5h identified as a chronic operational stress driver), shift length impacts, and psychological resilience scores.
   - *Limitation*: Published as cross-sectional survey tables without longitudinal daily duty tracking.
3. **OPM Federal Employee Viewpoint Survey (FEVS)**:
   - *Source*: US Office of Personnel Management.
   - *Contribution*: Workload fatigue and leadership support indices for defense civilian workforces.
   - *Limitation*: Lacks combat, field operational hardship, and uniformed rotational dynamics.

### Synthetic Data Generator Rationale:
To ensure 100% reproducibility without violating defense confidentiality, SahyogX includes a dedicated generator (`ml/src/data_generator.py`) that models the non-linear physiological and operational stress relationships validated in military health literature.

---

## 2. Data Dictionary

### Raw Input Features

| Variable | Type | Domain / Range | Description & Domain Justification |
| :--- | :--- | :--- | :--- |
| `personnel_id` | `str` | `PX-10000` to `PX-99999` | De-identified personnel token. Excluded from model features. |
| `unit_type` | `str` | 8 Categories: `Infantry`, `Artillery`, `Armored`, `Combat Engineers`, `Signals`, `Air Defense`, `Logistics & ASC`, `Medical Corps` | Captures field combat vs combat-support operational demands. |
| `role_operational_intensity` | `str` | `Low`, `Medium`, `High`, `Extreme` | Operational tempo and risk tier of current unit deployment location. |
| `duty_hours_weekly` | `float` | `36.0` to `84.0` hrs/week | Weekly on-duty shift hours. Normal: 42–48h; Surge: >65h. |
| `overtime_hours_weekly` | `float` | `0.0` to `32.0` hrs/week | Extended shift and emergency watch hours beyond standard duty. |
| `deployment_duration_months` | `float` | `0.0` to `18.0` months | Continuous months stationed in active operational deployment. |
| `deployments_last_3_years` | `int` | `0` to `6` | Cumulative deployment rotation frequency. |
| `days_since_last_leave` | `int` | `10` to `365` days | Elapsed days since last consecutive 5+ days leave (leave starvation metric). |
| `leave_days_taken_annual` | `float` | `5.0` to `60.0` days | Actual leave days utilized in the preceding 12-month cycle. |
| `recovery_rest_days_monthly` | `float` | `0.0` to `8.0` days/month | Dedicated stand-down and complete rest days in the last 30 days. |
| `avg_sleep_hours` | `float` | `3.5` to `8.5` hrs/night | Average daily sleep opportunity. Identified in DoD HRBS as core fatigue driver. |
| `sleep_disruption_index` | `float` | `0.0` to `10.0` | Frequency of broken sleep from night watches, alarms, and combat alertness. |
| `physical_readiness_score` | `float` | `40.0` to `100.0` | Standardized combat fitness and physical efficiency test score. |
| `wellness_survey_score` | `float` | `0.0` to `30.0` | Periodic self-reported wellness index (higher = greater resilience). |
| `peer_support_score` | `float` | `1.0` to `5.0` | Unit cohesion and buddy support rating (Army STARRS protective buffer). |
| `environmental_hardship_score`| `float` | `1.0` to `5.0` | Terrain severity (high-altitude, extreme cold, desert, dense jungle). |

### Target Variables

| Target | Type | Categories / Domain | Definition |
| :--- | :--- | :--- | :--- |
| `risk_category` | `str` | `LOW`, `MODERATE`, `ELEVATED` | Primary multi-class target representing operational welfare risk tier. |
| `risk_score` | `float` | `0.00` to `1.00` | Calibrated continuous composite risk score. |

---

## 3. Preprocessing Pipeline

The preprocessing workflow (`ml/src/preprocessing.py`) guarantees robust execution across real-world edge cases:

```
Raw Personnel Telemetry
         │
         ▼
[OperationalWelfareFeatureEngineer]  --> Generates 7 Domain-Informed Derived Metrics
         │
         ▼
[ColumnTransformer]
 ├── Numerical Pipeline:
 │    ├── SimpleImputer(strategy='median')  --> Robust against operational surge outliers
 │    └── RobustScaler()                    --> Centers on IQR to resist extreme duty spikes
 │
 └── Categorical Pipeline:
      ├── SimpleImputer(strategy='most_frequent')
      └── OneHotEncoder(handle_unknown='ignore', sparse_output=False)
         │
         ▼
Clean, Scaled 32-Dimensional Feature Matrix
```

### Stratified Partitioning:
Data is split using **stratified sampling** on `risk_category` to preserve the minority `ELEVATED` risk cohort across all sets:
- **Train Set**: 70% (3,500 samples)
- **Validation Set**: 15% (750 samples)
- **Test Set**: 15% (750 samples)

---

## 4. Feature Engineering

Derived features (`ml/src/feature_engineering.py`) model compound physiological interactions validated in defense literature:

1. **`sleep_deficit_hours`**:
   $$\text{sleep\_deficit\_hours} = \max(0, 7.5 - \text{avg\_sleep\_hours})$$
   *Rationale*: Sleep debt below the military operational threshold of 7.5 hours per night.
2. **`composite_fatigue_index`**:
   $$\text{fatigue} = (\text{sleep\_deficit} \times 1.6) + (\text{sleep\_disruption} \times 0.75) + (\max(0, \text{duty\_hours} - 48) \times 0.12)$$
   *Rationale*: Incorporates both chronic sleep debt, circadian fragmentation, and shift elongation.
3. **`deployment_to_recovery_ratio`**:
   $$\text{dep\_rec\_ratio} = \frac{\text{deployment\_duration\_months}}{\max(1.0, \text{recovery\_rest\_days\_monthly})}$$
   *Rationale*: Evaluates whether field exposure is balanced by commensurate monthly rest cycles.
4. **`leave_deprivation_index`**:
   $$\text{leave\_dep\_index} = \frac{\text{days\_since\_last\_leave}}{\max(10.0, \text{leave\_days\_taken\_annual})}$$
   *Rationale*: Quantifies severe leave starvation when personnel are overdue for furlough.
5. **`operational_strain_index`**:
   $$\text{strain} = \left(\frac{\text{duty\_hours}}{40.0}\right) \times (1.0 + 0.12 \times (\text{hardship} - 1.0))$$
   *Rationale*: Scales work hours by the physiological burden of terrain and climate hardship.
6. **`protective_buffer_score`**:
   $$\text{buffer} = (0.40 \times \text{cohesion}) + (0.35 \times \text{wellness}) + (0.25 \times \text{fitness})$$
   *Rationale*: Implements the Army STARRS finding that unit cohesion and fitness act as active shields against stress.
7. **`net_vulnerability_index`**:
   $$\text{net\_vuln} = (0.45 \times \text{strain} + 0.45 \times \text{fatigue}) - (0.80 \times \text{buffer})$$
   *Rationale*: Unified composite quantifying net balance between operational strain and resilience reserves.

---

## 5. Candidate Models Tested

Three foundational model architectures were trained and evaluated on identical stratified splits:

1. **Multinomial Logistic Regression (`LogisticRegression`)**:
   - Class weight: `balanced`
   - Regularization: L2 (Ridge, $C=1.0$)
   - Solver: `lbfgs`
   - Advantage: Highly interpretable linear log-odds, robust generalization, lightning-fast inference (<0.1ms).
2. **Balanced Random Forest (`RandomForestClassifier`)**:
   - Trees: 150
   - Max depth: 12
   - Class weight: `balanced`
   - Advantage: Non-linear interaction handling, ensemble bagging variance reduction.
3. **Histogram-based Gradient Boosting (`HistGradientBoostingClassifier`)**:
   - Max iterations: 120
   - Learning rate: 0.08
   - Class weight: `balanced`
   - Advantage: Native histogram binning, high modeling flexibility, strong gradient optimization.

---

## 6. Comprehensive Evaluation Results

### Model Comparison Table (Test Set: $N = 750$)

| Model Architecture | Accuracy | Balanced Accuracy | ELEVATED Recall (Sensitivity) | Precision (Macro) | Recall (Macro) | F1-Score (Macro) | ROC-AUC (Macro) | Fit Time (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Selected)** | **0.9387** | **0.9327** | **0.9400** | **0.8800** | **0.9327** | **0.9039** | **0.9900** | **0.06s** |
| Balanced Random Forest | 0.9427 | 0.9263 | 0.9200 | 0.8931 | 0.9263 | 0.9015 | 0.9854 | 0.27s |
| HistGradientBoosting | 0.9493 | 0.9330 | 0.9200 | 0.9298 | 0.9330 | 0.9247 | 0.9882 | 1.80s |

### Detailed Test Set Confusion Matrix — Selected Model (`LogisticRegression`)

```
True \ Pred    | LOW        | MODERATE   | ELEVATED  
-----------------------------------------------------
LOW            | 488        | 26         | 0         
MODERATE       | 5          | 169        | 12        
ELEVATED       | 0          | 3          | 47        
```

### Per-Class Performance Breakdown (Selected Model)

| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **LOW** | 0.9898 | 0.9494 | 0.9692 | 514 |
| **MODERATE** | 0.8535 | 0.9086 | 0.8802 | 186 |
| **ELEVATED** | 0.7966 | **0.9400** | 0.8624 | 50 |

---

## 7. Selected Model & Metric Justification

### Selected Model: `LogisticRegression` (L2 Balanced)

### Why Recall on ELEVATED Risk Matters Most:
In personnel welfare and military operational safety:
- **False Negative Cost**: Catastrophic. Failing to identify a service member enduring acute operational exhaustion or distress means leadership intervention is missed, heightening risks of operational accidents, chronic physical breakdown, or mental crises.
- **False Positive Cost**: Low and benign. Flagging a personnel profile for potential elevated risk simply prompts a commander or welfare officer to conduct a supportive check-in, review leave scheduling, or adjust sleep rosters.

### Key Justification Highlights:
1. **Highest ELEVATED Recall**: Achieved **94.00% Recall** on the critical `ELEVATED` cohort (47/50 correctly identified; the remaining 3 were classified as `MODERATE`, meaning they remain on active welfare watch). **Zero** elevated cases were misclassified as `LOW`.
2. **Zero False Alarms for Baseline Personnel**: Exactly **0** `LOW` risk individuals were classified as `ELEVATED`.
3. **Interpretability & Transparency**: In uniformed forces, black-box decisions face resistance. Logistic regression enables transparent mathematical auditing of odds-ratios.
4. **Computational Efficiency**: 0.06s training time, sub-millisecond inference, minimal memory footprint.

---

## 8. Model Artifacts & Serialization

All production artifacts are serialized in `ml/models/`:

```
ml/models/
├── best_model.joblib            # Serialized fitted LogisticRegression classifier
├── preprocessor.joblib          # Serialized fitted ColumnTransformer & Feature Pipeline
├── welfare_risk_pipeline.joblib # Unified Scikit-Learn Pipeline (preprocessor + classifier)
└── model_metadata.json          # Machine-readable evaluation metrics, features, thresholds
```

---

## 9. Prediction Interface

The `WelfareRiskPredictor` class (`ml/src/predict.py`) provides a clean interface for the FastAPI backend:

```python
from ml.src.predict import get_predictor

# Instantiate or retrieve singleton predictor
predictor = get_predictor()

# Pass standard dictionary
result = predictor.predict({
    "personnel_id": "PX-10492",
    "unit_type": "Infantry",
    "role_operational_intensity": "Extreme",
    "duty_hours_weekly": 74.0,
    "overtime_hours_weekly": 18.0,
    "deployment_duration_months": 11.5,
    "deployments_last_3_years": 4,
    "days_since_last_leave": 195,
    "leave_days_taken_annual": 12.0,
    "recovery_rest_days_monthly": 1.0,
    "avg_sleep_hours": 4.2,
    "sleep_disruption_index": 8.5,
    "physical_readiness_score": 68.0,
    "wellness_survey_score": 9.0,
    "peer_support_score": 3.2,
    "environmental_hardship_score": 4.8,
})
```

---

## 10. Example Predictions & Explainability

### Example Output (Acute Strain Scenario)

```json
{
  "personnel_id": "PX-10492",
  "risk_category": "ELEVATED",
  "risk_score": 0.920,
  "risk_probabilities": {
    "LOW": 0.0000,
    "MODERATE": 0.0006,
    "ELEVATED": 0.9994
  },
  "contributing_indicators": [
    "Chronic sleep curtailment (4.2 hrs/night average) was a prominent factor in the model's assessment.",
    "Substantially elevated weekly duty hours (74.0 hrs/week) was associated with heightened fatigue strain.",
    "Protracted duration since last leave cycle (195 days) indicated delayed rest and decompression.",
    "Demanding terrain and environmental hardship factor (4.8/5.0) compounded physical demands."
  ],
  "protective_factors": [
    "Standard organizational baseline buffers active."
  ],
  "model_version": "1.0.0",
  "disclaimer": "Contributing indicators reflect operational and behavioral metrics associated with the model's predictive risk estimation. They do not constitute a clinical diagnosis, psychiatric evaluation, or proven medical etiology."
}
```

---

## 11. Backend Integration Specifications

Refer to the companion document [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md) for full details, including:
- Pydantic request/response schemas.
- Sample FastAPI routes for `POST /api/v1/predictions` and `POST /api/v1/predictions/batch`.
- Latency and thread-safety specifications.

---

## 12. System Limitations

1. **Synthetic Nature of Operational Prototype Data**: While mathematically grounded in published military research (DoD HRBS, Army STARRS), the training dataset is synthetic. Real deployments will require domain calibration using site-specific telemetry.
2. **Self-Report Survey Vulnerability**: Variables like `wellness_survey_score` and `sleep_disruption_index` rely on periodic self-reporting, which can be subject to under-reporting due to military culture or stigma. The model is designed to detect objective operational strain (duty hours, leave lag) even if self-reports are missing.
3. **Cross-Sectional Inference**: Predictions are evaluated on current rolling averages. Longitudinal trend modeling (e.g. sequence-based LSTM/GRU) can be evaluated in future iterations once time-series logs are available.

---

## 13. Bias, Fairness & Ethical Governance

1. **Exclusion of Sensitive Demographic Attributes**:
   - Variables such as **religion, caste, home state, gender, marital status, age, and race** are **strictly excluded** from the feature space.
   - Predictions rely purely on actionable, organizational, physiological, and operational factors.
2. **Preventing Disparate Impact Across Unit Types**:
   - Field units (Infantry/Engineers) inherently face higher operational intensity than headquarters or logistics units. The model uses balanced scaling and composite indices to avoid disproportionately flagging field arms simply for being deployed.
3. **Non-Punitive Mandate**:
   - The tool is designed strictly as a **welfare decision support system**. Outputs must never be used for disciplinary actions, performance demotions, or denying promotional opportunities.
4. **Non-Diagnostic Framing**:
   - All explainability outputs use associative framing (*"associated with elevated risk"*) rather than diagnostic claims (*"caused depression"*).

---

## 14. Reproducibility & Test Execution

### 1. Run Unit & Integration Tests
```bash
py -m pytest ml/tests/ -v
```
All 10 unit and integration tests validate the data generator, feature engineering math, preprocessing pipeline, model training, and prediction API contract.

### 2. Regenerate Synthetic Dataset
```bash
py ml/scripts/generate_data.py --samples 5000 --output ml/data/raw/personnel_welfare_synthetic_raw.csv
```

### 3. Run Full Model Training & Evaluation
```bash
py ml/scripts/run_training.py
```

### 4. Run Sample Inference Demonstration
```bash
py ml/scripts/run_inference_sample.py
```
