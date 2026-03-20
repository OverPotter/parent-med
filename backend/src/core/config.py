"""Конфигурация приложения из переменных окружения (.env)."""

import json
from typing import Annotated, Any

from pydantic import BeforeValidator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings.sources.types import NoDecode

_DEFAULT_CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def _parse_cors_allowed_origins(v: Any) -> list[str]:
    """Из env: JSON-массив или список URL через запятую (удобно для Railway)."""
    if v is None:
        return list(_DEFAULT_CORS_ORIGINS)
    if isinstance(v, list):
        return [str(x) for x in v]
    if isinstance(v, str):
        s = v.strip()
        if not s:
            return list(_DEFAULT_CORS_ORIGINS)
        if s.startswith("["):
            try:
                data = json.loads(s)
            except json.JSONDecodeError as e:
                raise ValueError(
                    "CORS_ALLOWED_ORIGINS: невалидный JSON. "
                    'Пример: ["https://app.example.com"] '
                    "или без JSON: https://a.com,https://b.com"
                ) from e
            if not isinstance(data, list):
                raise ValueError("CORS_ALLOWED_ORIGINS: JSON должен быть массивом строк")
            return [str(x) for x in data]
        return [x.strip() for x in s.split(",") if x.strip()]
    return v


CorsAllowedOrigins = Annotated[
    list[str],
    NoDecode,
    BeforeValidator(_parse_cors_allowed_origins),
]


class Settings(BaseSettings):
    """Настройки приложения."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Parent Med API"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/parent_med"
    jwt_secret: str = "dev-jwt-secret-change-me"
    jwt_issuer: str = "parent-med"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 7
    refresh_token_ttl_days_remember_me: int = 60
    cors_allowed_origins: CorsAllowedOrigins = list(_DEFAULT_CORS_ORIGINS)
    access_cookie_name: str = "parent_med_access_token"
    refresh_cookie_name: str = "parent_med_refresh_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    app_timezone: str = "Europe/Minsk"
    push_poll_interval_seconds: int = 5
    web_push_public_key: str | None = None
    web_push_private_key: str | None = None
    web_push_subject: str = "mailto:dev@example.com"

    @classmethod
    @field_validator("database_url", mode="before")
    def normalize_database_url_for_asyncpg(cls, v: Any) -> Any:
        if not isinstance(v, str):
            return v
        s = v.strip()
        if s.startswith("postgres://"):
            return "postgresql+asyncpg://" + s.removeprefix("postgres://")
        if s.startswith("postgresql://") and not s.startswith("postgresql+asyncpg://"):
            return "postgresql+asyncpg://" + s.removeprefix("postgresql://")
        return v

    @property
    def web_push_enabled(self) -> bool:
        return bool(self.web_push_public_key and self.web_push_private_key)

    @property
    def web_push_private_key_pem(self) -> str | None:
        if not self.web_push_private_key:
            return None
        return self.web_push_private_key.replace("\\n", "\n")


settings = Settings()
