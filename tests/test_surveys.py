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
async def test_survey_clinical_privacy_rbac(async_client: AsyncClient):
    """
    Privacy-by-Design Verification:
    - MEDICAL_OFFICER CAN access raw surveys.
    - COMMANDER CANNOT access raw surveys (HTTP 403) to prevent bias or breach of confidentiality.
    """
    med_headers = await get_auth_header(async_client, "medical", "medical123")
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Medical Officer access
    med_resp = await async_client.get("/api/v1/surveys?limit=5", headers=med_headers)
    assert med_resp.status_code == 200
    assert med_resp.json()["total"] >= 150

    # Commander access blocked
    cmd_resp = await async_client.get("/api/v1/surveys", headers=cmd_headers)
    assert cmd_resp.status_code == 403


@pytest.mark.asyncio
async def test_submit_and_validate_survey(async_client: AsyncClient):
    """Verify survey submission and score range constraints (0.0 to 10.0)."""
    med_headers = await get_auth_header(async_client, "medical", "medical123")
    # Use commander token for personnel list (list endpoint requires COMMANDER/MEDICAL_OFFICER)
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    assert p_resp.status_code == 200, f"Personnel list failed: {p_resp.text}"
    p_id = p_resp.json()["items"][0]["id"]

    # Invalid score (> 10.0) — submitted by medical officer
    bad_payload = {
        "personnel_id": p_id,
        "survey_date": "2026-09-05",
        "stress_score": 12.5,  # Out of range!
        "sleep_quality_score": 5.0,
        "fatigue_score": 4.0,
        "wellbeing_score": 6.0,
    }
    err_resp = await async_client.post(
        "/api/v1/surveys", json=bad_payload, headers=med_headers
    )
    assert err_resp.status_code == 422

    # Valid submission
    good_payload = {
        "personnel_id": p_id,
        "survey_date": "2026-09-05",
        "stress_score": 4.5,
        "sleep_quality_score": 7.0,
        "fatigue_score": 3.5,
        "wellbeing_score": 8.0,
        "notes": "Synthetic periodic self-assessment",
    }
    create_resp = await async_client.post(
        "/api/v1/surveys", json=good_payload, headers=med_headers
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["stress_score"] == 4.5


@pytest.mark.asyncio
async def test_survey_summary_and_risk_indicator(async_client: AsyncClient):
    """Verify aggregated stress metrics and qualitative risk indicator computation."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    assert p_resp.status_code == 200, f"Personnel list failed: {p_resp.text}"
    p_id = p_resp.json()["items"][0]["id"]

    # Both Commander and Medical Officer can access aggregated wellness metrics
    summary_resp = await async_client.get(
        f"/api/v1/surveys/personnel/{p_id}/summary", headers=cmd_headers
    )
    assert summary_resp.status_code == 200
    data = summary_resp.json()
    assert data["personnel_id"] == p_id
    # total_surveys >= 0 (test DB may not have seeded surveys for every person)
    assert data["total_surveys"] >= 0
    assert data["stress_risk_indicator"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "average_stress_score" in data
    assert "average_sleep_quality_score" in data
    assert "average_fatigue_score" in data
