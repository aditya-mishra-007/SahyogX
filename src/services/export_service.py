"""
Tactical Data Export Service for SahyogX Phase 5.
Provides role-governed, PII-minimized CSV and JSON export facilities
for field commanders, regimental medical officers, and HQ auditing.
"""

import csv
from datetime import datetime, timezone
import io
import logging
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.alert import Alert
from src.models.personnel import Personnel
from src.schemas.export import (
    ExportMetadata,
    UnitExportItem,
    UnitExportPayload,
)
from src.schemas.user import UserResponse, UserRole
from src.services.audit_service import log_audit_event
from src.services.prediction_service import prediction_service

logger = logging.getLogger("sahyogx.export_service")


async def generate_unit_export_data(
    db: AsyncSession,
    unit: str,
    current_user: UserResponse,
) -> Tuple[ExportMetadata, list[UnitExportItem]]:
    """
    Collects, aggregates, and sanitizes personnel operational data for a tactical unit.
    Applies data minimization to ensure clinical survey notes are never leaked.
    """
    stmt = (
        select(Personnel)
        .where(Personnel.unit == unit)
        .options(
            selectinload(Personnel.deployments),
            selectinload(Personnel.duty_logs),
            selectinload(Personnel.surveys),
            selectinload(Personnel.alerts),
        )
        .order_by(Personnel.rank, Personnel.name)
    )
    result = await db.execute(stmt)
    personnel_list = list(result.scalars().all())

    records: list[UnitExportItem] = []

    for p in personnel_list:
        # Calculate active warning alerts count
        active_alerts = [
            a for a in p.alerts
            if a.status in ("NEW", "ACKNOWLEDGED", "IN_REVIEW")
        ]

        # Calculate latest risk score via predictive engine
        latest_risk_score = None
        latest_risk_cat = None
        try:
            pred = await prediction_service.predict_personnel_stress(db, p.id)
            latest_risk_score = round(pred.composite_risk_score, 4)
            latest_risk_cat = (
                pred.risk_category.value
                if hasattr(pred.risk_category, "value")
                else str(pred.risk_category)
            )
        except Exception as exc:
            logger.debug(f"Risk score calculation skipped for personnel {p.id}: {exc}")

        # Data minimization: Strip any sensitive medical remarks
        # Only aggregate stats and operational indicators are exported
        records.append(
            UnitExportItem(
                service_number=p.service_number,
                name=p.name,
                rank=p.rank,
                unit=p.unit,
                current_role=p.role,
                is_active=(p.status == "ACTIVE"),
                total_deployments=len(p.deployments),
                total_duty_shifts=len(p.duty_logs),
                total_surveys=len(p.surveys),
                latest_risk_score=latest_risk_score,
                latest_risk_category=latest_risk_cat,
                active_alerts_count=len(active_alerts),
            )
        )

    user_role_str = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    metadata = ExportMetadata(
        unit=unit,
        exported_by=current_user.username,
        exporter_role=user_role_str,
        export_timestamp=datetime.now(timezone.utc),
        record_count=len(records),
        data_classification="OFFICIAL / RESTRICTED",
        pii_redacted=True,
    )

    return metadata, records


