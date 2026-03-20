from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Version
    app_version: str = "1.0.1"

    # Database
    db_url: str = "postgresql+psycopg2://powerbeacon:changeMe@db:5432/powerbeacon"

    # Authentication
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_expiration_hours: int = 24

    # Frontend
    frontend_url: str = "http://localhost:5173"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost:8000",
    ]

    # Security
    password_min_length: int = 8

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
