"""
Unit Analytics & Heatmap Service for SahyogX Phase 4.

Aggregates force-wide welfare data, unit-level stress heatmaps, operational
theatre vulnerability distributions, and deep-dive battalion profiles.
"""

from datetime import datetime, timezone, timedelta, date
import logging
import time
from typing import List, Optional
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.alert import Alert
from src.models.deployment import Deployment
from src.models.duty import DutyLog
from src.models.leave import LeaveRecord
from src.models.personnel import Personnel
from src.schemas.analytics import (
    RiskBreakdown,
    TheatreRiskMetric,
    TheatreRiskResponse,
    UnitHeatmapItem,
    UnitHeatmapResponse,
    UnitWelfareSummary,
)
from src.schemas.prediction import RiskCategory
from src.services.feature_aggregator import aggregate_personnel_features
from src.services.prediction_service import prediction_service

logger = logging.getLogger("sahyogx.analytics_service")

# High-performance in-memory TTL cache for force-wide heatmap (reduces DB hits from 350+ to 0)
_HEATMAP_CACHE = {
    "data": None,
    "expires_at": 0.0,
}


def invalidate_heatmap_cache() -> None:
    """Invalidates the in-memory heatmap cache to force re-computation."""
    global _HEATMAP_CACHE
    _HEATMAP_CACHE["data"] = None
    _HEATMAP_CACHE["expires_at"] = 0.0


async def get_unit_heatmap(db: AsyncSession) -> UnitHeatmapResponse:
    """
    Computes a force-wide stress risk heatmap across all registered battalions/regiments.
    Returns unit-level risk score, risk level, active alerts count, and risk breakdown.
    Utilizes a 120-second in-memory TTL cache for sub-millisecond response latency.
    """
    global _HEATMAP_CACHE
    now_ts = time.time()
    if _HEATMAP_CACHE["data"] is not None and now_ts < _HEATMAP_CACHE["expires_at"]:
        logger.debug("Serving force heatmap from fast in-memory TTL cache")
        return _HEATMAP_CACHE["data"]
    unit_stmt = (
        select(Personnel.unit)
        .where(Personnel.status == "ACTIVE")
        .distinct()
        .order_by(Personnel.unit.asc())
    )
    unit_res = await db.execute(unit_stmt)
    units = list(unit_res.scalars().all())

    items: List[UnitHeatmapItem] = []
    total_force_personnel = 0
    weighted_score_sum = 0.0
    most_vulnerable_unit: Optional[str] = None
    highest_unit_score = -1.0

    now = datetime.now(timezone.utc)

    for unit_name in units:
        # Get unit predictions
        unit_summary = await prediction_service.predict_unit_stress(db, unit_name)
        total_p = unit_summary.total_evaluated

        if total_p == 0:
            continue

        # Count active open alerts for this unit
        open_alerts_stmt = (
            select(
                func.count(Alert.id).label("total_open"),
                func.coalesce(
                    func.sum(case((Alert.severity == "CRITICAL", 1), else_=0)), 0
                ).label("critical_open"),
            )
            .join(Personnel, Alert.personnel_id == Personnel.id)
            .where(
                Personnel.unit == unit_name,
                Alert.status.in_(["NEW", "ACKNOWLEDGED", "IN_REVIEW"]),
            )
        )
        alerts_res = await db.execute(open_alerts_stmt)
        alerts_row = alerts_res.fetchone()

        active_alerts = int(alerts_row.total_open) if alerts_row else 0
        critical_alerts = int(alerts_row.critical_open) if alerts_row else 0

        high_plus_crit = unit_summary.high_risk_count + unit_summary.critical_risk_count
        high_risk_pct = round((high_plus_crit / total_p) * 100.0, 1)

        # Categorize unit risk level
        if unit_summary.unit_average_risk_score >= 0.80:
            u_level = "CRITICAL"
        elif unit_summary.unit_average_risk_score >= 0.60:
            u_level = "HIGH"
        elif unit_summary.unit_average_risk_score >= 0.35:
            u_level = "MODERATE"
        else:
            u_level = "LOW"

        breakdown = RiskBreakdown(
            low=unit_summary.low_risk_count,
            moderate=unit_summary.moderate_risk_count,
            high=unit_summary.high_risk_count,
            critical=unit_summary.critical_risk_count,
        )

        item = UnitHeatmapItem(
            unit=unit_name,
            total_personnel=total_p,
            average_risk_score=unit_summary.unit_average_risk_score,
            risk_level=u_level,
            active_alerts_count=active_alerts,
            critical_alerts_count=critical_alerts,
            risk_breakdown=breakdown,
            high_risk_percentage=high_risk_pct,
        )
        items.append(item)

        total_force_personnel += total_p
        weighted_score_sum += unit_summary.unit_average_risk_score * total_p

        if unit_summary.unit_average_risk_score > highest_unit_score:
            highest_unit_score = unit_summary.unit_average_risk_score
            most_vulnerable_unit = unit_name

    force_avg = (
        round(weighted_score_sum / total_force_personnel, 3)
        if total_force_personnel > 0
        else 0.0
    )

    result = UnitHeatmapResponse(
        units=items,
        force_total_personnel=total_force_personnel,
        force_average_risk_score=force_avg,
        most_vulnerable_unit=most_vulnerable_unit,
        generated_at=now,
    )
    _HEATMAP_CACHE["data"] = result
    _HEATMAP_CACHE["expires_at"] = time.time() + 120.0  # 2 minutes TTL
    return result


