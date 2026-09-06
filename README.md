# SahyogX — Backend Service

> **SIH Problem Statement:** AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces  
> **Repository Branch:** `backend`  
> **Phase Completed:** **Phase 4 — Alerts & Analytics**

---

## 1. Overview

**SahyogX Backend** is an asynchronous, high-throughput REST API engineered with **FastAPI**, **SQLAlchemy 2.0 (Async)**, and **PostgreSQL 17**. It acts as the secure intelligence and data core for monitoring personnel welfare, operational workload, deployment rotations, predictive stress evaluation, automated early warning alert triage, and force-wide battalion analytics across uniformed forces.

---

## 2. Architecture & Modules

```text
src/
├── main.py                       # FastAPI application entry point, CORS, exception handlers
├── core/
│   ├── config.py                 # Pydantic BaseSettings loaded from .env & ML model paths
│   ├── database.py               # Async engine, sessionmaker & connection health ping
│   ├── logging.py                # Centralized application logging
│   └── security.py               # bcrypt password hashing & signed PyJWT tokens
├── api/
│   ├── deps.py                   # Authentication & RBAC dependency injectors
│   ├── routes/
│   │   ├── auth.py               # /api/v1/auth (Login & User Profile)
│   │   ├── health.py             # /health & /api/health (Readiness Checks)
│   │   ├── personnel.py          # /api/v1/personnel (Directory & Service Records)
│   │   ├── deployments.py        # /api/v1/deployments (Postings & Hardship Tracking)
│   │   ├── duty.py               # /api/v1/duty (Shift Workload & Night Patrols)
│   │   ├── leaves.py             # /api/v1/leaves (Applications & Approvals)
│   │   ├── surveys.py            # /api/v1/surveys (Confidential Clinical Screenings)
│   │   ├── predictions.py        # /api/v1/predictions (ML & Heuristic Stress Evaluation)
│   │   ├── alerts.py             # /api/v1/alerts (Early Warning Alerts & Triage)
│   │   ├── analytics.py          # /api/v1/analytics (Unit Heatmaps & Theatre Metrics)
│   │   └── test_rbac.py          # Verification routes for role testing
│   └── v1/
│       └── router.py             # V1 Aggregator Router
├── models/                       # SQLAlchemy 2.0 Async ORM Models
│   ├── base.py                   # Base DeclarativeBase and TimestampMixin
│   ├── personnel.py              # Personnel table
│   ├── deployment.py             # Deployments table
│   ├── duty.py                   # Duty logs table
│   ├── leave.py                  # Leave records table
│   ├── survey.py                 # Wellness surveys table
│   └── alert.py                  # Early warning alerts table
├── schemas/                      # Pydantic v2 Request / Response DTOs
│   ├── auth.py
│   ├── user.py
│   ├── personnel.py
│   ├── deployment.py
│   ├── duty.py
│   ├── leave.py
│   ├── survey.py
│   ├── prediction.py             # Feature vectors & stress prediction responses
│   ├── alert.py                  # Alert lifecycle, triage payloads & interventions
│   └── analytics.py              # Unit heatmaps, theatre metrics & welfare summaries
└── services/                     # Business Logic Layer
    ├── auth_service.py
    ├── personnel_service.py
    ├── deployment_service.py
    ├── duty_service.py
    ├── leave_service.py
    ├── survey_service.py
    ├── feature_aggregator.py     # Aggregates 19 domain signals into ML feature representations
    ├── prediction_service.py     # Unified prediction orchestrator & unit analytics
    ├── alert_service.py          # Automated threshold scanning, deduplication & resolution
    ├── analytics_service.py      # Multi-unit heatmaps, theatre distributions & deep-dives
    └── predictors/               # Predictive Risk Engines
        ├── base.py               # BaseStressPredictor abstract contract
        ├── heuristic.py          # Deterministic explainable baseline predictor
        └── ml_adapter.py         # External trained model artifact adapter
alembic/                          # Database migration scripts (Phase 2 & Phase 4 tables)
scripts/                          # Synthetic defense dataset generator
tests/                            # Automated test suite (54 unit/integration tests)
```

---

## 3. Database Schema (PostgreSQL 17)

