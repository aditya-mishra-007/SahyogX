from fastapi import APIRouter
from src.api.routes.auth import router as auth_router
from src.api.routes.health import router as health_router
from src.api.routes.test_rbac import router as rbac_router
from src.api.routes.personnel import router as personnel_router
from src.api.routes.deployments import router as deployments_router
from src.api.routes.duty import router as duty_router
from src.api.routes.leaves import router as leaves_router
from src.api.routes.surveys import router as surveys_router
from src.api.routes.predictions import router as predictions_router
from src.api.routes.alerts import router as alerts_router
from src.api.routes.analytics import router as analytics_router

api_router = APIRouter()

# Include feature routers under /api/v1
api_router.include_router(auth_router)
api_router.include_router(rbac_router)
api_router.include_router(health_router)
api_router.include_router(personnel_router)
api_router.include_router(deployments_router)
api_router.include_router(duty_router)
api_router.include_router(leaves_router)
api_router.include_router(surveys_router)
api_router.include_router(predictions_router)
api_router.include_router(alerts_router)
api_router.include_router(analytics_router)
