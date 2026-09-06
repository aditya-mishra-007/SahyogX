from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, require_commander
from src.core.database import get_db
from src.schemas.deployment import (
    DeploymentCreate,
    DeploymentListResponse,
    DeploymentResponse,
    DeploymentUpdate,
)
from src.schemas.user import UserResponse
from src.services.deployment_service import (
    create_deployment,
    get_deployment_by_id,
    list_deployments,
    update_deployment,
)
from src.services.personnel_service import get_personnel_by_id

router = APIRouter(prefix="/deployments", tags=["Deployments & Rotations"])


@router.get(
    "",
    response_model=DeploymentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Deployments with Filters",
)
async def get_all_deployments(
    personnel_id: Optional[int] = Query(None, description="Filter by personnel ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="ACTIVE, COMPLETED, TERMINATED"),
    deployment_type: Optional[str] = Query(None, description="HIGH_ALTITUDE, COUNTER_INSURGENCY, etc."),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentListResponse:
    """Lists field deployments and postings history."""
    items, total = await list_deployments(
        db,
        personnel_id=personnel_id,
        status=status_filter,
        deployment_type=deployment_type,
        skip=skip,
        limit=limit,
    )
    return DeploymentListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/{deployment_id}",
    response_model=DeploymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Deployment Details by ID",
)
async def get_deployment(
    deployment_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Retrieves deployment record by primary ID."""
    deployment = await get_deployment_by_id(db, deployment_id)
    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deployment with ID {deployment_id} not found",
        )
    return deployment


@router.post(
    "",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record New Deployment (Commander Only)",
)
async def record_deployment(
    data: DeploymentCreate,
    current_user: UserResponse = Depends(require_commander),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """
    Creates a new field deployment posting for a personnel.
    Restricted to `COMMANDER` role.
    """
    personnel = await get_personnel_by_id(db, data.personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot create deployment: Personnel with ID {data.personnel_id} does not exist",
        )
    return await create_deployment(db, data)


@router.patch(
    "/{deployment_id}",
    response_model=DeploymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Deployment Record (Commander Only)",
)
async def update_deployment_record(
    deployment_id: int,
    data: DeploymentUpdate,
    current_user: UserResponse = Depends(require_commander),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """
    Updates deployment information (e.g. conclusion date, operational status).
    Restricted to `COMMANDER` role.
    """
    deployment = await update_deployment(db, deployment_id, data)
    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deployment with ID {deployment_id} not found",
        )
    return deployment
