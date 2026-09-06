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
async def test_unit_csv_export_authorized(async_client: AsyncClient):
    """
    Verifies that a Commander can export tactical unit data as an RFC 4180 CSV attachment.
    """
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    unit_name = "14 Corps Signals"
    resp = await async_client.get(
        f"/api/v1/export/unit/{unit_name}/csv",
        headers=cmd_headers,
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("Content-Type", "")
    assert "attachment" in resp.headers.get("Content-Disposition", "")
    assert "tactical_unit_" in resp.headers.get("Content-Disposition", "")

    csv_text = resp.text
    lines = csv_text.strip().split("\n")
    assert len(lines) >= 1
    # Check header
    header = lines[0]
    assert "Service Number" in header
    assert "Rank" in header
    assert "Unit" in header
    assert "Active Alerts" in header


@pytest.mark.asyncio
async def test_unit_json_export_authorized(async_client: AsyncClient):
    """
    Verifies that a Medical Officer can export structured tactical unit data as JSON.
    """
    med_headers = await get_auth_header(async_client, "medical", "medical123")

    unit_name = "14 Corps Signals"
    resp = await async_client.get(
        f"/api/v1/export/unit/{unit_name}/json",
        headers=med_headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "metadata" in data
    assert "records" in data

    meta = data["metadata"]
    assert meta["unit"] == unit_name
    assert meta["exported_by"] == "medical"
    assert meta["pii_redacted"] is True
    assert "export_timestamp" in meta
    assert isinstance(data["records"], list)


@pytest.mark.asyncio
async def test_alerts_csv_export_authorized(async_client: AsyncClient):
    """
    Verifies that an authorized officer can export early warning alerts as CSV.
    """
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    resp = await async_client.get("/api/v1/export/alerts/csv", headers=cmd_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("Content-Type", "")
    assert "attachment" in resp.headers.get("Content-Disposition", "")
    assert "alerts_export_" in resp.headers.get("Content-Disposition", "")

    csv_text = resp.text
    assert "Alert ID" in csv_text
    assert "Trigger Type" in csv_text
    assert "Severity" in csv_text


@pytest.mark.asyncio
async def test_export_personnel_forbidden(async_client: AsyncClient):
    """
    Verifies strict RBAC: Individual Personnel cannot export unit or alerts data (HTTP 403).
    """
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")

    unit_name = "14 Corps Signals"

    # 1. Unit CSV
    resp1 = await async_client.get(f"/api/v1/export/unit/{unit_name}/csv", headers=prs_headers)
    assert resp1.status_code == 403

    # 2. Unit JSON
    resp2 = await async_client.get(f"/api/v1/export/unit/{unit_name}/json", headers=prs_headers)
    assert resp2.status_code == 403

    # 3. Alerts CSV
    resp3 = await async_client.get("/api/v1/export/alerts/csv", headers=prs_headers)
    assert resp3.status_code == 403


@pytest.mark.asyncio
async def test_export_audit_trail_recorded(async_client: AsyncClient):
    """
    Verifies that every export execution records an immutable audit log entry.
    """
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Perform CSV Export
    await async_client.get("/api/v1/export/unit/14%20Corps%20Signals/csv", headers=cmd_headers)

    # Check Audit Logs
    audit_resp = await async_client.get(
        "/api/v1/audit/logs?action=DATA_EXPORT_CSV&page_size=10",
        headers=cmd_headers,
    )
    assert audit_resp.status_code == 200
    items = audit_resp.json()["items"]
    assert len(items) >= 1
    assert any(i["action"] == "DATA_EXPORT_CSV" for i in items)
