import asyncio
from logging.config import fileConfig

# pyrefly: ignore
# type: ignore
from sqlalchemy import pool
# pyrefly: ignore
# type: ignore
from sqlalchemy.engine import Connection
# pyrefly: ignore
# type: ignore
from sqlalchemy.ext.asyncio import create_async_engine

# pyrefly: ignore
# type: ignore
from alembic import context

# Import project settings and base metadata
from src.core.config import settings
from src.models import Base

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# NOTE: We do NOT call config.set_main_option("sqlalchemy.url", ...) here
# because alembic's configparser chokes on '%' characters in passwords.
# Instead we create the engine directly in run_async_migrations().

# Target metadata for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=settings.ASYNC_DATABASE_URI,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with an async engine built directly from settings."""
    connectable = create_async_engine(
        settings.ASYNC_DATABASE_URI,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
