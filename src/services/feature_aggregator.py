"""
Feature Aggregator Service for SahyogX Phase 3.

Aggregates domain signals across duty logs, deployment history, leave records,
and wellness surveys into a normalized, ML-ready feature representation.

Feature Documentation:
----------------------
1. service_months:
   - Source: personnel.joining_date
   - Meaning: Total cumulative service tenure in months.

2. recent_duty_hours:
   - Source: duty_logs (past 30 days)
   - Meaning: Sum of hours worked across recent 30-day rolling window.

3. recent_night_duties:
   - Source: duty_logs (past 30 days, night_duty == True)
   - Meaning: Count of overnight sentry/patrol shifts in the last month.

4. recent_max_consecutive_days:
   - Source: duty_logs (past 30 days, consecutive_duty_days)
   - Meaning: Maximum streak of continuous active duty without a 24h rest period.

5. avg_workload_score:
   - Source: duty_logs.workload_score (past 30 days)
   - Meaning: Mean operational workload rating (1.0 to 10.0 scale).

6. has_active_deployment:
   - Source: deployments (status == 'ACTIVE')
   - Meaning: Boolean indicator if soldier is currently deployed in the field.

7. active_deployment_days:
   - Source: deployments.start_date of active deployment
   - Meaning: Elapsed days spent in current operational deployment.

8. active_deployment_intensity:
   - Source: deployments.operational_intensity
   - Meaning: Hardship intensity level (EXTREME, HIGH, MODERATE, LOW, NONE).

9. active_deployment_type:
   - Source: deployments.deployment_type
   - Meaning: Operational theatre classification (HIGH_ALTITUDE, COUNTER_INSURGENCY, etc.).

10. lifetime_hardship_deployments:
    - Source: deployments count
    - Meaning: Lifetime count of high-altitude or counter-insurgency postings.

11. days_since_last_leave:
    - Source: leave_records.end_date (status in ['APPROVED', 'COMPLETED'])
    - Meaning: Days elapsed since returning from last authorized leave.

12. total_leave_days_past_year:
    - Source: leave_records.duration_days (past 365 days)
    - Meaning: Cumulative authorized rest days taken in the preceding year.

13. rejected_leave_requests:
    - Source: leave_records (status == 'REJECTED')
    - Meaning: Count of denied leave applications (stress/welfare risk proxy).

14. latest_stress_score:
    - Source: wellness_surveys.stress_score (most recent)
    - Meaning: Most recently recorded clinical/self-reported stress score (0-10).

15. latest_sleep_quality_score:
    - Source: wellness_surveys.sleep_quality_score (most recent)
    - Meaning: Most recently recorded sleep quality index (0-10, lower = poor).

16. latest_fatigue_score:
    - Source: wellness_surveys.fatigue_score (most recent)
    - Meaning: Most recently recorded exhaustion rating (0-10, higher = exhausted).

17. latest_wellbeing_score:
    - Source: wellness_surveys.wellbeing_score (most recent)
    - Meaning: Subjective welfare/morale score (0-10, lower = distressed).

18. avg_stress_score_past_90d:
    - Source: wellness_surveys.stress_score (past 90 days average)
    - Meaning: 90-day moving average of clinical stress rating.

19. avg_sleep_score_past_90d:
    - Source: wellness_surveys.sleep_quality_score (past 90 days average)
    - Meaning: 90-day moving average of sleep quality rating.

20. flagged_for_counselor:
    - Source: wellness_surveys acute thresholds or severe indicators
    - Meaning: Flag indicating soldier requires urgent medical/counseling review.
"""

from datetime import date, timedelta
from typing import Optional
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.deployment import Deployment
from src.models.duty import DutyLog
from src.models.leave import LeaveRecord
from src.models.personnel import Personnel
from src.models.survey import WellnessSurvey
from src.schemas.prediction import PersonnelStressFeatures


