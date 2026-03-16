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


settings = Settings()
