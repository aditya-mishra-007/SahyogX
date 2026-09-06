"""
Alert Service for SahyogX Phase 4 - Early Warning System (EWS).

Orchestrates risk threshold evaluations, alert generation, deduplication,
lifecycle state transitions, intervention recommendations, and resolution auditing.
"""

from datetime import datetime, timezone, timedelta
import logging
from typing import List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.alert import Alert
from src.models.personnel import Personnel
from src.schemas.alert import (
    AlertCreate,
    AlertResolutionPayload,
    AlertScanResult,
    AlertSeverity,
    AlertStatus,
    AlertTriggerType,
    InterventionRecommendation,
)
from src.schemas.prediction import PersonnelStressFeatures
from src.services.feature_aggregator import aggregate_personnel_features
from src.services.prediction_service import prediction_service

logger = logging.getLogger("sahyogx.alert_service")


def generate_intervention_recommendations(
    features: PersonnelStressFeatures,
    trigger_type: AlertTriggerType,
    severity: AlertSeverity,
) -> List[InterventionRecommendation]:
    """
    Generates rule-driven mitigation recommendations tailored to the specific
    stressors detected in the soldier's feature profile.
    """
    interventions: List[InterventionRecommendation] = []
    is_critical = severity == AlertSeverity.CRITICAL

    # 1. Duty Overload / Circadian Disruption
    if features.recent_night_duties >= 5 or features.recent_duty_hours >= 200:
        interventions.append(
            InterventionRecommendation(
                category="SHIFT_ROTATION",
                title="Circadian Rest & Shift Rotation",
                action=(
                    f"Reassign soldier from night sentry duties ({features.recent_night_duties} night shifts logged) "
                    "to daytime administrative tasks for minimum 7 days. Enforce mandatory 48-hour continuous rest cycle."
                ),
                urgency="IMMEDIATE" if is_critical else "WITHIN_24H",
            )
        )

    # 2. Hardship Deployment Fatigue
    if features.has_active_deployment and features.active_deployment_days >= 60:
        interventions.append(
            InterventionRecommendation(
                category="OPERATIONAL_REST",
                title="Operational Rotation & Base Relief",
                action=(
                    f"Soldier deployed for {features.active_deployment_days} days in {features.active_deployment_type} "
                    f"({features.active_deployment_intensity} intensity). Schedule mid-deployment recuperation or rotational relief."
                ),
                urgency="WITHIN_24H" if is_critical else "WITHIN_7D",
            )
        )

    # 3. Leave Deprivation
    if features.days_since_last_leave >= 120 or features.rejected_leave_requests > 0:
        interventions.append(
            InterventionRecommendation(
                category="LEAVE_GRANT",
                title="Expedited Leave Sanction",
                action=(
                    f"Soldier has not had authorized rest in {features.days_since_last_leave} days "
                    f"(with {features.rejected_leave_requests} rejected application(s)). Expedite 10-14 days Annual/Casual Leave."
                ),
                urgency="WITHIN_7D",
            )
        )

    # 4. Clinical Mental Health / Severe Stress
    if features.flagged_for_counselor or features.latest_stress_score >= 7.0 or features.latest_sleep_quality_score <= 3.0:
        interventions.append(
            InterventionRecommendation(
                category="CLINICAL_REFERRAL",
                title="Regimental Medical Officer (RMO) Consultation",
                action=(
                    f"Self-reported clinical distress (Stress: {features.latest_stress_score:.1f}/10, "
                    f"Sleep: {features.latest_sleep_quality_score:.1f}/10). Direct soldier for priority counseling review."
                ),
                urgency="IMMEDIATE" if is_critical else "WITHIN_24H",
            )
        )

    # Default general wellness fallback if specific triggers don't match
    if not interventions:
        interventions.append(
            InterventionRecommendation(
                category="OPERATIONAL_REST",
                title="Preventive Welfare Review",
                action="Conduct commanding officer welfare interview and evaluate current operational workload.",
                urgency="WITHIN_7D",
            )
        )

    return interventions


