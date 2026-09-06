from datetime import datetime, timezone
import logging
from typing import Any, Dict

from fastapi import APIRouter, status
from sqlalchemy import text

from src.core.config import settings
from src.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint to verify backend operational status.
    Tests API readiness and performs an active ping against PostgreSQL.
    """
    db_status = "disconnected"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as exc:
        logger.warning(f"Database health check query failed: {exc}")
        db_status = "unavailable"

    is_fully_healthy = db_status == "connected"

    return {
        "status": "healthy" if is_fully_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "api": "operational",
            "database": db_status,
        },
    }
