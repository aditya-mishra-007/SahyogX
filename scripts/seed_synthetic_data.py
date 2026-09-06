"""
SahyogX - Synthetic Personnel Welfare Data Generator
=====================================================
Generates realistic, defense-oriented, but 100% FICTIONAL and SYNTHETIC datasets
for testing and machine learning model baseline calibration.

NO REAL PERSONNEL, MILITARY SERVICE NUMBERS, OR PII ARE USED.

Scenarios Modeled:
1. Normal / Balanced Operational Profile (Low Stress, Regular Rest)
2. High Workload & Circadian Disruption (Chronic Night Shifts, Sleep Debt)
3. Long Hardship / High-Altitude Deployment (Extreme Climate, Leave Deficit)
4. Compassionate / Medical Recovery Profile (Post-deployment rehabilitation)

Usage:
    python -m scripts.seed_synthetic_data
"""

import asyncio
import logging
import random
from datetime import date, timedelta
from sqlalchemy import text
from src.core.database import AsyncSessionLocal, engine
from src.models.personnel import Personnel
from src.models.deployment import Deployment
from src.models.duty import DutyLog
from src.models.leave import LeaveRecord
from src.models.survey import WellnessSurvey

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger("seed_synthetic_data")

# --------------------------------------------------------------------------
# Synthetic Military Templates (100% Fictional / Demo Only)
# --------------------------------------------------------------------------
SYNTHETIC_NAMES = [
    "Rajesh Kumar", "Vikram Rathore", "Gurpreet Singh", "Arun Nair",
    "Manoj Thapa", "Amitabh Sen", "Kuldeep Yadav", "Dinesh Rawat",
    "Suraj Patil", "Jaswinder Sandhu", "Pradeep Joshi", "Karthik Pillai",
    "Suresh Negi", "Balwant Chahar", "Mohit Bhatt", "Harish Meena",
    "Ravindra Jadeja", "Devendra Chauhan", "Tarun Goswami", "Anand Swamy",
    "Bhupinder Pal", "Naveen Choudhary", "Ravi Shankar", "Mahesh Subba",
    "Lalit Tamang"
]

RANKS = [
    ("Sepoy", "Infantry"),
    ("Rifleman", "Infantry"),
    ("Naik", "Infantry"),
    ("Havildar", "Signals"),
    ("Naib Subedar", "Artillery"),
    ("Subedar", "Infantry"),
    ("Lieutenant", "Armoured"),
    ("Captain", "Medical Corps"),
    ("Major", "Signals"),
]

UNITS = [
    "14 Rajputana Rifles",
    "8 Sikh Light Infantry",
    "3 Ladakh Scouts",
    "9 Para (Special Forces)",
    "26 Air Defence Regiment",
    "17 Kumaon Regiment",
]

DEPLOYMENT_LOCATIONS = [
    ("Siachen Glacier - Sector 2", "HIGH_ALTITUDE", "EXTREME"),
    ("Dras Sub-sector", "HIGH_ALTITUDE", "HIGH"),
    ("Kupwara Counter-Insurgency Sector", "COUNTER_INSURGENCY", "HIGH"),
    ("Uri Forward Post", "BORDER_OUTPOST", "HIGH"),
    ("Thar Desert Sector", "BORDER_OUTPOST", "MODERATE"),
    ("Ranikhet Cantonment", "PEACE_STATION", "LOW"),
    ("Chandimandir Military Station", "PEACE_STATION", "LOW"),
]

DUTY_TYPES = [
    "SENTRY", "COMBAT_PATROL", "CONVOY_ESCORT", "NIGHT_GUARD", "ADMINISTRATIVE"
]


async def clean_existing_synthetic_data(session):
    """Deletes existing records to make seeding idempotent."""
    logger.info("Purging any existing records before seeding...")
    await session.execute(text("DELETE FROM wellness_surveys;"))
    await session.execute(text("DELETE FROM leave_records;"))
    await session.execute(text("DELETE FROM duty_logs;"))
    await session.execute(text("DELETE FROM deployments;"))
    await session.execute(text("DELETE FROM personnel;"))
    await session.commit()
    logger.info("Existing database tables cleared.")


