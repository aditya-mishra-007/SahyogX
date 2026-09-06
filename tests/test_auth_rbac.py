import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    """Verify successful authentication with valid credentials."""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"username": "commander", "password": "commander123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


@pytest.mark.asyncio
async def test_login_form_data(async_client: AsyncClient):
    """Verify OAuth2 form-data authentication (used by Swagger UI Authorize)."""
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "medical", "password": "medical123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient):
    """Verify that incorrect password returns HTTP 401."""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"username": "commander", "password": "wrong_password"},
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert "Incorrect username or password" in data["detail"]


@pytest.mark.asyncio
async def test_login_unknown_user(async_client: AsyncClient):
    """Verify that non-existent username returns HTTP 401."""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"username": "unknown_soldier", "password": "password123"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_auth_me_success(async_client: AsyncClient):
    """Verify that a valid JWT token grants access to /api/v1/auth/me."""
    # Step 1: Login
    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"username": "commander", "password": "commander123"},
    )
    token = login_resp.json()["access_token"]

    # Step 2: Access profile with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["username"] == "commander"
    assert user_data["role"] == "COMMANDER"
    assert "password" not in user_data
    assert "password_hash" not in user_data


@pytest.mark.asyncio
async def test_auth_me_missing_token(async_client: AsyncClient):
    """Verify that omitting Authorization header returns HTTP 401."""
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_invalid_token(async_client: AsyncClient):
    """Verify that providing an invalid/forged JWT returns HTTP 401."""
    headers = {"Authorization": "Bearer invalid.token.signature"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401


# ==============================================================================
# RBAC Tests (Commander, Medical Officer, Personnel)
# ==============================================================================

async def get_token_for(async_client: AsyncClient, username: str, password: str) -> str:
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_commander_access_controls(async_client: AsyncClient):
    """
    Verify COMMANDER role:
    - CAN access /api/v1/test/commander
    - CANNOT access /api/v1/test/medical (HTTP 403)
    - CANNOT access /api/v1/test/personnel (HTTP 403)
    """
    token = await get_token_for(async_client, "commander", "commander123")
    headers = {"Authorization": f"Bearer {token}"}

    # Allowed
    cmd_resp = await async_client.get("/api/v1/test/commander", headers=headers)
    assert cmd_resp.status_code == 200
    assert "Commander authorized" in cmd_resp.json()["message"]

    # Forbidden
    med_resp = await async_client.get("/api/v1/test/medical", headers=headers)
    assert med_resp.status_code == 403
    assert "Insufficient permissions" in med_resp.json()["detail"]

    prs_resp = await async_client.get("/api/v1/test/personnel", headers=headers)
    assert prs_resp.status_code == 403
    assert "Insufficient permissions" in prs_resp.json()["detail"]


@pytest.mark.asyncio
async def test_medical_officer_access_controls(async_client: AsyncClient):
    """
    Verify MEDICAL_OFFICER role:
    - CAN access /api/v1/test/medical
    - CANNOT access /api/v1/test/commander (HTTP 403)
    - CANNOT access /api/v1/test/personnel (HTTP 403)
    """
    token = await get_token_for(async_client, "medical", "medical123")
    headers = {"Authorization": f"Bearer {token}"}

    # Allowed
    med_resp = await async_client.get("/api/v1/test/medical", headers=headers)
    assert med_resp.status_code == 200
    assert "Medical Officer authorized" in med_resp.json()["message"]

    # Forbidden
    cmd_resp = await async_client.get("/api/v1/test/commander", headers=headers)
    assert cmd_resp.status_code == 403
    assert "Insufficient permissions" in cmd_resp.json()["detail"]

    prs_resp = await async_client.get("/api/v1/test/personnel", headers=headers)
    assert prs_resp.status_code == 403


@pytest.mark.asyncio
async def test_personnel_access_controls(async_client: AsyncClient):
    """
    Verify PERSONNEL role:
    - CAN access /api/v1/test/personnel
    - CANNOT access /api/v1/test/commander (HTTP 403)
    - CANNOT access /api/v1/test/medical (HTTP 403)
    """
    token = await get_token_for(async_client, "personnel", "personnel123")
    headers = {"Authorization": f"Bearer {token}"}

    # Allowed
    prs_resp = await async_client.get("/api/v1/test/personnel", headers=headers)
    assert prs_resp.status_code == 200
    assert "Personnel authorized" in prs_resp.json()["message"]

    # Forbidden
    cmd_resp = await async_client.get("/api/v1/test/commander", headers=headers)
    assert cmd_resp.status_code == 403

    med_resp = await async_client.get("/api/v1/test/medical", headers=headers)
    assert med_resp.status_code == 403
