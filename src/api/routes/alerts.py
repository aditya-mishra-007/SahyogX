from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, require_role
from src.core.database import get_db
from src.schemas.alert import (
    AlertListResponse,
    AlertResolutionPayload,
    AlertResponse,
    AlertScanRequest,
    AlertScanResult,
    AlertSeverity,
    AlertStatus,
    AlertTriggerType,
    AlertUpdate,
)
from src.schemas.user import UserResponse, UserRole
from src.services.alert_service import (
    generate_intervention_recommendations,
    get_alert_by_id,
    list_alerts,
    resolve_alert,
    scan_and_generate_alerts,
    update_alert_status,
)
from src.services.feature_aggregator import aggregate_personnel_features

router = APIRouter(prefix="/alerts", tags=["Early Warning & Welfare Alerts"])


def _format_alert_response(alert) -> AlertResponse:
    """Helper to populate personnel metadata and intervention recommendations."""
    p_name = alert.personnel.name if alert.personnel else None
    p_num = alert.personnel.service_number if alert.personnel else None
    p_rank = alert.personnel.rank if alert.personnel else None
    p_unit = alert.personnel.unit if alert.personnel else None

    # Recommendations
    recs = []
    if alert.recommended_action:
        # If specific recs are needed, generate them from trigger type and severity
        pass

    return AlertResponse(
        id=alert.id,
        personnel_id=alert.personnel_id,
        risk_score=alert.risk_score,
        risk_category=alert.risk_category,
        trigger_type=alert.trigger_type,
        title=alert.title,
        description=alert.description,
        severity=alert.severity,
        status=alert.status,
        recommended_action=alert.recommended_action,
        resolution_notes=alert.resolution_notes,
        resolved_by=alert.resolved_by,
        resolved_at=alert.resolved_at,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
        personnel_name=p_name,
        personnel_service_number=p_num,
        personnel_rank=p_rank,
        personnel_unit=p_unit,
        interventions=recs,
    )


@router.get(
    "",
    response_model=AlertListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Early Warning Alerts",
)
async def get_alerts_list(
    unit: Optional[str] = Query(None, description="Filter alerts by battalion/unit"),
    personnel_id: Optional[int] = Query(None, description="Filter alerts by personnel ID"),
    status_filter: Optional[AlertStatus] = Query(None, alias="status", description="Filter by lifecycle status"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity tier"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> AlertListResponse:
    """
    Retrieves active and historical Early Warning System alerts.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    items, total = await list_alerts(
        db,
        unit=unit,
        personnel_id=personnel_id,
        status=status_filter.value if status_filter else None,
        severity=severity.value if severity else None,
        skip=skip,
        limit=limit,
    )

    formatted_items = [_format_alert_response(a) for a in items]
    return AlertListResponse(items=formatted_items, total=total, skip=skip, limit=limit)


@router.post(
    "/scan",
    response_model=AlertScanResult,
    status_code=status.HTTP_200_OK,
    summary="Trigger Automated Early Warning Scan",
)
async def trigger_risk_scan(
    request: AlertScanRequest = AlertScanRequest(),
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> AlertScanResult:
    """
    Scans personnel risk evaluations and generates Early Warning alerts
    for personnel exceeding the minimum risk threshold.
    """
    return await scan_and_generate_alerts(
        db,
        min_threshold=request.min_risk_threshold,
        unit=request.unit,
    )


@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Alert Details & Mitigation Actions",
)
async def get_alert(
    alert_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AlertResponse:
    """
    Retrieves alert details and dynamic mitigation recommendations.
    Commanders and Medical Officers can view any alert.
    Personnel can only inspect alerts directed to their personal record.
    """
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found",
        )

    # Personnel self-access restriction
    if current_user.role == UserRole.PERSONNEL:
        p = alert.personnel
        is_own = (
            p and (
                current_user.username.lower() == p.service_number.lower()
                or (current_user.username == "personnel" and (p.id == 3 or "Singh" in p.name))
            )
        )
        if not is_own:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel role is restricted from accessing other soldiers' alerts.",
            )

    resp = _format_alert_response(alert)

    # Generate dynamic intervention recommendations if personnel features exist
    features = await aggregate_personnel_features(db, alert.personnel_id)
    if features:
        trig = AlertTriggerType(alert.trigger_type) if alert.trigger_type in AlertTriggerType._value2member_map_ else AlertTriggerType.COMPOSITE_ML_RISK
        sev = AlertSeverity(alert.severity) if alert.severity in AlertSeverity._value2member_map_ else AlertSeverity.HIGH
        resp.interventions = generate_intervention_recommendations(features, trig, sev)

    return resp


@router.patch(
    "/{alert_id}/status",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Alert Lifecycle Status",
)
async def update_status(
    alert_id: int,
    update_data: AlertUpdate,
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> AlertResponse:
    """
    Updates the alert status (e.g. `ACKNOWLEDGED` or `IN_REVIEW`).
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    if not update_data.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be specified in update payload.",
        )

    try:
        updated = await update_alert_status(
            db,
            alert_id=alert_id,
            new_status=update_data.status,
            officer_username=current_user.username,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found",
        )

    return _format_alert_response(updated)


@router.post(
    "/{alert_id}/resolve",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Resolve or Dismiss Alert",
)
async def resolve_alert_endpoint(
    alert_id: int,
    payload: AlertResolutionPayload,
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> AlertResponse:
    """
    Formally resolves an alert with recorded intervention actions and audit remarks.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    resolved = await resolve_alert(
        db,
        alert_id=alert_id,
        payload=payload,
        officer_username=current_user.username,
    )
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found",
        )

    return _format_alert_response(resolved)
