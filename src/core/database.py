import logging
from typing import AsyncGenerator, Tuple
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from src.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Async Engine for PostgreSQL with connection pooling
engine = create_async_engine(
    settings.ASYNC_DATABASE_URI,
    echo=settings.DEBUG,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True,  # Test connection health before leasing from pool
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an asynchronous database session.
    Guarantees rollback on unhandled exceptions and ensures clean closure.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as exc:
            await session.rollback()
            logger.error(f"Database session error occurred: {exc}")
            raise
        finally:
            await session.close()


async def check_db_connection() -> Tuple[bool, str]:
    """
    Checks if the configured PostgreSQL database is accessible.
    Returns (True, "connected") if healthy, or (False, error_reason) otherwise.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            return True, "connected"
    except Exception as exc:
        err_msg = str(exc)
        if "password authentication failed" in err_msg:
            return False, "authentication_failed: check POSTGRES_PASSWORD in .env"
        elif "does not exist" in err_msg:
            return False, f"database_not_found: database '{settings.POSTGRES_DB}' does not exist"
        elif "Connection refused" in err_msg or "Cannot connect" in err_msg:
            return False, "connection_refused: PostgreSQL service may not be running or port 5432 is blocked"
        return False, f"unavailable: {err_msg}"
