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
async def test_list_and_summarize_duty_logs(async_client: AsyncClient):
    """Verify duty listing and statistical workload aggregations."""
    headers = await get_auth_header(async_client, "commander", "commander123")

    # List duty logs
    list_resp = await async_client.get("/api/v1/duty?limit=10", headers=headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["total"] >= 750
    assert len(data["items"]) == 10

    # Get workload summary for first personnel
    p_id = data["items"][0]["personnel_id"]
    summary_resp = await async_client.get(
        f"/api/v1/duty/personnel/{p_id}/summary", headers=headers
    )
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["personnel_id"] == p_id
    assert summary["total_duty_records"] >= 30
    assert summary["total_hours_worked"] > 0
    assert summary["average_hours_per_duty"] > 0
    assert "average_workload_score" in summary


@pytest.mark.asyncio
async def test_duty_log_validation(async_client: AsyncClient):
    """Verify input validation constraints on duty shifts."""
    headers = await get_auth_header(async_client, "personnel", "personnel123")

    # Get valid personnel ID
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=headers)
    p_id = p_resp.json()["items"][0]["id"]

    # Test invalid hours worked (> 24.0)
    bad_payload = {
        "personnel_id": p_id,
        "duty_date": "2026-09-01",
        "duty_type": "SENTRY",
        "hours_worked": 28.0,  # Invalid: More than 24 hours in a day
        "night_duty": True,
        "consecutive_duty_days": 1,
        "workload_score": 5.0,
    }
    resp = await async_client.post("/api/v1/duty", json=bad_payload, headers=headers)
    assert resp.status_code == 422

    # Test valid duty entry
    good_payload = {
        "personnel_id": p_id,
        "duty_date": "2026-09-01",
        "duty_type": "COMBAT_PATROL",
        "hours_worked": 8.5,
        "night_duty": False,
        "consecutive_duty_days": 2,
        "workload_score": 6.0,
    }
    valid_resp = await async_client.post("/api/v1/duty", json=good_payload, headers=headers)
    assert valid_resp.status_code == 201
    assert valid_resp.json()["hours_worked"] == 8.5