async def aggregate_personnel_features(
    db: AsyncSession,
    personnel_id: int,
    reference_date: Optional[date] = None,
) -> Optional[PersonnelStressFeatures]:
    """
    Extracts, normalizes, and aggregates all domain signals for a personnel member.
    Handles missing histories, zero division, and edge cases safely.
    """
    ref_date = reference_date or date.today()

    # 1. Fetch Personnel
    personnel_stmt = select(Personnel).where(Personnel.id == personnel_id)
    personnel_res = await db.execute(personnel_stmt)
    personnel = personnel_res.scalar_one_or_none()
    if not personnel:
        return None

    # Service tenure
    tenure_days = max((ref_date - personnel.joining_date).days, 0)
    service_months = tenure_days // 30

    # 2. Fetch Duty/Workload Signals (30-day window)
    duty_30d_date = ref_date - timedelta(days=30)
    duty_stmt = select(
        func.coalesce(func.sum(DutyLog.hours_worked), 0.0).label("recent_hours"),
        func.coalesce(func.sum(case((DutyLog.night_duty.is_(True), 1), else_=0)), 0).label("recent_night"),
        func.coalesce(func.max(DutyLog.consecutive_duty_days), 0).label("max_consecutive"),
        func.coalesce(func.avg(DutyLog.workload_score), 5.0).label("avg_workload"),
        func.count(DutyLog.id).label("duty_count"),
    ).where(
        DutyLog.personnel_id == personnel_id,
        DutyLog.duty_date >= duty_30d_date,
        DutyLog.duty_date <= ref_date,
    )
    duty_res = await db.execute(duty_stmt)
    duty_row = duty_res.fetchone()

    recent_duty_hours = round(float(duty_row.recent_hours), 1) if duty_row else 0.0
    recent_night_duties = int(duty_row.recent_night) if duty_row else 0
    recent_max_consecutive = int(duty_row.max_consecutive) if duty_row else 0
    avg_workload = round(float(duty_row.avg_workload), 1) if duty_row and duty_row.duty_count > 0 else 5.0

    # 3. Fetch Deployment Signals
    # Check active deployment
    active_deploy_stmt = (
        select(Deployment)
        .where(
            Deployment.personnel_id == personnel_id,
            Deployment.status == "ACTIVE",
        )
        .order_by(Deployment.start_date.desc())
    )
    active_deploy_res = await db.execute(active_deploy_stmt)
    active_deploy = active_deploy_res.scalars().first()

    has_active_deploy = active_deploy is not None
    active_days = 0
    active_intensity = "NONE"
    active_type = "NONE"
    if active_deploy:
        active_days = max((ref_date - active_deploy.start_date).days, 0)
        active_intensity = active_deploy.operational_intensity
        active_type = active_deploy.deployment_type

    # Lifetime hardship deployments
    hardship_stmt = select(func.count(Deployment.id)).where(
        Deployment.personnel_id == personnel_id,
        (
            Deployment.deployment_type.in_(["HIGH_ALTITUDE", "COUNTER_INSURGENCY"])
            | Deployment.operational_intensity.in_(["HIGH", "EXTREME"])
        ),
    )
    hardship_res = await db.execute(hardship_stmt)
    lifetime_hardship = hardship_res.scalar_one() or 0

    # 4. Fetch Leave & Recovery Signals
    # Days since last approved/completed leave
    last_leave_stmt = (
        select(LeaveRecord.end_date)
        .where(
            LeaveRecord.personnel_id == personnel_id,
            LeaveRecord.status.in_(["APPROVED", "COMPLETED"]),
            LeaveRecord.end_date <= ref_date,
        )
        .order_by(LeaveRecord.end_date.desc())
    )
    last_leave_res = await db.execute(last_leave_stmt)
    last_leave_date = last_leave_res.scalars().first()

    if last_leave_date:
        days_since_last_leave = max((ref_date - last_leave_date).days, 0)
    else:
        # If no approved leave found, proxy by service tenure (capped at 365)
        days_since_last_leave = min(tenure_days, 365)

    # Leave days in past 365 days
    past_year_date = ref_date - timedelta(days=365)
    leave_year_stmt = select(func.coalesce(func.sum(LeaveRecord.duration_days), 0)).where(
        LeaveRecord.personnel_id == personnel_id,
        LeaveRecord.status.in_(["APPROVED", "COMPLETED"]),
        LeaveRecord.start_date >= past_year_date,
        LeaveRecord.start_date <= ref_date,
    )
    leave_year_res = await db.execute(leave_year_stmt)
    total_leave_past_year = int(leave_year_res.scalar_one() or 0)

    # Rejected leave count
    rejected_stmt = select(func.count(LeaveRecord.id)).where(
        LeaveRecord.personnel_id == personnel_id,
        LeaveRecord.status == "REJECTED",
    )
    rejected_res = await db.execute(rejected_stmt)
    rejected_leave_count = int(rejected_res.scalar_one() or 0)

    # 5. Fetch Wellness / Survey Signals
    latest_survey_stmt = (
        select(WellnessSurvey)
        .where(
            WellnessSurvey.personnel_id == personnel_id,
            WellnessSurvey.survey_date <= ref_date,
        )
        .order_by(WellnessSurvey.survey_date.desc(), WellnessSurvey.id.desc())
    )
    latest_survey_res = await db.execute(latest_survey_stmt)
    latest_survey = latest_survey_res.scalars().first()

    has_survey = latest_survey is not None
    latest_stress = latest_survey.stress_score if latest_survey else 5.0
    latest_sleep = latest_survey.sleep_quality_score if latest_survey else 5.0
    latest_fatigue = latest_survey.fatigue_score if latest_survey else 5.0
    latest_wellbeing = latest_survey.wellbeing_score if latest_survey else 5.0

    # 90-day averages
    survey_90d_date = ref_date - timedelta(days=90)
    survey_avg_stmt = select(
        func.coalesce(func.avg(WellnessSurvey.stress_score), 5.0).label("avg_stress"),
        func.coalesce(func.avg(WellnessSurvey.sleep_quality_score), 5.0).label("avg_sleep"),
        func.count(WellnessSurvey.id).label("survey_count"),
    ).where(
        WellnessSurvey.personnel_id == personnel_id,
        WellnessSurvey.survey_date >= survey_90d_date,
        WellnessSurvey.survey_date <= ref_date,
    )
    survey_avg_res = await db.execute(survey_avg_stmt)
    survey_avg_row = survey_avg_res.fetchone()

    avg_stress_90d = round(float(survey_avg_row.avg_stress), 1) if survey_avg_row and survey_avg_row.survey_count > 0 else latest_stress
    avg_sleep_90d = round(float(survey_avg_row.avg_sleep), 1) if survey_avg_row and survey_avg_row.survey_count > 0 else latest_sleep

    # Counselor flag criteria: severe stress (>=8), acute fatigue (>=8.5), or critical sleep/wellbeing (<=2.5)
    flagged = False
    if latest_survey:
        if (
            latest_survey.stress_score >= 8.0
            or latest_survey.fatigue_score >= 8.5
            or latest_survey.sleep_quality_score <= 2.5
            or latest_survey.wellbeing_score <= 2.5
        ):
            flagged = True

    return PersonnelStressFeatures(
        personnel_id=personnel.id,
        service_number=personnel.service_number,
        service_months=service_months,
        recent_duty_hours=recent_duty_hours,
        recent_night_duties=recent_night_duties,
        recent_max_consecutive_days=recent_max_consecutive,
        avg_workload_score=avg_workload,
        has_active_deployment=has_active_deploy,
        active_deployment_days=active_days,
        active_deployment_intensity=active_intensity,
        active_deployment_type=active_type,
        lifetime_hardship_deployments=lifetime_hardship,
        days_since_last_leave=days_since_last_leave,
        total_leave_days_past_year=total_leave_past_year,
        rejected_leave_requests=rejected_leave_count,
        has_survey_data=has_survey,
        latest_stress_score=latest_stress,
        latest_sleep_quality_score=latest_sleep,
        latest_fatigue_score=latest_fatigue,
        latest_wellbeing_score=latest_wellbeing,
        avg_stress_score_past_90d=avg_stress_90d,
        avg_sleep_score_past_90d=avg_sleep_90d,
        flagged_for_counselor=flagged,
    )
