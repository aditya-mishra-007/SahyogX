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
async def test_list_and_apply_leave(async_client: AsyncClient):
    """Verify leave application submission and duration calculation."""
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    # Get valid personnel ID using commander token (list endpoint requires COMMANDER/MEDICAL_OFFICER)
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    assert p_resp.status_code == 200, f"Commander personnel list failed: {p_resp.text}"
    p_id = p_resp.json()["items"][0]["id"]

    # Test auto-calculation of duration (start: 2026-10-01 to end: 2026-10-10 = 10 days inclusive)
    payload = {
        "personnel_id": p_id,
        "leave_type": "CASUAL",
        "start_date": "2026-10-01",
        "end_date": "2026-10-10",
        "reason": "Synthetic festival family visit",
    }
    create_resp = await async_client.post(
        "/api/v1/leaves", json=payload, headers=prs_headers
    )
    assert create_resp.status_code == 201
    leave_data = create_resp.json()
    assert leave_data["duration_days"] == 10
    assert leave_data["status"] == "PENDING"
    leave_id = leave_data["id"]

    # Test Commander / Medical Officer approval
    approval_resp = await async_client.patch(
        f"/api/v1/leaves/{leave_id}",
        json={"status": "APPROVED"},
        headers=cmd_headers,
    )
    assert approval_resp.status_code == 200
    assert approval_resp.json()["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_leave_approval_forbidden_for_personnel(async_client: AsyncClient):
    """Verify that regular PERSONNEL cannot approve or reject leaves (RBAC 403)."""
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    # Fetch any existing leave
    leaves_resp = await async_client.get("/api/v1/leaves?limit=1", headers=prs_headers)
    leave_id = leaves_resp.json()["items"][0]["id"]

    # Attempt to self-approve
    patch_resp = await async_client.patch(
        f"/api/v1/leaves/{leave_id}",
        json={"status": "APPROVED"},
        headers=prs_headers,
    )
    assert patch_resp.status_code == 403
