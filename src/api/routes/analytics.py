from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import require_role
from src.core.database import get_db
from src.schemas.analytics import (
    TheatreRiskResponse,
    UnitHeatmapResponse,
    UnitWelfareSummary,
)
from src.schemas.user import UserResponse, UserRole
from src.services.analytics_service import (
    get_theatre_risk_analytics,
    get_unit_heatmap,
    get_unit_welfare_summary,
)

router = APIRouter(prefix="/analytics", tags=["Unit Stress Analytics & Heatmaps"])


@router.get(
    "/heatmap",
    response_model=UnitHeatmapResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Multi-Unit Stress Risk Heatmap",
)
async def get_force_heatmap(
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> UnitHeatmapResponse:
    """
    Computes a force-wide comparative stress risk heatmap across all registered units.
    Identifies high-risk battalions and provides categorical risk breakdowns.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    return await get_unit_heatmap(db)


@router.get(
    "/theatres",
    response_model=TheatreRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Operational Theatre Risk Analytics",
)
async def get_theatres_analytics(
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> TheatreRiskResponse:
    """
    Analyzes active operational deployments segmented by theatre and terrain difficulty.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    return await get_theatre_risk_analytics(db)


@router.get(
    "/unit/{unit}/summary",
    response_model=UnitWelfareSummary,
    status_code=status.HTTP_200_OK,
    summary="Get Unit Welfare Deep-Dive Summary",
)
async def get_unit_summary(
    unit: str,
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> UnitWelfareSummary:
    """
    Deep-dive operational welfare analysis for a single battalion.
    Computes duty averages, night sentry counts, leave deprivation rate, and open alert counts.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    summary = await get_unit_welfare_summary(db, unit)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unit '{unit}' not found or has no registered personnel.",
        )
    return summary