async def get_alert_by_id(db: AsyncSession, alert_id: int) -> Optional[Alert]:
    """Retrieves an alert by ID with the personnel relationship eagerly loaded."""
    stmt = (
        select(Alert)
        .options(selectinload(Alert.personnel))
        .where(Alert.id == alert_id)
    )
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def list_alerts(
    db: AsyncSession,
    unit: Optional[str] = None,
    personnel_id: Optional[int] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Alert], int]:
    """
    Retrieves filtered and paginated alerts.
    Orders CRITICAL alerts first, then newest alerts first.
    """
    query = select(Alert).options(selectinload(Alert.personnel)).join(Personnel, Alert.personnel_id == Personnel.id)
    count_query = select(func.count(Alert.id)).join(Personnel, Alert.personnel_id == Personnel.id)

    if unit:
        query = query.where(Personnel.unit == unit.strip())
        count_query = count_query.where(Personnel.unit == unit.strip())
    if personnel_id:
        query = query.where(Alert.personnel_id == personnel_id)
        count_query = count_query.where(Alert.personnel_id == personnel_id)
    if status:
        query = query.where(Alert.status == status.strip().upper())
        count_query = count_query.where(Alert.status == status.strip().upper())
    if severity:
        query = query.where(Alert.severity == severity.strip().upper())
        count_query = count_query.where(Alert.severity == severity.strip().upper())

    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Prioritize CRITICAL alerts, then order by newest
    order_severity = case((Alert.severity == "CRITICAL", 0), else_=1)
    query = query.order_by(order_severity, Alert.created_at.desc(), Alert.id.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def create_alert(db: AsyncSession, data: AlertCreate) -> Alert:
    """Creates and persists an early warning alert for a personnel."""
    alert = Alert(
        personnel_id=data.personnel_id,
        risk_score=round(data.risk_score, 3),
        risk_category=data.risk_category.upper(),
        trigger_type=data.trigger_type.value if hasattr(data.trigger_type, "value") else str(data.trigger_type),
        title=data.title.strip(),
        description=data.description.strip(),
        severity=data.severity.value if hasattr(data.severity, "value") else str(data.severity),
        status=AlertStatus.NEW.value,
        recommended_action=data.recommended_action.strip() if data.recommended_action else None,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def scan_and_generate_alerts(
    db: AsyncSession,
    min_threshold: float = 0.60,
    unit: Optional[str] = None,
) -> AlertScanResult:
    """
    Scans personnel risk evaluations and generates Early Warning alerts
    for personnel exceeding the minimum risk threshold.
    Implements deduplication to avoid redundant active alerts.
    """
    personnel_stmt = select(Personnel).where(Personnel.status == "ACTIVE")
    if unit:
        personnel_stmt = personnel_stmt.where(Personnel.unit == unit.strip())
    personnel_stmt = personnel_stmt.order_by(Personnel.id.asc())

    personnel_res = await db.execute(personnel_stmt)
    personnel_list = list(personnel_res.scalars().all())

    total_scanned = len(personnel_list)
    alerts_created = 0
    existing_skipped = 0
    now = datetime.now(timezone.utc)
    cooldown_threshold = now - timedelta(days=7)

    for p in personnel_list:
        prediction = await prediction_service.predict_personnel_stress(db, p.id)
        if not prediction:
            continue

        features = prediction.features_summary

        # Trigger condition: risk score >= threshold OR counselor flag triggered
        if prediction.risk_score >= min_threshold or features.flagged_for_counselor:
            # Check for existing active alert within cooldown window
            existing_stmt = select(Alert).where(
                Alert.personnel_id == p.id,
                Alert.status.in_([AlertStatus.NEW.value, AlertStatus.ACKNOWLEDGED.value, AlertStatus.IN_REVIEW.value]),
                Alert.created_at >= cooldown_threshold,
            )
            existing_res = await db.execute(existing_stmt)
            existing_alert = existing_res.scalars().first()

            if existing_alert:
                existing_skipped += 1
                continue

            # Determine primary trigger type and severity
            if features.flagged_for_counselor or features.latest_stress_score >= 7.5:
                trigger_type = AlertTriggerType.CLINICAL_SURVEY_DISTRESS
                title = f"High Psychological Stress: {p.rank} {p.name}"
            elif features.recent_night_duties >= 8 or features.recent_duty_hours >= 220:
                trigger_type = AlertTriggerType.DUTY_OVERLOAD
                title = f"Circadian Workload Overload: {p.rank} {p.name}"
            elif features.has_active_deployment and features.active_deployment_intensity in ("HIGH", "EXTREME"):
                trigger_type = AlertTriggerType.HARDSHIP_DEPLOYMENT
                title = f"Operational Hardship Fatigue: {p.rank} {p.name}"
            elif features.days_since_last_leave >= 180:
                trigger_type = AlertTriggerType.LEAVE_DEPRIVATION
                title = f"Critical Leave Deprivation: {p.rank} {p.name}"
            else:
                trigger_type = AlertTriggerType.COMPOSITE_ML_RISK
                title = f"Compound Welfare Risk: {p.rank} {p.name}"

            severity = AlertSeverity.CRITICAL if (prediction.risk_score >= 0.80 or features.flagged_for_counselor) else AlertSeverity.HIGH

            # Formulate explainable description from primary factors
            factor_summaries = [f"- {factor.description}" for factor in prediction.primary_risk_factors[:3]]
            description = (
                f"Soldier {p.service_number} ({p.rank} {p.name}, {p.unit}) evaluated at {prediction.risk_score:.3f} "
                f"composite risk ({prediction.risk_category.value}).\n"
                "Key contributors:\n" + "\n".join(factor_summaries)
            )

            # Generate recommended action
            recs = generate_intervention_recommendations(features, trigger_type, severity)
            rec_action = "; ".join([r.action for r in recs])

            new_alert = Alert(
                personnel_id=p.id,
                risk_score=prediction.risk_score,
                risk_category=prediction.risk_category.value,
                trigger_type=trigger_type.value,
                title=title,
                description=description,
                severity=severity.value,
                status=AlertStatus.NEW.value,
                recommended_action=rec_action,
            )
            db.add(new_alert)
            alerts_created += 1

    await db.commit()
    return AlertScanResult(
        total_scanned=total_scanned,
        alerts_created=alerts_created,
        existing_active_skipped=existing_skipped,
        scan_timestamp=now,
    )


async def update_alert_status(
    db: AsyncSession,
    alert_id: int,
    new_status: AlertStatus,
    officer_username: str,
) -> Optional[Alert]:
    """
    Updates the alert lifecycle state (e.g., acknowledging or marking in-review).
    Prevents invalid transitions from closed states.
    """
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        return None

    if alert.status in (AlertStatus.RESOLVED.value, AlertStatus.DISMISSED.value):
        raise ValueError(f"Cannot change status of already closed alert (current status: {alert.status}).")

    alert.status = new_status.value
    await db.commit()
    await db.refresh(alert)
    return alert


async def resolve_alert(
    db: AsyncSession,
    alert_id: int,
    payload: AlertResolutionPayload,
    officer_username: str,
) -> Optional[Alert]:
    """
    Formally resolves or dismisses an alert with recorded actions taken,
    authorizing officer audit signature, and timestamp.
    """
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        return None

    now = datetime.now(timezone.utc)
    alert.status = payload.status.value
    alert.resolution_notes = (
        f"Action Taken: {payload.action_taken.strip()}\n"
        f"Notes: {payload.resolution_notes.strip() if payload.resolution_notes else 'None'}"
    )
    alert.resolved_by = officer_username
    alert.resolved_at = now

    await db.commit()
    await db.refresh(alert)
    return alert
