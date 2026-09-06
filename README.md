# SahyogX — Backend Service

> **SIH Problem Statement:** AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces  
> **Repository Branch:** `backend`  
> **Phase Completed:** **Phase 1 — Foundation & Infrastructure Setup**

---

## 1. Overview

**SahyogX Backend** is an asynchronous, high-throughput REST API engineered with **FastAPI**, **SQLAlchemy 2.0 (Async)**, and **PostgreSQL 17**. It acts as the secure core for monitoring personnel welfare, operational workload, deployment rotations, and predictive stress evaluation across uniformed forces.

---

## 2. Phase 1 Architecture & Highlights

* **FastAPI Application Skeleton:** Lifespan manager, modular API router, and centralized exception handling.
* **CORS Support:** Configured for development frontend origins (`http://localhost:3000`, `http://localhost:5173`) via environment settings.
* **PostgreSQL 17 Async Connection:** Modern async engine with connection pooling (`pool_pre_ping=True`), `async_sessionmaker`, and non-crashing health checks.
* **Database Migrations:** Alembic initialized and configured with async support (`asyncpg`) and `src.models.base.Base` metadata.
* **JWT Authentication & RBAC:**
  * Password hashing with **bcrypt**.
  * Signed JWT access tokens with claims: `sub`, `role`, `iat`, `exp`.
  * Uniformed forces roles: **`COMMANDER`**, **`MEDICAL_OFFICER`**, **`PERSONNEL`**.
  * Reusable dependency injectors: `get_current_user`, `require_role`, `require_commander`, `require_medical_officer`, `require_personnel`.
* **Interactive OpenAPI Documentation:** Fully functional Swagger UI at `/docs` with integrated OAuth2 Bearer Authorization.

---

## 3. Directory Layout

```text
src/
├── __init__.py
├── main.py                       # FastAPI application factory, CORS, and root routes
├── core/
│   ├── __init__.py
│   ├── config.py                 # Pydantic BaseSettings loaded from .env
│   ├── database.py               # Async engine, sessionmaker & get_db dependency
│   ├── logging.py                # Centralized logging configuration
│   └── security.py               # bcrypt password hashing & JWT encode/decode
├── api/
│   ├── __init__.py
│   ├── deps.py                   # Authentication & RBAC dependencies
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py             # Operational & PostgreSQL liveliness checks
│   │   ├── auth.py               # POST /api/v1/auth/login & GET /api/v1/auth/me
│   │   └── test_rbac.py          # Phase 1 verification routes for each role
│   └── v1/
│       ├── __init__.py
│       └── router.py             # Aggregator for /api/v1 endpoints
├── models/
│   ├── __init__.py
│   └── base.py                   # SQLAlchemy DeclarativeBase & TimestampMixin
├── schemas/
│   ├── __init__.py
│   ├── auth.py                   # Token, TokenPayload, LoginRequest DTOs
│   └── user.py                   # UserRole enum, UserResponse schema
└── services/
    ├── __init__.py
    └── auth_service.py           # Phase 1 dev user registry & auth logic
alembic/                          # Database migration scripts
tests/                            # Automated Pytest suite (14 tests)
.env.example                      # Configuration template
requirements.txt                  # Production dependencies
```

---

## 4. Getting Started Locally

### Prerequisites
* **Python 3.13+**
* **PostgreSQL 17** running locally on port 5432
* Virtual environment (`.venv`) activated

### Step 1: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Copy the template to `.env`:
```powershell
Copy-Item .env.example .env
```

Open `.env` and set your PostgreSQL credentials:
```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
POSTGRES_DB=sahyogx
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/sahyogx
```

### Step 3: Create PostgreSQL Database (if not existing)
Run this SQL command in PostgreSQL (`psql` or pgAdmin):
```sql
CREATE DATABASE sahyogx;
```

---

## 5. Running the Backend Server

Start the development server with live reload:
```powershell
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

* **Interactive Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Root Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
* **Detailed Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 6. Phase 1 Development Credentials (for Testing & Swagger)

| Username | Password | Role | Military Rank / Display Name |
| :--- | :--- | :--- | :--- |
| `commander` | `commander123` | `COMMANDER` | Col. R. Sharma (Commanding Officer) |
| `medical` | `medical123` | `MEDICAL_OFFICER` | Maj. Dr. A. Verma (RMO) |
| `personnel` | `personnel123` | `PERSONNEL` | Hav. K. Singh |

### Testing via Swagger UI:
1. Open [http://localhost:8000/docs](http://localhost:8000/docs)
2. Click the **Authorize** button (top right)
3. Enter `commander` and `commander123` (or use any account above)
4. Execute `GET /api/v1/auth/me` or `GET /api/v1/test/commander`

---

## 7. Running Automated Tests

Run the complete test suite:
```powershell
pytest
```
*All 14 tests validate health checks, login, token generation, profile access, and strict RBAC boundaries.*