| Table Name | Description | Key Attributes | Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `personnel` | Uniformed personnel service records | `id`, `service_number`, `name`, `rank`, `role`, `unit`, `joining_date`, `status` | `service_number` UNIQUE, Indexed; Composite index on (`unit`, `rank`) |
| `deployments` | Field postings & operational hardship | `id`, `personnel_id`, `location`, `deployment_type`, `start_date`, `end_date`, `operational_intensity`, `status` | FK to `personnel.id` (CASCADE); Indexed on `personnel_id`, `start_date` |
| `duty_logs` | Daily workload shifts & night sentry | `id`, `personnel_id`, `duty_date`, `duty_type`, `hours_worked`, `night_duty`, `consecutive_duty_days`, `workload_score` | FK to `personnel.id` (CASCADE) |
| `leave_records` | Leave requests & deficit tracking | `id`, `personnel_id`, `leave_type`, `start_date`, `end_date`, `duration_days`, `status`, `reason` | FK to `personnel.id` (CASCADE) |
| `wellness_surveys`| Psychological & stress screenings | `id`, `personnel_id`, `survey_date`, `stress_score`, `sleep_quality_score`, `fatigue_score`, `wellbeing_score` | FK to `personnel.id` (CASCADE) |
| `alerts` | Early Warning System (EWS) triage records | `id`, `personnel_id`, `risk_score`, `risk_category`, `trigger_type`, `title`, `severity`, `status`, `recommended_action`, `resolution_notes`, `resolved_by`, `resolved_at` | FK to `personnel.id` (CASCADE); Indexed on (`status`, `severity`), (`personnel_id`, `status`), `created_at` |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint Area | Method | `COMMANDER` | `MEDICAL_OFFICER` | `PERSONNEL` | Privacy & Confidentiality Rule |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `/api/v1/personnel` | `GET` | ✅ | ✅ | ✅ | View personnel directory / profiles |
| `/api/v1/personnel` | `POST / PATCH / DELETE` | ✅ | ❌ | ❌ | Administrative personnel creation & modification |
| `/api/v1/deployments` | `GET` | ✅ | ✅ | ✅ | View field deployments and rotational assignments |
| `/api/v1/deployments` | `POST / PATCH` | ✅ | ❌ | ❌ | Postings assigned exclusively by Unit Commander |
| `/api/v1/duty` | `GET / POST` | ✅ | ✅ | ✅ | Log daily shifts and view operational workloads |
| `/api/v1/duty/.../summary` | `GET` | ✅ | ✅ | ✅ | Workload metrics, cumulative night shifts & fatigue |
| `/api/v1/leaves` | `GET / POST` | ✅ | ✅ | ✅ | Submit applications & view leave records |
| `/api/v1/leaves/{id}` | `PATCH` | ✅ | ✅ | ❌ | Approve or reject leave applications |
| `/api/v1/surveys` | `POST` | ❌ | ✅ | ✅ | Personnel submit self-assessments; Medics submit on duty |
| `/api/v1/surveys` | `GET` | ❌ | ✅ | ❌ | **Protected:** Raw clinical notes restricted to Medical Officers |
| `/api/v1/surveys/.../summary` | `GET` | ✅ | ✅ | ❌ | Aggregated wellness indices & calculated stress risk levels |
| `/api/v1/predictions/personnel/{id}` | `GET` | ✅ | ✅ | ✅ (Own Only) | Predict stress risk; Personnel strictly restricted to own record |
| `/api/v1/predictions/unit/{unit}` | `GET` | ✅ | ✅ | ❌ | Unit-level stress risk distribution & battalion averages |
| `/api/v1/predictions/model-status` | `GET` | ✅ | ✅ | ✅ | Active prediction engine diagnostics & telemetry |
| `/api/v1/alerts` | `GET` | ✅ | ✅ | ❌ | Alert triage queue; Personnel cannot view other soldiers' alerts |
| `/api/v1/alerts/scan` | `POST` | ✅ | ✅ | ❌ | Trigger automated force-wide risk threshold scan |
| `/api/v1/alerts/{id}` | `GET` | ✅ | ✅ | ✅ (Own Only) | Alert detail and recommendations; Personnel can view own alert |
| `/api/v1/alerts/{id}/status` | `PATCH` | ✅ | ✅ | ❌ | Acknowledge alert or transition lifecycle status |
| `/api/v1/alerts/{id}/resolve` | `POST` | ✅ | ✅ | ❌ | Formally resolve alert with mitigation audit trail |
| `/api/v1/analytics/heatmap` | `GET` | ✅ | ✅ | ❌ | Force-wide multi-unit stress risk heatmap |
| `/api/v1/analytics/theatres` | `GET` | ✅ | ✅ | ❌ | Deployment risk distribution by operational theatre |
| `/api/v1/analytics/unit/.../summary`| `GET` | ✅ | ✅ | ❌ | Battalion welfare deep-dive profile and deprivation rates |

---

## 5. Phase 3 — ML Bridge & Predictive Risk Engine

### Architecture & Predictive Pipeline
```text
Personnel Records (Duty, Deployments, Leaves, Surveys)
                      ↓
           Feature Aggregator Layer
                      ↓
    PersonnelStressFeatures (19 ML Dimensions)
                      ↓
        Unified Prediction Service
       ┌──────────────┴──────────────┐
       ▼                             ▼
[Primary] ML Model Adapter     [Fallback] Heuristic Predictor
(Artifact discovery & load)    (Deterministic bounded formula)
       └──────────────┬──────────────┘
                      ↓
       Validated StressPredictionResponse
       - Risk Score: [0.000 - 1.000]
       - Risk Category: LOW / MODERATE / HIGH / CRITICAL
       - Confidence Score: [0.0 - 1.0]
       - Primary Risk Factors (Explainable stress contributors)
```

