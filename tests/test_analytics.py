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
async def test_force_stress_heatmap(async_client: AsyncClient):
    """Verifies force-wide multi-unit stress risk heatmap aggregation."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    resp = await async_client.get("/api/v1/analytics/heatmap", headers=cmd_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "units" in data
    assert len(data["units"]) >= 1
    assert data["force_total_personnel"] >= 1
    assert 0.0 <= data["force_average_risk_score"] <= 1.0

    unit_item = data["units"][0]
    assert "unit" in unit_item
    assert unit_item["total_personnel"] >= 1
    assert 0.0 <= unit_item["average_risk_score"] <= 1.0
    assert unit_item["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "risk_breakdown" in unit_item
    assert "high_risk_percentage" in unit_item


@pytest.mark.asyncio
async def test_operational_theatres_analytics(async_client: AsyncClient):
    """Verifies operational deployment analytics grouped by theatre and terrain."""
    med_headers = await get_auth_header(async_client, "medical", "medical123")

    resp = await async_client.get("/api/v1/analytics/theatres", headers=med_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "theatres" in data
    assert data["total_active_deployments"] >= 1
    assert len(data["theatres"]) >= 1

    first_theatre = data["theatres"][0]
    assert "theatre" in first_theatre
    assert "deployment_type" in first_theatre
    assert first_theatre["active_deployments"] >= 1
    assert 0.0 <= first_theatre["average_stress_score"] <= 1.0
    assert "hardship_level" in first_theatre


@pytest.mark.asyncio
async def test_unit_welfare_summary_deep_dive(async_client: AsyncClient):
    """Verifies deep-dive welfare analytics for a single battalion and 404 on invalid unit."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Fetch a real unit from personnel directory
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    assert p_resp.status_code == 200
    real_unit = p_resp.json()["items"][0]["unit"]

    resp = await async_client.get(f"/api/v1/analytics/unit/{real_unit}/summary", headers=cmd_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["unit"] == real_unit
    assert data["total_strength"] >= 1
    assert 0.0 <= data["average_risk_score"] <= 1.0
    assert data["average_duty_hours_past_30d"] >= 0.0
    assert data["leave_deprivation_rate"] >= 0.0
    assert "risk_breakdown" in data

    # Nonexistent unit
    bad_resp = await async_client.get("/api/v1/analytics/unit/NonexistentBattalion999/summary", headers=cmd_headers)
    assert bad_resp.status_code == 404


@pytest.mark.asyncio
async def test_analytics_rbac_boundaries(async_client: AsyncClient):
    """
    Verifies RBAC protection:
    - Commander and Medical Officer have full access to heatmap and theatre analytics.
    - Personnel role is blocked (HTTP 403) from operational unit analytics.
    - Unauthenticated requests return HTTP 401.
    """
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    # Personnel blocked from heatmap
    heat_resp = await async_client.get("/api/v1/analytics/heatmap", headers=prs_headers)
    assert heat_resp.status_code == 403

    # Personnel blocked from theatres
    theatre_resp = await async_client.get("/api/v1/analytics/theatres", headers=prs_headers)
    assert theatre_resp.status_code == 403

    # Personnel blocked from unit summary
    summary_resp = await async_client.get("/api/v1/analytics/unit/14%20Rajputana%20Rifles/summary", headers=prs_headers)
    assert summary_resp.status_code == 403

    # Unauthenticated
    unauth = await async_client.get("/api/v1/analytics/heatmap")
    assert unauth.status_code == 401
