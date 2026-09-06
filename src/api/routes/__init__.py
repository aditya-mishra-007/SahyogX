"""API route handlers for SahyogX."""
from src.api.routes.health import router as health_router
from src.api.routes.auth import router as auth_router
from src.api.routes.test_rbac import router as rbac_router
from src.api.routes.personnel import router as personnel_router
from src.api.routes.deployments import router as deployments_router
from src.api.routes.duty import router as duty_router
from src.api.routes.leaves import router as leaves_router
from src.api.routes.surveys import router as surveys_router
from src.api.routes.predictions import router as predictions_router
from src.api.routes.alerts import router as alerts_router
from src.api.routes.analytics import router as analytics_router
from src.api.routes.audit import router as audit_router
from src.api.routes.export import router as export_router

__all__ = [
    "health_router",
    "auth_router",
    "rbac_router",
    "personnel_router",
    "deployments_router",
    "duty_router",
    "leaves_router",
    "surveys_router",
    "predictions_router",
    "alerts_router",
    "analytics_router",
    "audit_router",
    "export_router",
]
