"""
Cross-Role Attack Prevention Test Suite for SahyogX.

Verifies that PERSONNEL tokens cannot access command-level endpoints,
MEDICAL_OFFICER tokens cannot access commander-only endpoints,
and unauthenticated requests are rejected with 401.

These tests form the RBAC enforcement matrix:

                       PERSONNEL   MED_OFFICER   COMMANDER
/api/v1/personnel        403         200           200
/api/v1/analytics/*      403         200           200
/api/v1/alerts           403         200           200
/api/v1/predictions/unit 403         200           200
/api/v1/audit/logs       403         403           200
/api/v1/export/*         403         403           200
"""

import pytest
from httpx import AsyncClient


# ============================================================================
# Helper
# ============================================================================

async def get_token(client: AsyncClient, username: str, password: str) -> str:
    """Authenticate and return a JWT token for the given credentials."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert res.status_code == 200, f"Login failed for '{username}': {res.text}"
    return res.json()["access_token"]


async def get_personnel_token(client: AsyncClient) -> str:
    return await get_token(client, "personnel", "personnel123")


async def get_officer_token(client: AsyncClient) -> str:
    return await get_token(client, "medical", "medical123")


async def get_commander_token(client: AsyncClient) -> str:
    return await get_token(client, "commander", "commander123")


# ============================================================================
# 1. Unauthenticated Requests — Must Return 401
# ============================================================================

@pytest.mark.asyncio
async def test_unauthenticated_returns_401_on_protected_endpoints(async_client: AsyncClient):
    """All protected endpoints must reject unauthenticated requests with 401."""
    endpoints = [
        ("GET", "/api/v1/personnel"),
        ("GET", "/api/v1/analytics/heatmap"),
        ("GET", "/api/v1/analytics/theatres"),
        ("GET", "/api/v1/alerts"),
        ("GET", "/api/v1/predictions/model-status"),
        ("GET", "/api/v1/audit/logs"),
    ]
    for method, path in endpoints:
        resp = await async_client.request(method, path)
        assert resp.status_code == 401, (
            f"Expected 401 for unauthenticated {method} {path}, got {resp.status_code}"
        )


# ============================================================================
# 2. PERSONNEL Role — Command Endpoints Must Return 403
# ============================================================================

@pytest.mark.asyncio
async def test_personnel_cannot_list_all_personnel(async_client: AsyncClient):
    """PERSONNEL must NOT be able to enumerate all personnel records (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/personnel", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
    assert "Insufficient permissions" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_personnel_cannot_access_analytics_heatmap(async_client: AsyncClient):
    """PERSONNEL must NOT be able to access the unit stress heatmap (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/analytics/heatmap", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    assert "Insufficient permissions" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_personnel_cannot_access_theatre_analytics(async_client: AsyncClient):
    """PERSONNEL must NOT be able to access operational theatre analytics (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/analytics/theatres", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


@pytest.mark.asyncio
async def test_personnel_cannot_access_alerts(async_client: AsyncClient):
    """PERSONNEL must NOT be able to access the welfare alerts list (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/alerts", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    assert "Insufficient permissions" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_personnel_cannot_trigger_alert_scan(async_client: AsyncClient):
    """PERSONNEL must NOT be able to trigger the EWS alert scan (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.post("/api/v1/alerts/scan", json={}, headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


@pytest.mark.asyncio
async def test_personnel_cannot_access_unit_prediction(async_client: AsyncClient):
    """PERSONNEL must NOT be able to access unit-wide stress predictions (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/predictions/unit/Alpha%20Company", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


@pytest.mark.asyncio
async def test_personnel_cannot_access_audit_logs(async_client: AsyncClient):
    """PERSONNEL must NOT be able to read the security audit trail (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/audit/logs", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


@pytest.mark.asyncio
async def test_personnel_cannot_access_data_export(async_client: AsyncClient):
    """PERSONNEL must NOT be able to export sensitive unit data (403)."""
    token = await get_personnel_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/export/unit/Alpha%20Company/csv", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


# ============================================================================
# 3. MEDICAL_OFFICER Role — Commander-Only Endpoints Must Return 403
# ============================================================================

@pytest.mark.asyncio
async def test_officer_can_access_analytics_heatmap(async_client: AsyncClient):
    """MEDICAL_OFFICER CAN access the analytics heatmap (200)."""
    token = await get_officer_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/analytics/heatmap", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"


@pytest.mark.asyncio
async def test_officer_can_access_personnel_list(async_client: AsyncClient):
    """MEDICAL_OFFICER CAN list personnel (200)."""
    token = await get_officer_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/personnel", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"


@pytest.mark.asyncio
async def test_officer_cannot_access_audit_logs(async_client: AsyncClient):
    """MEDICAL_OFFICER must NOT be able to read the security audit trail (403)."""
    token = await get_officer_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/audit/logs", headers=headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    assert "Insufficient permissions" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_officer_can_access_data_export(async_client: AsyncClient):
    """MEDICAL_OFFICER CAN export unit data (200) — export is granted to COMMANDER + MEDICAL_OFFICER."""
    token = await get_officer_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    # Note: export may return empty CSV if no data in test DB, but should not 403
    resp = await async_client.get("/api/v1/export/unit/Alpha%20Company/csv", headers=headers)
    # Accept 200 (with data) or 404 (unit not found) — both are authorized responses
    assert resp.status_code in (200, 404), (
        f"Expected 200 or 404 for MEDICAL_OFFICER export access, got {resp.status_code}: {resp.text}"
    )


# ============================================================================
# 4. COMMANDER Role — Full Access Verification
# ============================================================================

@pytest.mark.asyncio
async def test_commander_can_access_audit_logs(async_client: AsyncClient):
    """COMMANDER CAN access the full security audit trail (200)."""
    token = await get_commander_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/audit/logs", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_commander_can_access_analytics_heatmap(async_client: AsyncClient):
    """COMMANDER CAN access the force-wide analytics heatmap (200)."""
    token = await get_commander_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/analytics/heatmap", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"


@pytest.mark.asyncio
async def test_commander_can_access_personnel_list(async_client: AsyncClient):
    """COMMANDER CAN list all personnel (200)."""
    token = await get_commander_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/api/v1/personnel", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "items" in data


# ============================================================================
# 5. Invalid / Tampered Token Tests
# ============================================================================

@pytest.mark.asyncio
async def test_forged_commander_token_rejected(async_client: AsyncClient):
    """A manually crafted token claiming COMMANDER role must be rejected (401)."""
    # This is a completely forged JWT — not signed with the real secret key
    forged_token = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
        "eyJzdWIiOiJmb3JnZWQiLCJyb2xlIjoiQ09NTUFOREVSISJ9."
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    )
    headers = {"Authorization": f"Bearer {forged_token}"}
    resp = await async_client.get("/api/v1/audit/logs", headers=headers)
    assert resp.status_code == 401, f"Expected 401 for forged token, got {resp.status_code}"


@pytest.mark.asyncio
async def test_expired_token_placeholder_rejected(async_client: AsyncClient):
    """An obviously invalid token must be rejected (401)."""
    headers = {"Authorization": "Bearer clearly.not.valid"}
    resp = await async_client.get("/api/v1/personnel", headers=headers)
    assert resp.status_code == 401, f"Expected 401 for invalid token, got {resp.status_code}"
