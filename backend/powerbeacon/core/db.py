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


def init_db() -> None:
    # Import all models to register them with SQLModel
    import powerbeacon.models  # noqa: F401

    # Check first if db is reachable
    print("Checking database connection...")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as e:
        raise RuntimeError(f"Database connection failed: {e}")

    print("Applying database migrations...")
    alembic_ini = Path(__file__).resolve().parents[2] / "alembic.ini"
    if not alembic_ini.exists():
        raise RuntimeError(f"Alembic configuration not found: {alembic_ini}")

    alembic_cfg = Config(str(alembic_ini))
    command.upgrade(alembic_cfg, "head")

    with Session(engine) as session:
        seed_database(session)
