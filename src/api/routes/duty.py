from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.core.database import get_db
from src.schemas.duty import (
    DutyCreate,
    DutyListResponse,
    DutyResponse,
    DutyUpdate,
    DutyWorkloadSummary,
)
from src.schemas.user import UserResponse
from src.services.duty_service import (
    create_duty_log,
    get_duty_log_by_id,
    get_workload_summary,
    list_duty_logs,
    update_duty_log,
)
from src.services.personnel_service import get_personnel_by_id

router = APIRouter(prefix="/duty", tags=["Duty & Workload Monitoring"])


@router.get(
    "",
    response_model=DutyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Duty Logs with Filters",
)
async def get_all_duty_logs(
    personnel_id: Optional[int] = Query(None, description="Filter by personnel ID"),
    start_date: Optional[date] = Query(None, description="Filter shifts on or after date"),
    end_date: Optional[date] = Query(None, description="Filter shifts on or before date"),
    duty_type: Optional[str] = Query(None, description="Filter by shift duty type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DutyListResponse:
    """Retrieves paginated duty shifts with optional date and duty-type filters."""
    items, total = await list_duty_logs(
        db,
        personnel_id=personnel_id,
        start_date=start_date,
        end_date=end_date,
        duty_type=duty_type,
        skip=skip,
        limit=limit,
    )
    return DutyListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/personnel/{personnel_id}/summary",
    response_model=DutyWorkloadSummary,
    status_code=status.HTTP_200_OK,
    summary="Get Workload Statistics for Personnel",
)
async def get_personnel_workload_summary(
    personnel_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DutyWorkloadSummary:
    """
    Computes statistical workload strain, cumulative hours, and night shifts
    for a specific personnel.
    """
    personnel = await get_personnel_by_id(db, personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with ID {personnel_id} not found",
        )
    return await get_workload_summary(db, personnel_id)


@router.get(
    "/{duty_id}",
    response_model=DutyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Duty Log by ID",
)
async def get_duty_log(
    duty_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DutyResponse:
    """Retrieves specific duty log by primary ID."""
    duty = await get_duty_log_by_id(db, duty_id)
    if not duty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Duty record with ID {duty_id} not found",
        )
    return duty


@router.post(
    "",
    response_model=DutyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log Duty Shift",
)
async def log_duty_shift(
    data: DutyCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DutyResponse:
    """Logs a duty shift record for a personnel."""
    personnel = await get_personnel_by_id(db, data.personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot log duty: Personnel with ID {data.personnel_id} does not exist",
        )
    return await create_duty_log(db, data)


@router.patch(
    "/{duty_id}",
    response_model=DutyResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Duty Log",
)
async def update_duty_record(
    duty_id: int,
    data: DutyUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DutyResponse:
    """Modifies duty shift details."""
    duty = await update_duty_log(db, duty_id, data)
    if not duty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Duty record with ID {duty_id} not found",
        )
    return duty
