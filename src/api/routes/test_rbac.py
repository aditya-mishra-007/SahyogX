from typing import Any, Dict
from fastapi import APIRouter, Depends
from src.api.deps import require_commander, require_medical_officer, require_personnel
from src.schemas.user import UserResponse

router = APIRouter(prefix="/test", tags=["RBAC Test Endpoints (Phase 1 Dev Only)"])


@router.get(
    "/commander",
    summary="[TEST] Commander Access Only",
    response_description="Confirmation payload restricted to COMMANDER role",
)
async def test_commander_access(
    user: UserResponse = Depends(require_commander),
) -> Dict[str, Any]:
    """
    Temporary verification endpoint for COMMANDER role authorization.
    Returns HTTP 403 if authenticated user does not have COMMANDER role.
    """
    return {
        "message": "Access granted: Commander authorized",
        "user_id": user.id,
        "username": user.username,
        "role": user.role.value,
        "full_name": user.full_name,
    }


@router.get(
    "/medical",
    summary="[TEST] Medical Officer Access Only",
    response_description="Confirmation payload restricted to MEDICAL_OFFICER role",
)
async def test_medical_access(
    user: UserResponse = Depends(require_medical_officer),
) -> Dict[str, Any]:
    """
    Temporary verification endpoint for MEDICAL_OFFICER role authorization.
    Returns HTTP 403 if authenticated user does not have MEDICAL_OFFICER role.
    """
    return {
        "message": "Access granted: Medical Officer authorized",
        "user_id": user.id,
        "username": user.username,
        "role": user.role.value,
        "full_name": user.full_name,
    }


@router.get(
    "/personnel",
    summary="[TEST] Personnel Access Only",
    response_description="Confirmation payload restricted to PERSONNEL role",
)
async def test_personnel_access(
    user: UserResponse = Depends(require_personnel),
) -> Dict[str, Any]:
    """
    Temporary verification endpoint for PERSONNEL role authorization.
    Returns HTTP 403 if authenticated user does not have PERSONNEL role.
    """
    return {
        "message": "Access granted: Personnel authorized",
        "user_id": user.id,
        "username": user.username,
        "role": user.role.value,
        "full_name": user.full_name,
    }
