"""Утилиты для auth-cookie."""

from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import Response

from src.application.dto.auth import AuthResponseDto
from src.core.config import settings

CookieSameSite = Literal["lax", "strict", "none"]


def resolve_auth_cookie_samesite() -> CookieSameSite:
    """Resolve a safe SameSite mode for local web and production PWA auth."""

    configured = (settings.auth_cookie_samesite or "").strip().lower()
    if configured in {"lax", "strict", "none"}:
        return configured
    if configured not in {"", "auto"}:
        return "lax"
    return "lax" if settings.is_local_environment else "none"


def set_auth_cookies(response: Response, auth: AuthResponseDto) -> None:
    """Сохраняет access/refresh токены в HttpOnly cookies."""
    if not auth.access_token or not auth.refresh_token:
        raise ValueError("Auth cookies require both access and refresh tokens")
    now = datetime.now(UTC)
    samesite = resolve_auth_cookie_samesite()
    refresh_ttl_days = (
        settings.refresh_token_ttl_days_remember_me
        if auth.remember_me
        else settings.refresh_token_ttl_days
    )
    response.set_cookie(
        key=settings.access_cookie_name,
        value=auth.access_token,
        max_age=settings.access_token_ttl_minutes * 60,
        expires=now + timedelta(minutes=settings.access_token_ttl_minutes),
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=samesite,
        path="/",
    )
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=auth.refresh_token,
        max_age=refresh_ttl_days * 24 * 60 * 60,
        expires=now + timedelta(days=refresh_ttl_days),
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=samesite,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Удаляет auth-cookie у клиента."""
    samesite = resolve_auth_cookie_samesite()
    response.delete_cookie(
        key=settings.access_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=samesite,
        path="/",
    )
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=samesite,
        path="/",
    )
