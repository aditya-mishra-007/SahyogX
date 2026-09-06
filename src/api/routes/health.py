from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, status
from src.core.config import settings
from src.core.database import check_db_connection

router = APIRouter(tags=["Health"])


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