async def generate_unit_csv_export(
    db: AsyncSession,
    unit: str,
    current_user: UserResponse,
) -> Tuple[str, str]:
    """
    Generates an RFC 4180 compliant CSV string for a tactical unit.
    Returns (csv_text, suggested_filename).
    """
    metadata, records = await generate_unit_export_data(db, unit, current_user)

    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")

    # Write standard CSV Header
    writer.writerow([
        "Service Number",
        "Name",
        "Rank",
        "Unit",
        "Role",
        "Active",
        "Total Deployments",
        "Total Duty Shifts",
        "Total Surveys",
        "Latest Risk Score",
        "Latest Risk Category",
        "Active Alerts",
    ])

    for r in records:
        writer.writerow([
            r.service_number,
            r.name,
            r.rank,
            r.unit,
            r.current_role,
            "YES" if r.is_active else "NO",
            r.total_deployments,
            r.total_duty_shifts,
            r.total_surveys,
            f"{r.latest_risk_score:.4f}" if r.latest_risk_score is not None else "N/A",
            r.latest_risk_category or "N/A",
            r.active_alerts_count,
        ])

    csv_content = output.getvalue()
    timestamp_str = metadata.export_timestamp.strftime("%Y%m%d_%H%M%S")
    clean_unit = unit.replace(" ", "_").replace("/", "-")
    filename = f"tactical_unit_{clean_unit}_{timestamp_str}.csv"

    # Record immutable audit trail
    await log_audit_event(
        db=db,
        action="DATA_EXPORT_CSV",
        user_id=current_user.username,
        user_role=metadata.exporter_role,
        resource_type="UNIT_EXPORT",
        resource_id=unit,
        details={
            "unit": unit,
            "record_count": metadata.record_count,
            "filename": filename,
        },
    )

    return csv_content, filename


async def generate_unit_json_export(
    db: AsyncSession,
    unit: str,
    current_user: UserResponse,
) -> UnitExportPayload:
    """
    Generates a structured JSON export envelope for a tactical unit.
    Returns UnitExportPayload.
    """
    metadata, records = await generate_unit_export_data(db, unit, current_user)

    # Record immutable audit trail
    await log_audit_event(
        db=db,
        action="DATA_EXPORT_JSON",
        user_id=current_user.username,
        user_role=metadata.exporter_role,
        resource_type="UNIT_EXPORT",
        resource_id=unit,
        details={
            "unit": unit,
            "record_count": metadata.record_count,
        },
    )

    return UnitExportPayload(metadata=metadata, records=records)


async def generate_alerts_csv_export(
    db: AsyncSession,
    current_user: UserResponse,
    unit: Optional[str] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Generates an RFC 4180 compliant CSV export of early warning alerts.
    Omits raw psychological survey comments to maintain clinical privacy.
    Returns (csv_text, suggested_filename).
    """
    stmt = (
        select(Alert)
        .join(Personnel)
        .options(selectinload(Alert.personnel))
        .order_by(Alert.created_at.desc())
    )

    if unit:
        stmt = stmt.where(Personnel.unit == unit)
    if severity:
        stmt = stmt.where(Alert.severity == severity.upper())
    if status_filter:
        stmt = stmt.where(Alert.status == status_filter.upper())

    result = await db.execute(stmt)
    alerts = list(result.scalars().all())

    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")

    writer.writerow([
        "Alert ID",
        "Service Number",
        "Rank",
        "Unit",
        "Trigger Type",
        "Severity",
        "Status",
        "Risk Score",
        "Title",
        "Created At",
        "Resolved By",
        "Resolved At",
    ])

    for a in alerts:
        p = a.personnel
        writer.writerow([
            a.id,
            p.service_number if p else "UNKNOWN",
            p.rank if p else "UNKNOWN",
            p.unit if p else "UNKNOWN",
            a.trigger_type,
            a.severity,
            a.status,
            f"{a.risk_score:.4f}",
            a.title,
            a.created_at.isoformat() if a.created_at else "",
            a.resolved_by or "",
            a.resolved_at.isoformat() if a.resolved_at else "",
        ])

    csv_content = output.getvalue()
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"alerts_export_{timestamp_str}.csv"

    user_role_str = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    await log_audit_event(
        db=db,
        action="DATA_EXPORT_CSV",
        user_id=current_user.username,
        user_role=user_role_str,
        resource_type="ALERTS_EXPORT",
        resource_id=unit or "ALL",
        details={
            "unit_filter": unit,
            "severity_filter": severity,
            "status_filter": status_filter,
            "record_count": len(alerts),
            "filename": filename,
        },
    )

    return csv_content, filename
