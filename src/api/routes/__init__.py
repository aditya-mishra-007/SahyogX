"""API route handlers for SahyogX."""
from src.api.routes.health import router as health_router
from src.api.routes.auth import router as auth_router
from src.api.routes.test_rbac import router as rbac_router

__all__ = ["health_router", "auth_router", "rbac_router"]
