import pytest
from httpx import AsyncClient


async def get_auth_header(async_client: AsyncClient, username: str, password: str) -> dict:
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_security_headers_present(async_client: AsyncClient):
    """
    Verifies that OWASP security response headers are applied to HTTP responses.
    """
    resp = await async_client.get("/health")
    assert resp.status_code == 200

    headers = resp.headers
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert "Strict-Transport-Security" in headers
    assert "max-age=" in headers["Strict-Transport-Security"]
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert headers.get("X-Permitted-Cross-Domain-Policies") == "none"
    assert "Content-Security-Policy" in headers
    assert "default-src 'self'" in headers["Content-Security-Policy"]


@pytest.mark.asyncio
async def test_health_readiness_probe(async_client: AsyncClient):
    """
    Verifies the deep system readiness probe at /api/health/ready.
    Confirms PostgreSQL connection and ML engine active state.
    """
    resp = await async_client.get("/api/health/ready")
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "READY"
    assert data["database"] == "CONNECTED"
    assert data["ml_engine"]["status"] == "ACTIVE"
    assert "active_model" in data["ml_engine"]
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_login_audit_trail(async_client: AsyncClient):
    """
    Verifies that authentication attempts (both success and failure)
    are captured in the immutable audit log table.
    """
    # 1. Trigger failed login
    failed_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"username": "commander", "password": "wrong_password_test"},
    )
    assert failed_resp.status_code == 401

    # 2. Trigger successful login
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # 3. Query audit logs as commander
    audit_resp = await async_client.get("/api/v1/audit/logs?page_size=20", headers=cmd_headers)
    assert audit_resp.status_code == 200
    audit_data = audit_resp.json()

    actions = [item["action"] for item in audit_data["items"]]
    assert "LOGIN_FAILURE" in actions
    assert "LOGIN_SUCCESS" in actions


@pytest.mark.asyncio
async def test_audit_logs_commander_access(async_client: AsyncClient):
    """
    Verifies that a Commander can query and filter the audit log trail.
    """
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    resp = await async_client.get("/api/v1/audit/logs?page=1&page_size=10", headers=cmd_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "total" in data
    assert "items" in data
    assert "page" in data
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_audit_logs_personnel_forbidden(async_client: AsyncClient):
    """
    Verifies strict RBAC: Personnel role cannot access audit logs (HTTP 403).
    """
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    resp = await async_client.get("/api/v1/audit/logs", headers=prs_headers)
    assert resp.status_code == 403
    assert "Insufficient permissions" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_sanitization():
    """
    Verifies that sensitive credentials (passwords, tokens) are redacted in audit details.
    """
    from src.services.audit_service import _sanitize_details
    import json

    raw_payload = {
        "username": "test_soldier",
        "password": "super_secret_password_123",
        "access_token": "eyJhbGciOi...",
        "status": "ACTIVE",
    }

    sanitized_str = _sanitize_details(raw_payload)
    sanitized = json.loads(sanitized_str)

    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["access_token"] == "[REDACTED]"
    assert sanitized["username"] == "test_soldier"
    assert sanitized["status"] == "ACTIVE"
