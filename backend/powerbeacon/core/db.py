import asyncio
from pathlib import Path

from alembic.config import Config
from sqlmodel import Session, create_engine, text

from alembic import command
from powerbeacon.core import settings
from powerbeacon.core.seed import seed_database

engine = create_engine(
    settings.db_url,
    echo=False,
    pool_pre_ping=True,
)


def create_main_engine():
    global engine
    engine = create_engine(
        settings.db_url,
        echo=False,
        pool_pre_ping=True,
    )


def check_db_connection():
    test_engine = create_engine(settings.db_url, pool_pre_ping=True)
    with test_engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def seed_database_threadsafe():
    with Session(engine) as session:
        seed_database(session)


async def run_migrations():
    print("Applying database migrations...")
    alembic_ini = Path(__file__).resolve().parents[2] / "alembic.ini"
    if not alembic_ini.exists():
        raise RuntimeError(f"Alembic configuration not found: {alembic_ini}")
    alembic_cfg = Config(str(alembic_ini))
    await asyncio.to_thread(command.upgrade, alembic_cfg, "head")
    print("Database migrations applied successfully.")


async def init_db() -> None:
    # Check DB connection
    print("Checking database connection...")
    try:
        await asyncio.to_thread(check_db_connection)
        print("Database connection successful.")
    except Exception as e:
        raise RuntimeError(f"Database connection failed: {e}")

    # Run Alembic in a thread
    await run_migrations()

    # Import all models to register them with SQLModel
    import powerbeacon.models  # noqa: F401

    # Seed DB
    await asyncio.to_thread(seed_database_threadsafe)
