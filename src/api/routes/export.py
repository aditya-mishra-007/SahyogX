from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import require_role
from src.core.database import get_db
from src.schemas.export import UnitExportPayload
from src.schemas.user import UserResponse, UserRole
from src.services.export_service import (
    generate_alerts_csv_export,
    generate_unit_csv_export,
    generate_unit_json_export,
)

router = APIRouter(prefix="/export", tags=["Data Export & Reporting"])

# Data export is strictly reserved for Commander and Medical Officer roles
require_export_authorized = require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)


@router.get(
    "/unit/{unit}/csv",
    status_code=status.HTTP_200_OK,
    summary="Export Tactical Unit Operational & Welfare Records (CSV)",
    response_description="Returns RFC 4180 compliant CSV file attachment with clinical PII redacted.",
)
async def export_unit_csv(
    unit: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(require_export_authorized),
):
    """
    Exports comprehensive operational and stress risk data for an assigned military unit.
    Subjective psychological survey remarks are automatically omitted for privacy compliance.
    """
    csv_content, filename = await generate_unit_csv_export(
        db=db,
        unit=unit,
        current_user=current_user,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
        },
    )


@router.get(
    "/unit/{unit}/json",
    response_model=UnitExportPayload,
    status_code=status.HTTP_200_OK,
    summary="Export Tactical Unit Operational & Welfare Records (JSON)",
    response_description="Returns structured JSON envelope with audit metadata and sanitized personnel records.",
)
async def export_unit_json(
    unit: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(require_export_authorized),
) -> UnitExportPayload:
    """
    Exports structured welfare, deployment, and risk metrics for a tactical battalion.
    Enforces role-based compliance metadata.
    """
    return await generate_unit_json_export(
        db=db,
        unit=unit,
        current_user=current_user,
    )


@router.get(
    "/alerts/csv",
    status_code=status.HTTP_200_OK,
    summary="Export Early Warning Alerts Log (CSV)",
    response_description="Returns RFC 4180 compliant CSV file attachment containing filtered welfare alerts.",
)
async def export_alerts_csv(
    unit: Optional[str] = Query(None, description="Optional unit battalion filter"),
    severity: Optional[str] = Query(None, description="Filter by alert severity (HIGH, CRITICAL)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by alert lifecycle status (NEW, ACKNOWLEDGED, RESOLVED, DISMISSED)"),
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(require_export_authorized),
):
    """
    Exports historical and active Early Warning System (EWS) alerts to CSV.
    Enables offline contingency planning and medical review.
    """
    csv_content, filename = await generate_alerts_csv_export(
        db=db,
        current_user=current_user,
        unit=unit,
        severity=severity,
        status_filter=status_filter,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
        },
    )
