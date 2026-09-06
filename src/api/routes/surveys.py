from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import (
    get_current_user,
    require_medical_officer,
    require_role,
)
from src.core.database import get_db
from src.schemas.survey import (
    SurveyAggregationResponse,
    SurveyCreate,
    SurveyListResponse,
    SurveyResponse,
    SurveyUpdate,
)
from src.schemas.user import UserResponse, UserRole
from src.services.personnel_service import get_personnel_by_id
from src.services.survey_service import (
    create_survey,
    get_survey_by_id,
    get_survey_summary,
    list_surveys,
    update_survey,
)

router = APIRouter(prefix="/surveys", tags=["Wellness & Stress Surveys"])


@router.get(
    "",
    response_model=SurveyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Wellness Surveys (Medical Officers Only)",
)
async def get_all_surveys(
    personnel_id: Optional[int] = Query(None, description="Filter by personnel ID"),
    start_date: Optional[date] = Query(None, description="Filter assessments on or after date"),
    end_date: Optional[date] = Query(None, description="Filter assessments on or before date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(require_medical_officer),
    db: AsyncSession = Depends(get_db),
) -> SurveyListResponse:
    """
    Retrieves psychological and wellness assessments.
    **Restricted strictly to `MEDICAL_OFFICER`** to protect individual clinical confidentiality.
    """
    items, total = await list_surveys(
        db,
        personnel_id=personnel_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    return SurveyListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/personnel/{personnel_id}/summary",
    response_model=SurveyAggregationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Aggregated Wellness Summary & Risk Level",
)
async def get_personnel_survey_summary(
    personnel_id: int,
    current_user: UserResponse = Depends(
        require_role(UserRole.MEDICAL_OFFICER, UserRole.COMMANDER)
    ),
    db: AsyncSession = Depends(get_db),
) -> SurveyAggregationResponse:
    """
    Returns aggregated wellness metrics and calculated qualitative stress risk level
    (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
    Accessible to Medical Officers and Unit Commanders.
    """
    personnel = await get_personnel_by_id(db, personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with ID {personnel_id} not found",
        )
    return await get_survey_summary(db, personnel_id)


@router.get(
    "/{survey_id}",
    response_model=SurveyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Survey Details by ID (Medical Officers Only)",
)
async def get_survey(
    survey_id: int,
    current_user: UserResponse = Depends(require_medical_officer),
    db: AsyncSession = Depends(get_db),
) -> SurveyResponse:
    """
    Retrieves individual clinical survey responses.
    **Restricted strictly to `MEDICAL_OFFICER`**.
    """
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Survey with ID {survey_id} not found",
        )
    return survey


@router.post(
    "",
    response_model=SurveyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Wellness Assessment",
)
async def submit_survey(
    data: SurveyCreate,
    current_user: UserResponse = Depends(
        require_role(UserRole.PERSONNEL, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> SurveyResponse:
    """
    Submits a wellness/stress survey.
    Can be self-administered by `PERSONNEL` or recorded by `MEDICAL_OFFICER`.
    """
    personnel = await get_personnel_by_id(db, data.personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot submit survey: Personnel with ID {data.personnel_id} does not exist",
        )
    return await create_survey(db, data)


@router.patch(
    "/{survey_id}",
    response_model=SurveyResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Survey Assessment (Medical Officers Only)",
)
async def update_survey_record(
    survey_id: int,
    data: SurveyUpdate,
    current_user: UserResponse = Depends(require_medical_officer),
    db: AsyncSession = Depends(get_db),
) -> SurveyResponse:
    """
    Updates clinical survey data or counselor notes.
    **Restricted strictly to `MEDICAL_OFFICER`**.
    """
    survey = await update_survey(db, survey_id, data)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Survey with ID {survey_id} not found",
        )
    return survey
