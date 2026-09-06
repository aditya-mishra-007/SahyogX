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
async def test_full_mission_e2e_workflow(async_client: AsyncClient):
    """
    End-to-End Mission Lifecycle Hardening Test:
    1. Authenticate Commander and Medical Officer roles.
    2. Enroll a soldier profile into a tactical battalion.
    3. Record high-altitude, extreme hardship deployment.
    4. Log excessive night duty shifts and workload strain.
    5. Log denied leave request due to operational exigency.
    6. Record clinical wellness survey indicating severe stress.
    7. Execute AI predictive stress risk assessment (yielding HIGH or CRITICAL).
    8. Trigger Early Warning System (EWS) automated alert generation.
    9. Commander intervenes: acknowledges and resolves the alert.
    10. Commander exports tactical unit readiness data (CSV).
    11. Verify complete system audit trail reflects security and operational integrity.
    """
    # -------------------------------------------------------------------------
    # 1. Authenticate Roles
    # -------------------------------------------------------------------------
    cmd_headers = await get_auth_header(async_client, "commander", "commander123")
    med_headers = await get_auth_header(async_client, "medical", "medical123")

    # -------------------------------------------------------------------------
    # 2. Enroll Soldier
    # -------------------------------------------------------------------------
    service_num = "SX-E2E-7701"
    unit_name = "7 Sikh Light Infantry"

    personnel_payload = {
        "service_number": service_num,
        "name": "Sep. Vikram Rana",
        "rank": "Sepoy",
        "role": "Infantry",
        "unit": unit_name,
        "joining_date": "2020-08-15",
        "contact_email": "vikram.rana@sahyogx.mil.in",
        "emergency_contact": "9876543210",
    }
    create_p_resp = await async_client.post(
        "/api/v1/personnel",
        json=personnel_payload,
        headers=cmd_headers,
    )
    # If already created in earlier test run, fetch ID
    if create_p_resp.status_code == 201:
        personnel_id = create_p_resp.json()["id"]
    else:
        list_resp = await async_client.get(f"/api/v1/personnel?unit={unit_name}", headers=cmd_headers)
        personnel_id = [p["id"] for p in list_resp.json()["items"] if p["service_number"] == service_num][0]

    assert personnel_id is not None

    # -------------------------------------------------------------------------
    # 3. Log Hardship Deployment
    # -------------------------------------------------------------------------
    deploy_payload = {
        "personnel_id": personnel_id,
        "location": "Siachen Sector - Northern Glacier",
        "deployment_type": "HIGH_ALTITUDE",
        "operational_intensity": "EXTREME",
        "status": "ACTIVE",
        "start_date": "2024-01-10",
    }
    deploy_resp = await async_client.post(
        "/api/v1/deployments",
        json=deploy_payload,
        headers=cmd_headers,
    )
    assert deploy_resp.status_code == 201

    # -------------------------------------------------------------------------
    # 4. Log High-Stress Night Duty Shifts
    # -------------------------------------------------------------------------
    duty_payload = {
        "personnel_id": personnel_id,
        "duty_date": "2024-04-12",
        "duty_type": "COMBAT_PATROL",
        "hours_worked": 14.0,
        "night_duty": True,
        "consecutive_duty_days": 5,
        "workload_score": 8.5,
    }
    duty_resp = await async_client.post(
        "/api/v1/duty",
        json=duty_payload,
        headers=cmd_headers,
    )
    assert duty_resp.status_code == 201

    # -------------------------------------------------------------------------
    # 5. Log Denied Leave Record
    # -------------------------------------------------------------------------
    leave_payload = {
        "personnel_id": personnel_id,
        "leave_type": "ANNUAL",
        "start_date": "2024-05-01",
        "end_date": "2024-05-15",
        "status": "REJECTED",
        "reason": "High-altitude perimeter defense alert",
    }
    leave_resp = await async_client.post(
        "/api/v1/leaves",
        json=leave_payload,
        headers=cmd_headers,
    )
    assert leave_resp.status_code == 201

    # -------------------------------------------------------------------------
    # 6. Medical Officer Submits Wellness Survey
    # -------------------------------------------------------------------------
    survey_payload = {
        "personnel_id": personnel_id,
        "survey_date": "2024-05-16",
        "stress_score": 9.0,
        "sleep_quality_score": 1.5,
        "fatigue_score": 9.2,
        "wellbeing_score": 1.8,
        "notes": "Subject shows persistent tremors and sleep disruption.",
    }
    survey_resp = await async_client.post(
        "/api/v1/surveys",
        json=survey_payload,
        headers=med_headers,
    )
    assert survey_resp.status_code == 201

    # -------------------------------------------------------------------------
    # 7. Predictive Risk Inference
    # -------------------------------------------------------------------------
    pred_resp = await async_client.get(
        f"/api/v1/predictions/personnel/{personnel_id}",
        headers=cmd_headers,
    )
    assert pred_resp.status_code == 200
    pred_data = pred_resp.json()
    assert pred_data["risk_score"] >= 0.5
    assert pred_data["risk_category"] in ("HIGH", "CRITICAL")
    assert len(pred_data["primary_risk_factors"]) >= 1

    # -------------------------------------------------------------------------
    # 8. Trigger EWS Automated Alert Scan
    # -------------------------------------------------------------------------
    scan_resp = await async_client.post(
        "/api/v1/alerts/scan",
        json={"min_risk_threshold": 0.50},
        headers=cmd_headers,
    )
    assert scan_resp.status_code == 200

    # Fetch newly generated alert for soldier
    alerts_resp = await async_client.get(
        f"/api/v1/alerts?personnel_id={personnel_id}",
        headers=cmd_headers,
    )
    assert alerts_resp.status_code == 200
    alerts_data = alerts_resp.json()
    assert alerts_data["total"] >= 1
    target_alert = alerts_data["items"][0]
    alert_id = target_alert["id"]

    # -------------------------------------------------------------------------
    # 9. Commander Resolves the Alert
    # -------------------------------------------------------------------------
    resolve_resp = await async_client.post(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={
            "action_taken": "Immediate 14-day R&R rotation and clinical counseling scheduled.",
            "resolution_notes": "Granted emergency medical relief; transferred to base camp for rest.",
            "status": "RESOLVED",
        },
        headers=cmd_headers,
    )
    assert resolve_resp.status_code == 200
    resolved_alert = resolve_resp.json()
    assert resolved_alert["status"] == "RESOLVED"
    assert resolved_alert["resolved_by"] == "commander"
    assert resolved_alert["resolved_at"] is not None

    # -------------------------------------------------------------------------
    # 10. Commander Exports Tactical Unit Readiness Data
    # -------------------------------------------------------------------------
    export_resp = await async_client.get(
        f"/api/v1/export/unit/{unit_name}/csv",
        headers=cmd_headers,
    )
    assert export_resp.status_code == 200
    assert service_num in export_resp.text
    assert "Sepoy" in export_resp.text

    # -------------------------------------------------------------------------
    # 11. Verify Audit Trail Records
    # -------------------------------------------------------------------------
    audit_resp = await async_client.get(
        "/api/v1/audit/logs?page_size=50",
        headers=cmd_headers,
    )
    assert audit_resp.status_code == 200
    audit_items = audit_resp.json()["items"]
    assert len(audit_items) >= 1
    actions_logged = {item["action"] for item in audit_items}
    # Confirm essential actions appear in the immutable audit trail
    assert "LOGIN_SUCCESS" in actions_logged
    assert "DATA_EXPORT_CSV" in actions_logged
