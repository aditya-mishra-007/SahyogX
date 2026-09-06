from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.survey import WellnessSurvey
from src.schemas.survey import SurveyAggregationResponse, SurveyCreate, SurveyUpdate


async def create_survey(db: AsyncSession, data: SurveyCreate) -> WellnessSurvey:
    """Creates a new wellness survey submission."""
    survey = WellnessSurvey(
        personnel_id=data.personnel_id,
        survey_date=data.survey_date,
        stress_score=round(data.stress_score, 1),
        sleep_quality_score=round(data.sleep_quality_score, 1),
        fatigue_score=round(data.fatigue_score, 1),
        wellbeing_score=round(data.wellbeing_score, 1),
        notes=data.notes.strip() if data.notes else None,
    )
    db.add(survey)
    await db.commit()
    await db.refresh(survey)
    return survey


async def get_survey_by_id(
    db: AsyncSession, survey_id: int
) -> Optional[WellnessSurvey]:
    """Retrieves a wellness survey by ID."""
    stmt = select(WellnessSurvey).where(WellnessSurvey.id == survey_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_surveys(
    db: AsyncSession,
    personnel_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[WellnessSurvey], int]:
    """Retrieves paginated survey history."""
    query = select(WellnessSurvey)
    count_query = select(func.count(WellnessSurvey.id))

    if personnel_id:
        query = query.where(WellnessSurvey.personnel_id == personnel_id)
        count_query = count_query.where(WellnessSurvey.personnel_id == personnel_id)
    if start_date:
        query = query.where(WellnessSurvey.survey_date >= start_date)
        count_query = count_query.where(WellnessSurvey.survey_date >= start_date)
    if end_date:
        query = query.where(WellnessSurvey.survey_date <= end_date)
        count_query = count_query.where(WellnessSurvey.survey_date <= end_date)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(WellnessSurvey.survey_date.desc(), WellnessSurvey.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def update_survey(
    db: AsyncSession, survey_id: int, data: SurveyUpdate
) -> Optional[WellnessSurvey]:
    """Updates an existing survey entry."""
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            if isinstance(val, (int, float)):
                setattr(survey, field, round(float(val), 1))
            elif isinstance(val, str):
                setattr(survey, field, val.strip())
            else:
                setattr(survey, field, val)

    await db.commit()
    await db.refresh(survey)
    return survey


async def get_survey_summary(
    db: AsyncSession, personnel_id: int
) -> SurveyAggregationResponse:
    """
    Computes statistical stress and welfare aggregations for a personnel.
    Calculates qualitative stress risk indicator (LOW, MODERATE, HIGH, CRITICAL).
    """
    stmt = select(
        func.count(WellnessSurvey.id).label("total"),
        func.coalesce(func.avg(WellnessSurvey.stress_score), 0.0).label("avg_stress"),
        func.coalesce(func.avg(WellnessSurvey.sleep_quality_score), 0.0).label(
            "avg_sleep"
        ),
        func.coalesce(func.avg(WellnessSurvey.fatigue_score), 0.0).label(
            "avg_fatigue"
        ),
        func.coalesce(func.avg(WellnessSurvey.wellbeing_score), 0.0).label(
            "avg_wellbeing"
        ),
        func.max(WellnessSurvey.survey_date).label("latest_date"),
    ).where(WellnessSurvey.personnel_id == personnel_id)

    result = await db.execute(stmt)
    row = result.fetchone()

    total = row.total if row else 0
    avg_stress = round(float(row.avg_stress), 1) if row else 0.0
    avg_sleep = round(float(row.avg_sleep), 1) if row else 0.0
    avg_fatigue = round(float(row.avg_fatigue), 1) if row else 0.0
    avg_wellbeing = round(float(row.avg_wellbeing), 1) if row else 0.0
    latest_date = row.latest_date if row else None

    # Derive qualitative risk indicator
    if total == 0:
        indicator = "LOW"
    elif avg_stress >= 7.5 or avg_fatigue >= 8.0:
        indicator = "CRITICAL"
    elif avg_stress >= 6.0 or avg_fatigue >= 6.5 or avg_sleep <= 4.0:
        indicator = "HIGH"
    elif avg_stress >= 4.0 or avg_sleep <= 6.0:
        indicator = "MODERATE"
    else:
        indicator = "LOW"

    return SurveyAggregationResponse(
        personnel_id=personnel_id,
        total_surveys=total,
        average_stress_score=avg_stress,
        average_sleep_quality_score=avg_sleep,
        average_fatigue_score=avg_fatigue,
        average_wellbeing_score=avg_wellbeing,
        latest_survey_date=latest_date,
        stress_risk_indicator=indicator,
    )
