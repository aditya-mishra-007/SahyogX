from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.leave import LeaveRecord
from src.schemas.leave import LeaveCreate, LeaveUpdate


async def create_leave_record(db: AsyncSession, data: LeaveCreate) -> LeaveRecord:
    """Creates and persists a new leave application or record."""
    duration = data.duration_days
    if duration is None:
        duration = (data.end_date - data.start_date).days + 1

    leave = LeaveRecord(
        personnel_id=data.personnel_id,
        leave_type=data.leave_type.strip().upper(),
        start_date=data.start_date,
        end_date=data.end_date,
        duration_days=duration,
        status=data.status.strip().upper(),
        reason=data.reason.strip() if data.reason else None,
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    return leave


async def get_leave_by_id(db: AsyncSession, leave_id: int) -> Optional[LeaveRecord]:
    """Retrieves leave record by ID."""
    stmt = select(LeaveRecord).where(LeaveRecord.id == leave_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_leaves(
    db: AsyncSession,
    personnel_id: Optional[int] = None,
    status: Optional[str] = None,
    leave_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[LeaveRecord], int]:
    """Retrieves filtered and paginated leave history."""
    query = select(LeaveRecord)
    count_query = select(func.count(LeaveRecord.id))

    if personnel_id:
        query = query.where(LeaveRecord.personnel_id == personnel_id)
        count_query = count_query.where(LeaveRecord.personnel_id == personnel_id)
    if status:
        query = query.where(LeaveRecord.status == status.strip().upper())
        count_query = count_query.where(LeaveRecord.status == status.strip().upper())
    if leave_type:
        query = query.where(LeaveRecord.leave_type == leave_type.strip().upper())
        count_query = count_query.where(LeaveRecord.leave_type == leave_type.strip().upper())

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(LeaveRecord.start_date.desc(), LeaveRecord.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def update_leave(
    db: AsyncSession, leave_id: int, data: LeaveUpdate
) -> Optional[LeaveRecord]:
    """Updates leave record status or parameters."""
    leave = await get_leave_by_id(db, leave_id)
    if not leave:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            if field in ("leave_type", "status") and isinstance(val, str):
                setattr(leave, field, val.strip().upper())
            elif isinstance(val, str):
                setattr(leave, field, val.strip())
            else:
                setattr(leave, field, val)

    # Recalculate duration if dates were modified but duration was not explicitly sent
    if "duration_days" not in update_dict and (
        "start_date" in update_dict or "end_date" in update_dict
    ):
        leave.duration_days = (leave.end_date - leave.start_date).days + 1

    await db.commit()
    await db.refresh(leave)
    return leave
