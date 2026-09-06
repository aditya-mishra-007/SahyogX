from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import require_commander
from src.core.database import get_db
from src.schemas.audit import AuditLogListResponse, AuditLogResponse
from src.schemas.user import UserResponse
from src.services.audit_service import list_audit_logs

router = APIRouter(prefix="/audit", tags=["Security & Audit"])


@router.get(
    "/logs",
    response_model=AuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="Query Immutable Security & Operational Audit Trail",
    response_description="Returns paginated and filtered audit events. Restricted to Commander role.",
)
async def get_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by executing username or subject"),
    action: Optional[str] = Query(None, description="Filter by audited action type (e.g. LOGIN_SUCCESS, DATA_EXPORT_CSV)"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type (e.g. PERSONNEL, ALERTS_EXPORT)"),
    start_time: Optional[datetime] = Query(None, description="Filter records on or after UTC timestamp"),
    end_time: Optional[datetime] = Query(None, description="Filter records on or before UTC timestamp"),
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page (max 200)"),
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(require_commander),
) -> AuditLogListResponse:
    """
    Retrieves chronological, append-only security logs for forensic analysis,
    monitoring administrative interventions, and export tracking.
    Enforces strict Commander role authorization.
    """
    total, items = await list_audit_logs(
        db=db,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
    )

    return AuditLogListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[AuditLogResponse.model_validate(item) for item in items],
    )