async def get_theatre_risk_analytics(db: AsyncSession) -> TheatreRiskResponse:
    """
    Computes operational risk distribution across deployment locations / theatres.
    Aggregates active troops count, terrain hardship rating, and stress scores.
    """
    stmt = (
        select(
            Deployment.location.label("theatre"),
            Deployment.deployment_type,
            Deployment.operational_intensity,
            func.count(Deployment.id).label("active_count"),
        )
        .where(Deployment.status == "ACTIVE")
        .group_by(
            Deployment.location,
            Deployment.deployment_type,
            Deployment.operational_intensity,
        )
        .order_by(func.count(Deployment.id).desc())
    )
    res = await db.execute(stmt)
    rows = res.fetchall()

    theatre_metrics: List[TheatreRiskMetric] = []
    total_active = 0
    now = datetime.now(timezone.utc)

    for r in rows:
        loc = str(r.theatre)
        dep_type = str(r.deployment_type)
        intensity = str(r.operational_intensity)
        count = int(r.active_count)
        total_active += count

        # Query personnel deployed in this specific theatre to compute their average risk
        p_stmt = (
            select(Deployment.personnel_id)
            .where(
                Deployment.location == loc,
                Deployment.deployment_type == dep_type,
                Deployment.status == "ACTIVE",
            )
        )
        p_res = await db.execute(p_stmt)
        p_ids = list(p_res.scalars().all())

        scores: List[float] = []
        for pid in p_ids:
            pred = await prediction_service.predict_personnel_stress(db, pid)
            if pred:
                scores.append(pred.risk_score)

        avg_score = round(sum(scores) / len(scores), 3) if scores else 0.50

        theatre_metrics.append(
            TheatreRiskMetric(
                theatre=loc,
                deployment_type=dep_type,
                active_deployments=count,
                average_stress_score=avg_score,
                hardship_level=intensity,
            )
        )

    return TheatreRiskResponse(
        theatres=theatre_metrics,
        total_active_deployments=total_active,
        generated_at=now,
    )


