from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.personnel import Personnel
from src.schemas.personnel import PersonnelCreate, PersonnelUpdate


async def create_personnel(db: AsyncSession, data: PersonnelCreate) -> Personnel:
    """Creates and persists a new personnel record."""
    personnel = Personnel(
        service_number=data.service_number.strip().upper(),
        name=data.name.strip(),
        rank=data.rank.strip(),
        role=data.role.strip(),
        unit=data.unit.strip(),
        joining_date=data.joining_date,
        status=data.status.strip().upper(),
        contact_email=data.contact_email.strip() if data.contact_email else None,
        emergency_contact=data.emergency_contact.strip() if data.emergency_contact else None,
    )
    db.add(personnel)
    await db.commit()
    await db.refresh(personnel)
    return personnel


async def get_personnel_by_id(db: AsyncSession, personnel_id: int) -> Optional[Personnel]:
    """Retrieves personnel record by internal primary key."""
    stmt = select(Personnel).where(Personnel.id == personnel_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_personnel_by_service_number(
    db: AsyncSession, service_number: str
) -> Optional[Personnel]:
    """Retrieves personnel by unique military service number."""
    stmt = select(Personnel).where(
        Personnel.service_number == service_number.strip().upper()
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_personnel(
    db: AsyncSession,
    unit: Optional[str] = None,
    rank: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Personnel], int]:
    """
    Returns filtered and paginated personnel list along with total matching count.
    """
    query = select(Personnel)
    count_query = select(func.count(Personnel.id))

    if unit:
        query = query.where(Personnel.unit.ilike(f"%{unit.strip()}%"))
        count_query = count_query.where(Personnel.unit.ilike(f"%{unit.strip()}%"))
    if rank:
        query = query.where(Personnel.rank.ilike(f"%{rank.strip()}%"))
        count_query = count_query.where(Personnel.rank.ilike(f"%{rank.strip()}%"))
    if status:
        query = query.where(Personnel.status == status.strip().upper())
        count_query = count_query.where(Personnel.status == status.strip().upper())

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Personnel.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def update_personnel(
    db: AsyncSession, personnel_id: int, data: PersonnelUpdate
) -> Optional[Personnel]:
    """Updates selected fields of an existing personnel record."""
    personnel = await get_personnel_by_id(db, personnel_id)
    if not personnel:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            if isinstance(val, str):
                setattr(personnel, field, val.strip())
            else:
                setattr(personnel, field, val)

    await db.commit()
    await db.refresh(personnel)
    return personnel


async def deactivate_personnel(
    db: AsyncSession, personnel_id: int
) -> Optional[Personnel]:
    """Marks a personnel status as INACTIVE."""
    personnel = await get_personnel_by_id(db, personnel_id)
    if not personnel:
        return None

    personnel.status = "INACTIVE"
    await db.commit()
    await db.refresh(personnel)
    return personnel
