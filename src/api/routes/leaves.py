from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, require_role
from src.core.database import get_db
from src.schemas.leave import (
    LeaveCreate,
    LeaveListResponse,
    LeaveResponse,
    LeaveUpdate,
)
from src.schemas.user import UserResponse, UserRole
from src.services.leave_service import (
    create_leave_record,
    get_leave_by_id,
    list_leaves,
    update_leave,
)
from src.services.personnel_service import get_personnel_by_id

router = APIRouter(prefix="/leaves", tags=["Leave & Welfare Tracking"])


@router.get(
    "",
    response_model=LeaveListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Leave Records with Filters",
)
async def get_all_leaves(
    personnel_id: Optional[int] = Query(None, description="Filter by personnel ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="PENDING, APPROVED, REJECTED, COMPLETED"),
    leave_type: Optional[str] = Query(None, description="ANNUAL, CASUAL, COMPASSIONATE, MEDICAL"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeaveListResponse:
    """Lists leave requests and approved leaves with pagination."""
    items, total = await list_leaves(
        db,
        personnel_id=personnel_id,
        status=status_filter,
        leave_type=leave_type,
        skip=skip,
        limit=limit,
    )
    return LeaveListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/{leave_id}",
    response_model=LeaveResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Leave Record by ID",
)
async def get_leave(
    leave_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeaveResponse:
    """Retrieves leave record by ID."""
    leave = await get_leave_by_id(db, leave_id)
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave record with ID {leave_id} not found",
        )
    return leave


@router.post(
    "",
    response_model=LeaveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Leave Application",
)
async def submit_leave_application(
    data: LeaveCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeaveResponse:
    """Submits a leave request for personnel."""
    personnel = await get_personnel_by_id(db, data.personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot apply leave: Personnel with ID {data.personnel_id} does not exist",
        )
    return await create_leave_record(db, data)


@router.patch(
    "/{leave_id}",
    response_model=LeaveResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve, Reject, or Modify Leave Status (Commanders & Medical Officers)",
)
async def update_leave_status(
    leave_id: int,
    data: LeaveUpdate,
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> LeaveResponse:
    """
    Updates leave application status (e.g. APPROVED, REJECTED).
    Restricted to authorized officers (`COMMANDER` or `MEDICAL_OFFICER`).
    """
    leave = await update_leave(db, leave_id, data)
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave record with ID {leave_id} not found",
        )
    return leave