async def generate_synthetic_dataset():
    """Generates 25 synthetic personnel with 90 days of duty, leaves, and surveys."""
    today = date.today()

    async with AsyncSessionLocal() as session:
        await clean_existing_synthetic_data(session)

        total_personnel = 0
        total_deployments = 0
        total_duties = 0
        total_leaves = 0
        total_surveys = 0

        logger.info(f"Generating {len(SYNTHETIC_NAMES)} synthetic personnel profiles...")

        for idx, name in enumerate(SYNTHETIC_NAMES, start=1):
            service_num = f"SX-{10000 + idx}"
            rank, role = random.choice(RANKS)
            unit = random.choice(UNITS)
            joining_date = today - timedelta(days=random.randint(700, 3650))

            # Assign cohort scenario
            # 0: Normal / Healthy (40%)
            # 1: High Workload / Night Shifts (25%)
            # 2: Long Hardship Deployment / Leave Deficit (25%)
            # 3: Recovery / Rehabilitation (10%)
            cohort_type = idx % 4

            personnel = Personnel(
                service_number=service_num,
                name=f"{rank} {name} (Demo)",
                rank=rank,
                role=role,
                unit=unit,
                joining_date=joining_date,
                status="ACTIVE",
                contact_email=f"synth.{name.lower().replace(' ', '.')}.{idx}@sahyogx.internal",
                emergency_contact=f"Next-of-Kin (Synthetic Contact {idx})",
            )
            session.add(personnel)
            await session.flush()
            total_personnel += 1

            # ------------------------------------------------------------------
            # 1. Deployment History
            # ------------------------------------------------------------------
            if cohort_type == 2:
                # High altitude hardship posting
                dep_loc, dep_type, intensity = DEPLOYMENT_LOCATIONS[0]  # Siachen
                dep_start = today - timedelta(days=210)
                dep = Deployment(
                    personnel_id=personnel.id,
                    location=dep_loc,
                    deployment_type=dep_type,
                    start_date=dep_start,
                    end_date=None,  # ongoing
                    operational_intensity=intensity,
                    status="ACTIVE",
                    notes="Synthetic high-altitude glacial sector rotation > 180 days.",
                )
            elif cohort_type == 1:
                # Active counter-insurgency
                dep_loc, dep_type, intensity = DEPLOYMENT_LOCATIONS[2]  # Kupwara
                dep_start = today - timedelta(days=120)
                dep = Deployment(
                    personnel_id=personnel.id,
                    location=dep_loc,
                    deployment_type=dep_type,
                    start_date=dep_start,
                    end_date=None,
                    operational_intensity=intensity,
                    status="ACTIVE",
                    notes="Synthetic continuous tactical patrols and road-opening operations.",
                )
            elif cohort_type == 3:
                # Peace station recovery after field
                dep_loc, dep_type, intensity = DEPLOYMENT_LOCATIONS[5]  # Ranikhet
                dep = Deployment(
                    personnel_id=personnel.id,
                    location=dep_loc,
                    deployment_type=dep_type,
                    start_date=today - timedelta(days=60),
                    end_date=None,
                    operational_intensity=intensity,
                    status="ACTIVE",
                    notes="Synthetic routine cantonment duties and physical conditioning.",
                )
            else:
                # Normal operational rotation
                loc = random.choice(DEPLOYMENT_LOCATIONS)
                dep = Deployment(
                    personnel_id=personnel.id,
                    location=loc[0],
                    deployment_type=loc[1],
                    start_date=today - timedelta(days=180),
                    end_date=today - timedelta(days=30),
                    operational_intensity=loc[2],
                    status="COMPLETED",
                    notes="Synthetic completed routine patrol deployment.",
                )

            session.add(dep)
            total_deployments += 1

            # ------------------------------------------------------------------
            # 2. Daily Duty Logs (Past 30 Days)
            # ------------------------------------------------------------------
            consecutive_count = 1
            for day_offset in range(30, 0, -1):
                duty_day = today - timedelta(days=day_offset)

                if cohort_type == 1:
                    # High night duty & fatigue scenario
                    is_night = random.random() < 0.75
                    hours = random.choice([10.0, 12.0, 14.0])
                    consecutive_count += 1
                    workload = round(random.uniform(7.5, 9.8), 1)
                    dtype = "NIGHT_GUARD" if is_night else "COMBAT_PATROL"
                elif cohort_type == 2:
                    # Extreme hardship & exposure
                    is_night = random.random() < 0.50
                    hours = random.choice([8.0, 10.0, 12.0])
                    consecutive_count += 1
                    workload = round(random.uniform(7.0, 9.2), 1)
                    dtype = "SENTRY"
                elif cohort_type == 3:
                    # Peace / light duties
                    is_night = False
                    hours = 6.0
                    consecutive_count = max(1, consecutive_count - 1)
                    workload = round(random.uniform(2.0, 4.0), 1)
                    dtype = "ADMINISTRATIVE"
                else:
                    # Normal / Balanced
                    is_night = random.random() < 0.20
                    hours = 8.0
                    consecutive_count = random.randint(1, 4)
                    workload = round(random.uniform(3.5, 6.0), 1)
                    dtype = random.choice(DUTY_TYPES)

                duty_log = DutyLog(
                    personnel_id=personnel.id,
                    duty_date=duty_day,
                    duty_type=dtype,
                    hours_worked=hours,
                    night_duty=is_night,
                    consecutive_duty_days=consecutive_count,
                    workload_score=workload,
                )
                session.add(duty_log)
                total_duties += 1

            # ------------------------------------------------------------------
            # 3. Leave Records
            # ------------------------------------------------------------------
            if cohort_type == 2:
                # Hardship scenario with rejected / delayed leave
                leave1 = LeaveRecord(
                    personnel_id=personnel.id,
                    leave_type="ANNUAL",
                    start_date=today - timedelta(days=45),
                    end_date=today - timedelta(days=31),
                    duration_days=15,
                    status="REJECTED",
                    reason="Synthetic: Leave deferred due to critical post operational readiness.",
                )
                session.add(leave1)
                total_leaves += 1
            elif cohort_type == 0:
                # Normal leave approved
                leave1 = LeaveRecord(
                    personnel_id=personnel.id,
                    leave_type="ANNUAL",
                    start_date=today - timedelta(days=90),
                    end_date=today - timedelta(days=70),
                    duration_days=21,
                    status="COMPLETED",
                    reason="Synthetic: Annual family welfare leave taken successfully.",
                )
                session.add(leave1)
                total_leaves += 1
            else:
                leave1 = LeaveRecord(
                    personnel_id=personnel.id,
                    leave_type="CASUAL",
                    start_date=today - timedelta(days=120),
                    end_date=today - timedelta(days=113),
                    duration_days=8,
                    status="COMPLETED",
                    reason="Synthetic: Routine home visit leave.",
                )
                session.add(leave1)
                total_leaves += 1

            # ------------------------------------------------------------------
            # 4. Wellness Surveys (Weekly Screening across Past 60 Days)
            # ------------------------------------------------------------------
            for s_idx in range(6, 0, -1):
                survey_date = today - timedelta(days=s_idx * 10)

                if cohort_type == 2:
                    # High stress, poor sleep, extreme fatigue
                    stress = round(random.uniform(7.8, 9.5), 1)
                    sleep = round(random.uniform(2.0, 3.8), 1)
                    fatigue = round(random.uniform(8.0, 9.8), 1)
                    wellbeing = round(random.uniform(1.5, 3.5), 1)
                    notes = "Synthetic clinical report: High altitude sleep hypopnea and fatigue observed."
                elif cohort_type == 1:
                    # Elevated stress & sleep disruption
                    stress = round(random.uniform(6.5, 8.2), 1)
                    sleep = round(random.uniform(3.0, 4.8), 1)
                    fatigue = round(random.uniform(7.0, 8.8), 1)
                    wellbeing = round(random.uniform(3.0, 5.0), 1)
                    notes = "Synthetic: Circadian disruption following continuous night operations."
                elif cohort_type == 3:
                    # Improving recovery
                    stress = round(random.uniform(2.0, 4.0), 1)
                    sleep = round(random.uniform(7.5, 9.2), 1)
                    fatigue = round(random.uniform(2.0, 3.8), 1)
                    wellbeing = round(random.uniform(7.0, 9.0), 1)
                    notes = "Synthetic: Positive response to rest protocol."
                else:
                    # Healthy baseline
                    stress = round(random.uniform(1.5, 3.5), 1)
                    sleep = round(random.uniform(7.0, 9.0), 1)
                    fatigue = round(random.uniform(1.8, 4.0), 1)
                    wellbeing = round(random.uniform(7.5, 9.5), 1)
                    notes = "Synthetic: Morale high, sleep architecture normal."

                survey = WellnessSurvey(
                    personnel_id=personnel.id,
                    survey_date=survey_date,
                    stress_score=stress,
                    sleep_quality_score=sleep,
                    fatigue_score=fatigue,
                    wellbeing_score=wellbeing,
                    notes=notes,
                )
                session.add(survey)
                total_surveys += 1

        await session.commit()

        logger.info("=" * 60)
        logger.info("SYNTHETIC DATA GENERATION COMPLETE (DEMO DATA ONLY)")
        logger.info(f" - Personnel seeded:    {total_personnel}")
        logger.info(f" - Deployments seeded:  {total_deployments}")
        logger.info(f" - Duty Logs seeded:    {total_duties}")
        logger.info(f" - Leave Records seeded:{total_leaves}")
        logger.info(f" - Surveys seeded:      {total_surveys}")
        logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(generate_synthetic_dataset())
