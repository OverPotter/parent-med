"""Утилиты для auth-cookie."""

from fastapi import Response

from src.application.dto.auth import AuthResponseDto
from src.core.config import settings


def set_auth_cookies(response: Response, auth: AuthResponseDto) -> None:
    """Сохраняет access/refresh токены в HttpOnly cookies."""
    response.set_cookie(
        key=settings.access_cookie_name,
        value=auth.access_token,
        max_age=settings.access_token_ttl_minutes * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=auth.refresh_token,
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Удаляет auth-cookie у клиента."""
    response.delete_cookie(
        key=settings.access_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )
