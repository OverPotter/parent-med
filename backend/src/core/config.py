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
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 7
    refresh_token_ttl_days_remember_me: int = 60
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
    app_timezone: str = "Europe/Minsk"
    push_poll_interval_seconds: int = 5
    web_push_public_key: str | None = None
    web_push_private_key: str | None = None
    web_push_subject: str = "mailto:dev@example.com"

    @property
    def web_push_enabled(self) -> bool:
        return bool(self.web_push_public_key and self.web_push_private_key)

    @property
    def web_push_private_key_pem(self) -> str | None:
        if not self.web_push_private_key:
            return None
        return self.web_push_private_key.replace("\\n", "\n")

settings = Settings()
