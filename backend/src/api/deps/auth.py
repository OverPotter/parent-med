"""Зависимости для Bearer-авторизации и auth-cookie."""

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.api.deps.services import get_auth_service
from src.application.dto.auth import AuthenticatedAccount
from src.application.services.base_auth_service import BaseAuthService
from src.core.config import settings
from src.core.exceptions import UnauthorizedError

http_bearer = HTTPBearer(auto_error=False)


async def get_bearer_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> str:
    """Извлекает access token из Authorization или cookie."""
    if credentials is not None and credentials.scheme.lower() == "bearer":
        return credentials.credentials

    cookie_token = request.cookies.get(settings.access_cookie_name)
    if cookie_token:
        return cookie_token

    raise UnauthorizedError()


async def get_current_account(
    token: str = Depends(get_bearer_token),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthenticatedAccount:
    """Возвращает текущий аккаунт по Bearer-токену."""
    return await service.get_current_account(token)
