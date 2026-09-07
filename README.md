# 🇮🇳 SahyogX — AI-Based Predictive Personnel Stress & Welfare Monitoring System

> **Smart India Hackathon (SIH)** | **Problem Statement:** AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces  
> **Live Web Portal (Vercel):** [SahyogX Production Portal](https://sahyog-x.vercel.app) *(or your Vercel URL)*  
> **Live API Backend (Render):** [`https://sahyog-x.onrender.com`](https://sahyog-x.onrender.com)  
> **Interactive API Documentation:** [`https://sahyog-x.onrender.com/docs`](https://sahyog-x.onrender.com/docs)  

---

## 🎖️ Executive Summary

Uniformed service personnel (Armed Forces, Central Armed Police Forces, State Police) operate in demanding environments involving high operational tempo, extreme terrain, isolation from family, disrupted circadian rhythms, and prolonged deployment cycles.

**SahyogX** is an end-to-end, privacy-respecting, AI-driven personnel welfare platform. It synthesizes operational telemetry (duty rosters, night sentry hours, continuous field deployments, leave deficits) with voluntary confidential wellness screenings to proactively detect psychological strain, burnout, and acute fatigue **before** they manifest into crises.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Layer (React 19 + TypeScript + Vite)"]
        UI_Personnel["Personnel Self-Service Portal"]
        UI_Officer["Unit Medical & Welfare Officer Dashboard"]
        UI_Commander["Battalion / Theatre Commander View"]
    end

    subgraph Edge ["Edge & CDN"]
        Vercel["Vercel Global Edge Network (SPA Routing)"]
    end

    subgraph API ["Backend Layer (FastAPI Asynchronous Core)"]
        Router["API Gateway / Router (/api/v1)"]
        Auth["JWT Auth & Role-Based Access Control (RBAC)"]
        Security["OWASP Security Headers & Audit Logging"]
        Predictor["AI/ML Stress Predictive Engine (19 Signals)"]
        Alerts["Automated Alert Triage & Notification Engine"]
        Analytics["Battalion Risk Heatmaps & Tactical Metrics"]
    end

    subgraph Database ["Persistence Layer"]
        Supabase["Supabase Cloud PostgreSQL 17 (Pooler Connection)"]
        Tables["Personnel, Deployments, Duty, Leaves, Surveys, Alerts, Audit"]
    end

    UI_Personnel --> Vercel
    UI_Officer --> Vercel
    UI_Commander --> Vercel
    Vercel --> Router
    Router --> Auth
    Auth --> Security
    Security --> Predictor
    Security --> Alerts
    Security --> Analytics
    Predictor --> Database
    Alerts --> Database
    Analytics --> Database
    Database --> Supabase
```

---

## 🌟 Key Features & Capabilities

### 1. 🛡️ Multi-Tier Role-Based Access Control (RBAC)
* **Personnel / Jawan Role:** Access to personal wellness log, confidential mood surveys, shift workloads, leave balance, peer recovery resources, and self-help tools.
* **Medical / Welfare Officer Role:** Unit-wide roster triage, clinical screening scores, intervention tracking, medical follow-up scheduling, and confidential alerts.
* **Commander / Battalion Head Role:** High-level strategic heatmaps, high-stress outlier alerts, unit combat-readiness index, operational hardship distribution, and anonymized aggregate reports.

### 2. 🤖 AI-Powered Stress Prediction Engine
* **19 Tactical Signals Evaluated:** Analyzes continuous deployment hardship, night duties, rest gaps, leave denial frequency, physical strain indices, and psychological screening responses.
* **Dual Prediction Pipeline:**
  * **Machine Learning Model:** Random Forest / Gradient Boosting trained classifier for non-linear risk classification (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
  * **Deterministic Heuristic Engine:** Explainable fallback providing human-auditable risk scoring with detailed contributing factors.
* **Confidence & Anomaly Scoring:** Quantifies prediction confidence alongside risk level to assist decision-makers.

### 3. 🚨 Early Warning & Automated Triage
* **Dynamic Trigger Thresholds:** Automatically generates alerts when fatigue indicators cross safety thresholds (e.g., >14 continuous duty days or severe sleep disruption).
* **Intervention Lifecycle Tracking:** Alerts progress through `NEW` ➔ `ACKNOWLEDGED` ➔ `UNDER_REVIEW` ➔ `RESOLVED`.
* **Actionable Recommendations:** Suggests mandatory rest cycles, leave approvals, counselor referrals, or posting rotation adjustments.

### 4. 📊 Battalion Heatmaps & Tactical Analytics
* Visual risk distributions by unit, company, and theatre of operation.
* Correlation matrices linking duty hours to elevated stress indicators.
* Zero-latency client-side caching with smooth Recharts visualizations.

### 5. 🔒 Defense-Grade Security & Audit Compliance
* **Data Minimization & PII Redaction:** Aggregate commander dashboards display unit-level statistics without exposing private medical survey details.
* **Immutable Security Audit Trail:** Append-only database logs recording every login, record export, triage action, and role escalation.
* **OWASP Hardening:** HSTS (`max-age=31536000`), Content Security Policy (`CSP`), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

---

## 🗄️ Database Schema & Entities

| Table | Description | Key Attributes |
| :--- | :--- | :--- |
| `users` | System login credentials & role identities | `id`, `username`, `password_hash`, `role`, `is_active`, `last_login_at` |
| `personnel` | Uniformed force member profile & credentials | `service_number`, `name`, `rank`, `unit`, `role`, `status` |
| `deployments` | Operational field assignments & hardship postings | `location`, `deployment_type`, `hardship_index`, `start_date`, `end_date` |
| `duty_logs` | Shift work records & night patrol logs | `duty_date`, `duty_type`, `hours_worked`, `night_duty`, `consecutive_days` |
| `leave_records`| Annual, casual, and medical leave history | `leave_type`, `start_date`, `end_date`, `status`, `approval_date` |
| `wellness_surveys` | Clinical wellness self-assessments | `stress_score`, `sleep_quality`, `fatigue_score`, `wellbeing_score` |
| `alerts` | Automated risk warnings & triage events | `risk_level`, `trigger_source`, `status`, `assigned_officer`, `resolution_notes` |
| `audit_logs` | Forensic security and activity audit log | `user_id`, `action`, `resource_type`, `ip_address`, `timestamp` |

---

## 💻 Tech Stack

### Frontend
- **Framework:** React 19, TypeScript
- **Bundler & Build Tool:** Vite 8
- **Styling:** Modular CSS Design System with Dark/Light Glassmorphism Theme
- **Data Visualization:** Recharts, Lucide Icons
- **Routing:** React Router DOM v7 (SPA Rewrite Enabled)
- **Deployment Platform:** Vercel Global Edge Network

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ORM & Database Layer:** SQLAlchemy 2.0 (AsyncIO), Alembic Migrations
- **Database Engine:** PostgreSQL 17 (Supabase Cloud with Session Pooler)
- **Authentication:** PyJWT (HS256 tokens), bcrypt password hashing
- **Data Validation:** Pydantic v2 Settings & Schemas
- **Deployment Platform:** Render Cloud Platform

---

## 🚀 Live Demo Access & Test Credentials

You can test all 3 personas using pre-seeded test accounts:

| Role | Username | Password | Intended Dashboard |
| :--- | :--- | :--- | :--- |
| **Battalion Commander** | `commander_sharma` | `SahyogX@2026` | Strategic Unit Heatmap & Early Alerts |
| **Medical / Welfare Officer** | `officer_verma` | `SahyogX@2026` | Clinical Roster, Triage & Interventions |
| **Service Personnel** | `sepoy_kumar` | `SahyogX@2026` | Confidential Self-Check, Duty & Leave Log |

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 20+ & npm
- Python 3.11+
- PostgreSQL (Local or Supabase)

### 1. Clone the Repository
```bash
git clone https://github.com/aditya-mishra-007/SahyogX.git
cd SahyogX
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Update .env with your local PostgreSQL or Supabase DATABASE_URL

# Launch backend API server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` to explore the user portal.

---

## 🌐 Production Deployment Guide

### Backend (Render)
1. Link repository to Render Web Service.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `DATABASE_URL`: Supabase IPv4 Pooler connection string (`postgresql://postgres.[ref]:[pwd]@...pooler.supabase.com:5432/postgres`)
   - `JWT_SECRET_KEY`: Strong random secret key
   - `CORS_ORIGINS`: `*` or your Vercel frontend URL

### Frontend (Vercel)
1. Import repository into Vercel.
2. Framework Preset: **Vite**.
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://sahyog-x.onrender.com`
4. Deploy — static assets are distributed globally via CDN with SPA rewrite routing handled via `vercel.json`.

---

## 📜 License & Acknowledgements
Developed with pride for the **Smart India Hackathon (SIH)** to serve the personnel of our armed forces and security agencies.
All rights reserved © 2026 Team SahyogX.
