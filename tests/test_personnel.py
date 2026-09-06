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
async def test_list_personnel(async_client: AsyncClient):
    """Verify paginated listing of personnel for authenticated user."""
    headers = await get_auth_header(async_client, "commander", "commander123")
    response = await async_client.get("/api/v1/personnel", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 25
    assert len(data["items"]) > 0
    assert "service_number" in data["items"][0]


@pytest.mark.asyncio
async def test_filter_personnel_by_unit(async_client: AsyncClient):
    """Verify filtering personnel by unit name."""
    headers = await get_auth_header(async_client, "medical", "medical123")
    response = await async_client.get(
        "/api/v1/personnel?unit=Rajputana", headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert "Rajputana" in item["unit"]


@pytest.mark.asyncio
async def test_get_personnel_by_id(async_client: AsyncClient):
    """Verify retrieval of specific personnel profile."""
    headers = await get_auth_header(async_client, "personnel", "personnel123")
    # Fetch first record to get valid ID
    list_resp = await async_client.get("/api/v1/personnel?limit=1", headers=headers)
    p_id = list_resp.json()["items"][0]["id"]

    get_resp = await async_client.get(f"/api/v1/personnel/{p_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == p_id


@pytest.mark.asyncio
async def test_create_and_update_personnel(async_client: AsyncClient):
    """Verify registration and modification of personnel by COMMANDER."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    import uuid
    unique_svc = f"SX-T{uuid.uuid4().hex[:6].upper()}"

    payload = {
        "service_number": unique_svc,
        "name": "Captain Vikram Batra (Demo)",
        "rank": "Captain",
        "role": "Infantry",
        "unit": "13 Jammu and Kashmir Rifles",
        "joining_date": "2019-06-01",
        "status": "ACTIVE",
        "contact_email": "vikram.batra@defence.synthetic",
        "emergency_contact": "Family Contact",
    }
    create_resp = await async_client.post(
        "/api/v1/personnel", json=payload, headers=cmd_headers
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    p_id = created["id"]
    assert created["service_number"] == unique_svc

    # Test duplicate service number rejection
    dup_resp = await async_client.post(
        "/api/v1/personnel", json=payload, headers=cmd_headers
    )
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]

    # Test update
    update_resp = await async_client.patch(
        f"/api/v1/personnel/{p_id}",
        json={"rank": "Major", "status": "DEPLOYED"},
        headers=cmd_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["rank"] == "Major"
    assert update_resp.json()["status"] == "DEPLOYED"

    # Test deactivation
    del_resp = await async_client.delete(f"/api/v1/personnel/{p_id}", headers=cmd_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "INACTIVE"


@pytest.mark.asyncio
async def test_create_personnel_forbidden_for_non_commander(async_client: AsyncClient):
    """Verify that PERSONNEL role cannot register new personnel (RBAC 403)."""
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")
    import uuid
    payload = {
        "service_number": f"SX-F{uuid.uuid4().hex[:6].upper()}",
        "name": "Unauthorized Entry",
        "rank": "Sepoy",
        "role": "Infantry",
        "unit": "14 Rajputana Rifles",
        "joining_date": "2021-01-01",
    }
    response = await async_client.post(
        "/api/v1/personnel", json=payload, headers=prs_headers
    )
    assert response.status_code == 403
