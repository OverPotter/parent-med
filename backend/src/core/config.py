"""Конфигурация приложения из переменных окружения (.env)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Parent Med API"
    debug: bool = False

    # БД
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/parent_med"
    jwt_secret: str = "dev-jwt-secret-change-me"
    jwt_issuer: str = "parent-med"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    cors_allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    access_cookie_name: str = "parent_med_access_token"
    refresh_cookie_name: str = "parent_med_refresh_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"


settings = Settings()
