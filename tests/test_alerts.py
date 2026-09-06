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
async def test_scan_and_generate_alerts_with_deduplication(async_client: AsyncClient):
    """
    Verifies automated threshold scanning:
    1. First scan detects at-risk personnel and creates alerts.
    2. Immediate subsequent scan skips soldiers who already have an active alert.
    """
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Initial scan
    scan_resp = await async_client.post(
        "/api/v1/alerts/scan",
        json={"min_risk_threshold": 0.55},
        headers=cmd_headers,
    )
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()
    assert scan_data["total_scanned"] >= 1
    initial_created = scan_data["alerts_created"]

    # Immediate second scan must deduplicate and skip active alerts
    second_scan = await async_client.post(
        "/api/v1/alerts/scan",
        json={"min_risk_threshold": 0.55},
        headers=cmd_headers,
    )
    assert second_scan.status_code == 200
    second_data = second_scan.json()
    assert second_data["alerts_created"] == 0
    assert second_data["existing_active_skipped"] >= initial_created


@pytest.mark.asyncio
async def test_list_and_filter_alerts(async_client: AsyncClient):
    """Verifies alert listing and filtering by status and severity."""
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # List all
    resp = await async_client.get("/api/v1/alerts?limit=10", headers=cmd_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1

    first_alert = data["items"][0]
    assert "personnel_id" in first_alert
    assert "risk_score" in first_alert
    assert "severity" in first_alert
    assert "status" in first_alert

    # Filter by status
    filtered_resp = await async_client.get("/api/v1/alerts?status=NEW", headers=cmd_headers)
    assert filtered_resp.status_code == 200
    for item in filtered_resp.json()["items"]:
        assert item["status"] == "NEW"


@pytest.mark.asyncio
async def test_alert_lifecycle_and_resolution(async_client: AsyncClient):
    """
    Verifies state transitions:
    NEW -> ACKNOWLEDGED -> RESOLVED, with resolution audit trail and rejection of invalid transitions.
    """
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Get a NEW alert
    list_resp = await async_client.get("/api/v1/alerts?status=NEW&limit=1", headers=cmd_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) > 0
    alert_id = items[0]["id"]

    # 1. Acknowledge alert
    ack_resp = await async_client.patch(
        f"/api/v1/alerts/{alert_id}/status",
        json={"status": "ACKNOWLEDGED"},
        headers=cmd_headers,
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "ACKNOWLEDGED"

    # 2. Resolve alert with audit trail
    res_resp = await async_client.post(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={
            "action_taken": "Sanctioned 14 days annual leave and rotated out of night duties.",
            "resolution_notes": "Soldier showed significant recovery in counseling session.",
            "status": "RESOLVED",
        },
        headers=cmd_headers,
    )
    assert res_resp.status_code == 200
    resolved_data = res_resp.json()
    assert resolved_data["status"] == "RESOLVED"
    assert resolved_data["resolved_by"] == "commander"
    assert resolved_data["resolved_at"] is not None
    assert "Sanctioned 14 days" in resolved_data["resolution_notes"]

    # 3. Invalid transition: cannot update status of already resolved alert
    invalid_resp = await async_client.patch(
        f"/api/v1/alerts/{alert_id}/status",
        json={"status": "NEW"},
        headers=cmd_headers,
    )
    assert invalid_resp.status_code == 400
    assert "already closed" in invalid_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_alert_details_and_interventions(async_client: AsyncClient):
    """Verifies alert detail endpoint returns dynamic intervention recommendations."""
    med_headers = await get_auth_header(async_client, "medical", "medical123")

    list_resp = await async_client.get("/api/v1/alerts?limit=1", headers=med_headers)
    alert_id = list_resp.json()["items"][0]["id"]

    detail_resp = await async_client.get(f"/api/v1/alerts/{alert_id}", headers=med_headers)
    assert detail_resp.status_code == 200
    data = detail_resp.json()

    assert data["id"] == alert_id
    assert "interventions" in data
    assert len(data["interventions"]) >= 1
    first_rec = data["interventions"][0]
    assert "category" in first_rec
    assert "action" in first_rec
    assert "urgency" in first_rec


@pytest.mark.asyncio
async def test_alerts_rbac_access_controls(async_client: AsyncClient):
    """
    Verifies RBAC boundaries:
    - Personnel CANNOT list all alerts (HTTP 403).
    - Personnel CANNOT trigger scans (HTTP 403).
    - Personnel CANNOT view other soldiers' alerts (HTTP 403).
    - Unauthenticated requests return HTTP 401.
    """
    prs_headers = await get_auth_header(async_client, "personnel", "personnel123")
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")

    # Personnel blocked from alert queue
    list_resp = await async_client.get("/api/v1/alerts", headers=prs_headers)
    assert list_resp.status_code == 403

    # Personnel blocked from scan trigger
    scan_resp = await async_client.post("/api/v1/alerts/scan", json={}, headers=prs_headers)
    assert scan_resp.status_code == 403

    # Find alert for soldier ID 1
    alert_list = await async_client.get("/api/v1/alerts?personnel_id=1", headers=cmd_headers)
    if alert_list.json()["total"] > 0:
        target_alert_id = alert_list.json()["items"][0]["id"]
        # Personnel user is Hav. K. Singh (ID 3), cannot view ID 1's alert
        own_check = await async_client.get(f"/api/v1/alerts/{target_alert_id}", headers=prs_headers)
        assert own_check.status_code == 403

    # Unauthenticated
    unauth = await async_client.get("/api/v1/alerts")
    assert unauth.status_code == 401
