from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator, Dict

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.api.routes.health import get_health_status
from src.api.v1.router import api_router
from src.core.config import settings
from src.core.database import check_db_connection, engine
from src.core.logging import setup_logging

# Initialize centralized logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    Handles startup logging, database liveliness check, and graceful shutdown.
    """
    logger.info(f"============================================================")
    logger.info(f" Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f" Environment: [{settings.APP_ENV}] | Debug: [{settings.DEBUG}]")
    logger.info(f" Allowed CORS Origins: {settings.CORS_ORIGINS}")
    logger.info(f"============================================================")

    # Perform startup database connectivity check
    db_connected, db_msg = await check_db_connection()
    if db_connected:
        logger.info(f"Database connection verified: {db_msg}")
    else:
        logger.warning(
            f"Database connectivity check: {db_msg}. "
            f"Ensure PostgreSQL is running and database '{settings.POSTGRES_DB}' exists."
        )

    yield

    logger.info(f"Shutting down {settings.APP_NAME}...")
    await engine.dispose()
    logger.info("Database connection pool disposed successfully.")


# Initialize FastAPI application instance
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS)
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --------------------------------------------------------------------------
# Global Exception Handlers
# --------------------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handles standard HTTP exceptions while preserving headers (WWW-Authenticate)."""
    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handles request validation errors with sanitized field details."""
    from fastapi.encoders import jsonable_encoder

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": jsonable_encoder(exc.errors()),
            "message": "Validation failed for request parameters",
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Catches all unhandled exceptions without leaking stack traces or secrets."""
    logger.exception(
        f"Unhandled error processing {request.method} {request.url.path}: {exc}"
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please consult system logs."},
    )


# --------------------------------------------------------------------------
# Root & Health Endpoints
# --------------------------------------------------------------------------
@app.get(
    "/health",
    tags=["Health"],
    status_code=status.HTTP_200_OK,
    summary="Root Health Check",
)
async def root_health():
    """Simple health check endpoint returning service operational status."""
    return {
        "status": "healthy",
        "service": "SahyogX Backend",
    }


@app.get(
    "/api/health",
    tags=["Health"],
    status_code=status.HTTP_200_OK,
    summary="Detailed Health Check",
)
async def api_health():
    """Detailed health check verifying database connectivity."""
    return await get_health_status()


# Include versioned API router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"], summary="Application Discovery Root")
async def root():
    """Application welcome and documentation discovery endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_check": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
