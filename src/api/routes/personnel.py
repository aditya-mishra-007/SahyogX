from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, require_commander, require_officer_or_commander
from src.core.database import get_db
from src.schemas.personnel import (
    PersonnelCreate,
    PersonnelListResponse,
    PersonnelResponse,
    PersonnelUpdate,
)
from src.schemas.user import UserResponse
from src.services.personnel_service import (
    create_personnel,
    deactivate_personnel,
    get_personnel_by_id,
    get_personnel_by_service_number,
    list_personnel,
    update_personnel,
)

router = APIRouter(prefix="/personnel", tags=["Personnel Management"])


@router.get(
    "",
    response_model=PersonnelListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Personnel with Filtering & Pagination",
)
async def get_all_personnel(
    unit: Optional[str] = Query(None, description="Filter by unit / battalion name"),
    rank: Optional[str] = Query(None, description="Filter by military rank"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0, description="Offset index for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Number of records per page"),
    current_user: UserResponse = Depends(require_officer_or_commander),
    db: AsyncSession = Depends(get_db),
) -> PersonnelListResponse:
    """
    Returns paginated list of personnel.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`** — PERSONNEL role cannot enumerate other soldiers.
    """
    items, total = await list_personnel(
        db, unit=unit, rank=rank, status=status_filter, skip=skip, limit=limit
    )
    return PersonnelListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/{personnel_id}",
    response_model=PersonnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Personnel Details by ID",
)
async def get_personnel(
    personnel_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonnelResponse:
    """Retrieves full personnel details by primary ID."""
    personnel = await get_personnel_by_id(db, personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with ID {personnel_id} not found",
        )
    return personnel


@router.post(
    "",
    response_model=PersonnelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Personnel (Commander Only)",
)
async def register_personnel(
    data: PersonnelCreate,
    current_user: UserResponse = Depends(require_commander),
    db: AsyncSession = Depends(get_db),
) -> PersonnelResponse:
    """
    Registers a new uniformed personnel member.
    Restricted to users possessing `COMMANDER` role.
    """
    existing = await get_personnel_by_service_number(db, data.service_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Personnel with service number '{data.service_number.upper()}' already exists",
        )
    return await create_personnel(db, data)


@router.patch(
    "/{personnel_id}",
    response_model=PersonnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Personnel Record (Commander Only)",
)
async def update_personnel_record(
    personnel_id: int,
    data: PersonnelUpdate,
    current_user: UserResponse = Depends(require_commander),
    db: AsyncSession = Depends(get_db),
) -> PersonnelResponse:
    """
    Updates specified fields of an existing personnel profile.
    Restricted to users possessing `COMMANDER` role.
    """
    personnel = await update_personnel(db, personnel_id, data)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with ID {personnel_id} not found",
        )
    return personnel


@router.delete(
    "/{personnel_id}",
    status_code=status.HTTP_200_OK,
    summary="Deactivate Personnel (Commander Only)",
)
async def deactivate_personnel_record(
    personnel_id: int,
    current_user: UserResponse = Depends(require_commander),
    db: AsyncSession = Depends(get_db),
):
    """
    Marks personnel status as INACTIVE.
    Restricted to users possessing `COMMANDER` role.
    """
    personnel = await deactivate_personnel(db, personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with ID {personnel_id} not found",
        )
    return {
        "message": "Personnel deactivated successfully",
        "personnel_id": personnel_id,
        "status": personnel.status,
    }