### ML Model Artifact Status
> [!NOTE]
> **ML model artifact unavailable; system currently uses the deterministic heuristic fallback.**  
> Inspection of `origin/ml` confirmed that the ML branch currently contains only an initial repository commit without trained model artifacts. The `MLModelStressPredictor` adapter is fully implemented with artifact discovery (`.joblib`, `.pkl`) and seamless fallback to `HeuristicStressPredictor`. When the ML team pushes a serialized model artifact to `artifacts/models/` or sets `ML_MODEL_PATH`, the backend will automatically discover and load it without code changes.

### Feature Aggregation (19 Machine Learning Dimensions)
The feature aggregation layer transforms raw database records into a clean, normalized tabular feature vector (`PersonnelStressFeatures.to_vector()`):
1. **Tenure**: `service_months`
2. **Workload**: `recent_duty_hours`, `recent_night_duties`, `recent_max_consecutive_days`, `avg_workload_score`
3. **Deployment**: `has_active_deployment`, `active_deployment_days`, `active_deployment_intensity`, `active_deployment_type`, `lifetime_hardship_deployments`
4. **Recovery / Leave**: `days_since_last_leave`, `total_leave_days_past_year`, `rejected_leave_requests`
5. **Clinical Screening**: `latest_stress_score`, `latest_sleep_quality_score`, `latest_fatigue_score`, `latest_wellbeing_score`, `avg_stress_score_past_90d`, `avg_sleep_score_past_90d`, `flagged_for_counselor`

### Deterministic Heuristic Baseline Formulation
The baseline evaluates 4 key operational welfare pillars:
- **Pillar 1: Duty / Shift Workload (25%)** — High night sentry shifts, cumulative hours exceeding 180h/mo, and consecutive duty streaks.
- **Pillar 2: Deployment Hardship (25%)** — Extreme operational intensity, high-altitude/counter-insurgency theatre, and long active posting (>90 days).
- **Pillar 3: Leave Deprivation (20%)** — Time since last leave (>120 days), annual leave deficits (<20 days), and rejected leave requests.
- **Pillar 4: Clinical Wellness (30%)** — Survey stress rating, chronic fatigue, sleep disruption, and counselor acute trigger flags. *(If surveys are absent, weight is dynamically redistributed across the other 3 operational pillars)*.

---

## 6. Phase 4 — Early Warning System (EWS) & Unit Analytics

### Alert Lifecycle & Triage
```text
[ NEW ] ──( Acknowledge )──► [ ACKNOWLEDGED ] ──( Review )──► [ IN_REVIEW ]
   │                                                               │
   └────────────────────( Resolve / Dismiss )─────────────────────┴────► [ RESOLVED / DISMISSED ]
```
- **Automated Scanning & Deduplication**: Scans active personnel with customizable risk thresholds (default $\ge 0.60$ or clinical counselor referral). Automatically suppresses duplicate alerts if an active alert for that soldier was generated within the 7-day cooldown window.
- **Intervention Recommendations**: Generates actionable mitigations tailored to trigger factors:
  - *Duty Overload*: 48-hour rest cycle and mandatory day shift rotation.
  - *Hardship Deployment*: Mid-deployment recuperation or rotational relief.
  - *Leave Deprivation*: Expedited sanction of 10–14 days Annual/Casual Leave.
  - *Clinical Distress*: Direct consultation with Regimental Medical Officer (RMO) / Counselor.
- **Audit Logging**: Mandatory resolution notes, action taken, resolving officer username, and UTC timestamp recorded upon resolution.

### Force-Wide Unit Analytics & Heatmaps
- **Multi-Unit Stress Heatmap** (`/api/v1/analytics/heatmap`): Compares risk distribution across all battalions, identifying the most vulnerable units, active critical alert counts, and force-wide average scores.
- **Operational Theatres** (`/api/v1/analytics/theatres`): Analyzes deployed troops grouped by geographic theatre (Siachen, Kupwara, Thar, etc.) and terrain difficulty (High Altitude, Counter-Insurgency, Border Outpost).
- **Battalion Deep-Dive** (`/api/v1/analytics/unit/{unit}/summary`): Comprehensive unit profiles detailing 30-day duty averages, night shifts, leave deprivation rates, and active alert severity breakdowns.

---

## 7. Local Setup & Execution

### Step 1: Install Dependencies
Ensure your virtual environment is active:
```powershell
pip install -r requirements.txt
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` and set your local PostgreSQL 17 credentials:
```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
POSTGRES_DB=sahyogx
```

### Step 3: Run Database Migrations
```powershell
alembic upgrade head
```

### Step 4: Seed Synthetic Defense Data
```powershell
python -m scripts.seed_synthetic_data
```

### Step 5: Start the Development Server
```powershell
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 8. Running Automated Tests

Run the complete test suite (54 tests across Phases 1, 2, 3, and 4):
```powershell
pytest -v
```

All 54 tests validate database constraints, CRUD operations, date logic, input validations, RBAC confidentiality boundaries, feature aggregation robustness, heuristic risk bounds, ML adapter fallback behaviors, Early Warning alert deduplication, lifecycle transitions, resolution audit trails, and multi-unit analytics heatmaps.
