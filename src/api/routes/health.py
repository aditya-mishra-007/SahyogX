from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from src.core.config import settings
from src.core.database import check_db_connection
from src.services.prediction_service import prediction_service

router = APIRouter(tags=["Health"])


async def get_readiness_status() -> tuple[bool, Dict[str, Any]]:
    """
    Evaluates deep system readiness across database and ML prediction pipelines.
    Returns (is_ready, details_dict).
    """
    db_connected, db_message = await check_db_connection()
    model_status = prediction_service.get_engine_status()
    is_ready = db_connected

    data = {
        "status": "READY" if is_ready else "NOT_READY",
        "service": "SahyogX Backend",
        "version": settings.APP_VERSION,
        "database": "CONNECTED" if db_connected else "DISCONNECTED",
        "database_detail": db_message,
        "ml_engine": {
            "status": "ACTIVE",
            "active_model": model_status.active_model_name,
            "version": model_status.active_model_version,
            "ml_artifact_available": model_status.ml_artifact_available,
            "fallback_enabled": model_status.fallback_enabled,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return is_ready, data


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health & Database Check",
    response_description="Returns operational status and database readiness",
)
async def get_health_status() -> Dict[str, Any]:
    """
    Health check endpoint returning application status and PostgreSQL connectivity.
    """
    db_connected, db_message = await check_db_connection()

    return {
        "status": "healthy" if db_connected else "degraded",
        "service": "SahyogX Backend",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "api": "operational",
            "database": db_message,
        },
    }


@router.get(
    "/health/ready",
    summary="System Readiness Check",
    response_description="Returns deep readiness probe status across database and ML engines",
)
async def readiness_probe():
    """Deep readiness probe verifying database connectivity and ML engine initialization."""
    is_ready, data = await get_readiness_status()
    if not is_ready:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=data)
    return JSONResponse(status_code=status.HTTP_200_OK, content=data)