async def get_unit_welfare_summary(
    db: AsyncSession, unit_name: str
) -> Optional[UnitWelfareSummary]:
    """
    Deep-dive operational welfare analysis for a single battalion.
    Computes duty averages, night shifts, leave deprivation rates, and alerts.
    """
    # 1. Fetch all personnel IDs for this unit
    p_stmt = select(Personnel.id).where(Personnel.unit == unit_name.strip())
    p_res = await db.execute(p_stmt)
    personnel_ids = list(p_res.scalars().all())

    if not personnel_ids:
        return None

    total_strength = len(personnel_ids)
    now = datetime.now(timezone.utc)
    today = date.today()
    ref_30d = today - timedelta(days=30)

    # 2. Duty logs past 30 days
    duty_stmt = select(
        func.coalesce(func.avg(DutyLog.hours_worked), 0.0).label("avg_hours"),
        func.coalesce(
            func.sum(case((DutyLog.night_duty.is_(True), 1), else_=0)), 0
        ).label("total_night"),
        func.coalesce(func.max(DutyLog.consecutive_duty_days), 0).label("max_consec"),
        func.count(DutyLog.id).label("total_duties"),
    ).where(
        DutyLog.personnel_id.in_(personnel_ids),
        DutyLog.duty_date >= ref_30d,
    )
    duty_res = await db.execute(duty_stmt)
    duty_row = duty_res.fetchone()

    avg_hours_30d = round(float(duty_row.avg_hours), 1) if duty_row else 0.0
    total_nights = int(duty_row.total_night) if duty_row else 0
    avg_night_duties = round(total_nights / total_strength, 1) if total_strength > 0 else 0.0
    avg_consec = round(float(duty_row.max_consec), 1) if duty_row else 0.0

    # 3. Active deployments
    deploy_stmt = select(func.count(Deployment.id)).where(
        Deployment.personnel_id.in_(personnel_ids),
        Deployment.status == "ACTIVE",
    )
    deploy_res = await db.execute(deploy_stmt)
    active_deploy_count = int(deploy_res.scalar_one() or 0)

    # 4. Leave deprivation rate (% soldiers with no leave in past 180 days)
    deprived_count = 0
    for pid in personnel_ids:
        features = await aggregate_personnel_features(db, pid)
        if features and features.days_since_last_leave >= 180:
            deprived_count += 1
    leave_deprivation_rate = round((deprived_count / total_strength) * 100.0, 1)

    # 5. Unit stress predictions
    unit_summary = await prediction_service.predict_unit_stress(db, unit_name)

    # 6. Active alerts
    alerts_stmt = select(
        func.count(Alert.id).label("total_open"),
        func.coalesce(
            func.sum(case((Alert.severity == "CRITICAL", 1), else_=0)), 0
        ).label("critical_open"),
    ).where(
        Alert.personnel_id.in_(personnel_ids),
        Alert.status.in_(["NEW", "ACKNOWLEDGED", "IN_REVIEW"]),
    )
    alerts_res = await db.execute(alerts_stmt)
    alerts_row = alerts_res.fetchone()
    active_alerts = int(alerts_row.total_open) if alerts_row else 0
    critical_alerts = int(alerts_row.critical_open) if alerts_row else 0

    if unit_summary.unit_average_risk_score >= 0.80:
        level = "CRITICAL"
    elif unit_summary.unit_average_risk_score >= 0.60:
        level = "HIGH"
    elif unit_summary.unit_average_risk_score >= 0.35:
        level = "MODERATE"
    else:
        level = "LOW"

    breakdown = RiskBreakdown(
        low=unit_summary.low_risk_count,
        moderate=unit_summary.moderate_risk_count,
        high=unit_summary.high_risk_count,
        critical=unit_summary.critical_risk_count,
    )

    return UnitWelfareSummary(
        unit=unit_name.strip(),
        total_strength=total_strength,
        average_risk_score=unit_summary.unit_average_risk_score,
        risk_level=level,
        active_deployments_count=active_deploy_count,
        average_duty_hours_past_30d=avg_hours_30d,
        average_night_duties_past_30d=avg_night_duties,
        average_consecutive_duty_days=avg_consec,
        leave_deprivation_rate=leave_deprivation_rate,
        active_alerts_count=active_alerts,
        critical_alerts_count=critical_alerts,
        risk_breakdown=breakdown,
        generated_at=now,
    )
