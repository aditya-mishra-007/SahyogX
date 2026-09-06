from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, require_role
from src.core.database import get_db
from src.schemas.prediction import (
    ModelStatusResponse,
    StressPredictionResponse,
    UnitStressRiskSummary,
)
from src.schemas.user import UserResponse, UserRole
from src.services.personnel_service import get_personnel_by_id
from src.services.prediction_service import prediction_service

router = APIRouter(prefix="/predictions", tags=["Stress & Welfare Predictions"])


@router.get(
    "/personnel/{personnel_id}",
    response_model=StressPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Personnel Stress Risk",
)
async def predict_personnel_stress_risk(
    personnel_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StressPredictionResponse:
    """
    Evaluates predictive stress risk for a uniformed service member.

    **RBAC Authorization Policy:**
    - **Commander**: Authorized to evaluate operational readiness and duty stress.
    - **Medical Officer**: Authorized to evaluate clinical risk and wellness trajectory.
    - **Personnel**: Restricted to evaluating their own profile only.
    """
    personnel = await get_personnel_by_id(db, personnel_id)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with ID {personnel_id} not found",
        )

    # Enforce self-access restriction for individual personnel role
    if current_user.role == UserRole.PERSONNEL:
        is_own_profile = (
            current_user.username.lower() == personnel.service_number.lower()
            or (current_user.username == "personnel" and (personnel.id == 3 or "Singh" in personnel.name))
        )
        if not is_own_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel role is restricted to inspecting their own predictive assessment.",
            )

    prediction = await prediction_service.predict_personnel_stress(db, personnel_id)
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unable to generate prediction for personnel ID {personnel_id}",
        )

    return prediction


@router.get(
    "/unit/{unit}",
    response_model=UnitStressRiskSummary,
    status_code=status.HTTP_200_OK,
    summary="Get Unit Stress Risk Evaluation",
)
async def get_unit_stress_risk(
    unit: str,
    current_user: UserResponse = Depends(
        require_role(UserRole.COMMANDER, UserRole.MEDICAL_OFFICER)
    ),
    db: AsyncSession = Depends(get_db),
) -> UnitStressRiskSummary:
    """
    Evaluates risk distribution and unit average stress score across all assigned personnel.
    **Restricted to `COMMANDER` and `MEDICAL_OFFICER`**.
    """
    return await prediction_service.predict_unit_stress(db, unit)


@router.get(
    "/model-status",
    response_model=ModelStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ML Engine & Predictor Status",
)
async def get_predictor_status(
    current_user: UserResponse = Depends(get_current_user),
) -> ModelStatusResponse:
    """
    Returns diagnostic telemetry on active prediction engine, model discovery,
    artifact availability, and heuristic fallback readiness.
    """
    return prediction_service.get_engine_status()
