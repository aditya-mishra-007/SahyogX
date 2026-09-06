from fastapi import APIRouter
from src.api.routes.auth import router as auth_router
from src.api.routes.health import router as health_router
from src.api.routes.test_rbac import router as rbac_router

api_router = APIRouter()

# Include feature routers under /api/v1
api_router.include_router(auth_router)
api_router.include_router(rbac_router)
api_router.include_router(health_router)
