from sqlmodel import Session, create_engine
from powerbeacon.core import settings

engine = create_engine(
    settings.db_url,
    echo=False,
    pool_pre_ping=True,
)


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    from sqlmodel import SQLModel

    # Import all models to register them with SQLModel
    import powerbeacon.models  # noqa: F401

    print("Creating database tables...")
    # This works because the models are already imported and registered from app.models
    SQLModel.metadata.create_all(engine)
