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
async def test_list_and_filter_deployments(async_client: AsyncClient):
    """Verify listing and status filtering of deployments."""
    headers = await get_auth_header(async_client, "commander", "commander123")
    response = await async_client.get("/api/v1/deployments", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 25
    assert len(data["items"]) > 0

    # Filter by status
    filtered = await async_client.get(
        "/api/v1/deployments?status=ACTIVE", headers=headers
    )
    assert filtered.status_code == 200
    for dep in filtered.json()["items"]:
        assert dep["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_create_and_validate_deployment(async_client: AsyncClient):
    """Verify deployment creation, date validation, and updates."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Get valid personnel ID
    p_resp = await async_client.get("/api/v1/personnel?limit=1", headers=cmd_headers)
    p_id = p_resp.json()["items"][0]["id"]

    # Test invalid date validation (end_date < start_date)
    invalid_payload = {
        "personnel_id": p_id,
        "location": "Dras Sub-sector",
        "deployment_type": "HIGH_ALTITUDE",
        "start_date": "2026-05-10",
        "end_date": "2026-05-01",  # Before start date!
        "operational_intensity": "HIGH",
    }
    err_resp = await async_client.post(
        "/api/v1/deployments", json=invalid_payload, headers=cmd_headers
    )
    assert err_resp.status_code == 422

    # Test valid creation
    valid_payload = {
        "personnel_id": p_id,
        "location": "Kargil Forward Sector",
        "deployment_type": "HIGH_ALTITUDE",
        "start_date": "2026-01-15",
        "end_date": "2026-06-30",
        "operational_intensity": "HIGH",
        "status": "ACTIVE",
        "notes": "Synthetic high altitude outpost rotation",
    }
    create_resp = await async_client.post(
        "/api/v1/deployments", json=valid_payload, headers=cmd_headers
    )
    assert create_resp.status_code == 201
    dep_id = create_resp.json()["id"]

    # Test update
    patch_resp = await async_client.patch(
        f"/api/v1/deployments/{dep_id}",
        json={"status": "COMPLETED", "operational_intensity": "MODERATE"},
        headers=cmd_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "COMPLETED"
