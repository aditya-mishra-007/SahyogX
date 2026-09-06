from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.deployment import Deployment
from src.schemas.deployment import DeploymentCreate, DeploymentUpdate


async def create_deployment(db: AsyncSession, data: DeploymentCreate) -> Deployment:
    """Creates a deployment history record for a personnel."""
    deployment = Deployment(
        personnel_id=data.personnel_id,
        location=data.location.strip(),
        deployment_type=data.deployment_type.strip().upper(),
        start_date=data.start_date,
        end_date=data.end_date,
        operational_intensity=data.operational_intensity.strip().upper(),
        status=data.status.strip().upper(),
        notes=data.notes.strip() if data.notes else None,
    )
    db.add(deployment)
    await db.commit()
    await db.refresh(deployment)
    return deployment


async def get_deployment_by_id(
    db: AsyncSession, deployment_id: int
) -> Optional[Deployment]:
    """Retrieves deployment record by ID."""
    stmt = select(Deployment).where(Deployment.id == deployment_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_deployments(
    db: AsyncSession,
    personnel_id: Optional[int] = None,
    status: Optional[str] = None,
    deployment_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Deployment], int]:
    """Lists filtered deployments with pagination and total count."""
    query = select(Deployment)
    count_query = select(func.count(Deployment.id))

    if personnel_id:
        query = query.where(Deployment.personnel_id == personnel_id)
        count_query = count_query.where(Deployment.personnel_id == personnel_id)
    if status:
        query = query.where(Deployment.status == status.strip().upper())
        count_query = count_query.where(Deployment.status == status.strip().upper())
    if deployment_type:
        query = query.where(Deployment.deployment_type == deployment_type.strip().upper())
        count_query = count_query.where(Deployment.deployment_type == deployment_type.strip().upper())

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Deployment.start_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def update_deployment(
    db: AsyncSession, deployment_id: int, data: DeploymentUpdate
) -> Optional[Deployment]:
    """Updates selected deployment details."""
    deployment = await get_deployment_by_id(db, deployment_id)
    if not deployment:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            if isinstance(val, str):
                setattr(deployment, field, val.strip())
            else:
                setattr(deployment, field, val)

    await db.commit()
    await db.refresh(deployment)
    return deployment
