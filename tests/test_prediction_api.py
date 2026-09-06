import pytest
from httpx import AsyncClient


async def get_auth_header(async_client: AsyncClient, username: str, password: str) -> dict:
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_commander_can_predict_personnel_stress(async_client: AsyncClient):
    """Verifies that COMMANDER can evaluate predictive stress risk for any personnel."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Fetch a real seeded personnel ID
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    assert p_resp.status_code == 200
    personnel_id = p_resp.json()["items"][0]["id"]

    # Request prediction
    resp = await async_client.get(
        f"/api/v1/predictions/personnel/{personnel_id}", headers=cmd_headers
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["personnel_id"] == personnel_id
    assert 0.0 <= data["risk_score"] <= 1.0
    assert data["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert data["prediction_source"] in ["ML_MODEL", "HEURISTIC_BASELINE"]
    assert "features_summary" in data
    assert isinstance(data["primary_risk_factors"], list)
    assert "confidence_score" in data


@pytest.mark.asyncio
async def test_medical_officer_can_predict_personnel_stress(async_client: AsyncClient):
    """Verifies that MEDICAL_OFFICER can evaluate predictive stress risk."""
    med_headers = await get_auth_header(async_client, "medical", "medical123")

    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=med_headers)
    assert p_resp.status_code == 200
    personnel_id = p_resp.json()["items"][0]["id"]

    resp = await async_client.get(
        f"/api/v1/predictions/personnel/{personnel_id}", headers=med_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["personnel_id"] == personnel_id
    assert 0.0 <= data["risk_score"] <= 1.0


@pytest.mark.asyncio
async def test_personnel_self_access_rbac(async_client: AsyncClient):
    """
    Verifies that PERSONNEL can access their own prediction,
    but gets HTTP 403 Forbidden when attempting to view another soldier's risk score.
    """
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    # The dev user 'personnel' represents Hav. K. Singh (ID 3 in seeded db)
    own_resp = await async_client.get("/api/v1/predictions/personnel/3", headers=prs_headers)
    assert own_resp.status_code == 200
    assert own_resp.json()["personnel_id"] == 3

    # Attempting to access soldier with ID 1 must be blocked
    other_resp = await async_client.get("/api/v1/predictions/personnel/1", headers=prs_headers)
    assert other_resp.status_code == 403
    assert "restricted" in other_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_unit_stress_risk_summary(async_client: AsyncClient):
    """Verifies unit stress risk evaluation and role restrictions."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    # Fetch a seeded personnel's unit
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    assert p_resp.status_code == 200
    unit_name = p_resp.json()["items"][0]["unit"]

    # Commander evaluates unit
    resp = await async_client.get(f"/api/v1/predictions/unit/{unit_name}", headers=cmd_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["unit"] == unit_name
    assert data["total_evaluated"] >= 1
    assert 0.0 <= data["unit_average_risk_score"] <= 1.0
    assert (
        data["low_risk_count"]
        + data["moderate_risk_count"]
        + data["high_risk_count"]
        + data["critical_risk_count"]
    ) == data["total_evaluated"]

    # Personnel is forbidden from viewing battalion aggregate
    prs_unit_resp = await async_client.get(f"/api/v1/predictions/unit/{unit_name}", headers=prs_headers)
    assert prs_unit_resp.status_code == 403


@pytest.mark.asyncio
async def test_model_status_endpoint(async_client: AsyncClient):
    """Verifies that model status telemetry is available to authenticated users."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    resp = await async_client.get("/api/v1/predictions/model-status", headers=cmd_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["ml_artifact_available"] is False  # origin/ml has no model file
    assert data["fallback_enabled"] is True
    assert "heuristic" in data["active_model_name"].lower()
    assert data["supported_features_count"] == 19
    assert "heuristic fallback" in data["status_message"].lower()


@pytest.mark.asyncio
async def test_nonexistent_personnel_returns_404(async_client: AsyncClient):
    """Verifies HTTP 404 when querying an invalid personnel ID."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")
    resp = await async_client.get("/api/v1/predictions/personnel/99999", headers=cmd_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401(async_client: AsyncClient):
    """Verifies HTTP 401 when no token is supplied."""
    resp = await async_client.get("/api/v1/predictions/personnel/1")
    assert resp.status_code == 401
