from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.duty import DutyLog
from src.schemas.duty import DutyCreate, DutyUpdate, DutyWorkloadSummary


async def create_duty_log(db: AsyncSession, data: DutyCreate) -> DutyLog:
    """Logs a duty shift for a personnel."""
    duty = DutyLog(
        personnel_id=data.personnel_id,
        duty_date=data.duty_date,
        duty_type=data.duty_type.strip().upper(),
        hours_worked=round(data.hours_worked, 1),
        night_duty=data.night_duty,
        consecutive_duty_days=data.consecutive_duty_days,
        workload_score=round(data.workload_score, 1),
    )
    db.add(duty)
    await db.commit()
    await db.refresh(duty)
    return duty


async def get_duty_log_by_id(db: AsyncSession, duty_id: int) -> Optional[DutyLog]:
    """Retrieves a duty log by ID."""
    stmt = select(DutyLog).where(DutyLog.id == duty_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_duty_logs(
    db: AsyncSession,
    personnel_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    duty_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[DutyLog], int]:
    """Retrieves paginated duty records with optional filtering."""
    query = select(DutyLog)
    count_query = select(func.count(DutyLog.id))

    if personnel_id:
        query = query.where(DutyLog.personnel_id == personnel_id)
        count_query = count_query.where(DutyLog.personnel_id == personnel_id)
    if start_date:
        query = query.where(DutyLog.duty_date >= start_date)
        count_query = count_query.where(DutyLog.duty_date >= start_date)
    if end_date:
        query = query.where(DutyLog.duty_date <= end_date)
        count_query = count_query.where(DutyLog.duty_date <= end_date)
    if duty_type:
        query = query.where(DutyLog.duty_type == duty_type.strip().upper())
        count_query = count_query.where(DutyLog.duty_type == duty_type.strip().upper())

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(DutyLog.duty_date.desc(), DutyLog.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def update_duty_log(
    db: AsyncSession, duty_id: int, data: DutyUpdate
) -> Optional[DutyLog]:
    """Updates an existing duty log."""
    duty = await get_duty_log_by_id(db, duty_id)
    if not duty:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            if isinstance(val, str):
                setattr(duty, field, val.strip().upper())
            else:
                setattr(duty, field, val)

    await db.commit()
    await db.refresh(duty)
    return duty


async def get_workload_summary(
    db: AsyncSession, personnel_id: int
) -> DutyWorkloadSummary:
    """
    Computes statistical operational workload metrics for a specific personnel.
    Aggregates cumulative hours, night shifts, and maximum consecutive duty stress.
    """
    stmt = select(
        func.count(DutyLog.id).label("total_records"),
        func.coalesce(func.sum(DutyLog.hours_worked), 0.0).label("total_hours"),
        func.coalesce(func.sum(case((DutyLog.night_duty.is_(True), 1), else_=0)), 0).label(
            "total_night_duties"
        ),
        func.coalesce(func.avg(DutyLog.hours_worked), 0.0).label("avg_hours"),
        func.coalesce(func.avg(DutyLog.workload_score), 0.0).label("avg_workload"),
        func.coalesce(func.max(DutyLog.consecutive_duty_days), 0).label(
            "max_consecutive"
        ),
    ).where(DutyLog.personnel_id == personnel_id)

    result = await db.execute(stmt)
    row = result.fetchone()

    total_records = row.total_records if row else 0
    total_hours = float(row.total_hours) if row else 0.0
    total_night_duties = int(row.total_night_duties) if row else 0
    avg_hours = round(float(row.avg_hours), 1) if row else 0.0
    avg_workload = round(float(row.avg_workload), 1) if row else 0.0
    max_consecutive = int(row.max_consecutive) if row else 0

    return DutyWorkloadSummary(
        personnel_id=personnel_id,
        total_duty_records=total_records,
        total_hours_worked=round(total_hours, 1),
        total_night_duties=total_night_duties,
        average_hours_per_duty=avg_hours,
        average_workload_score=avg_workload,
        max_consecutive_duty_days=max_consecutive,
    )
