"""Зависимости для Bearer-авторизации."""

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.api.deps.services import get_auth_service
from src.application.dto.auth import AuthenticatedAccount
from src.application.services.base_auth_service import BaseAuthService
from src.core.exceptions import UnauthorizedError

http_bearer = HTTPBearer(auto_error=False)


async def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> str:
    """Извлекает Bearer-токен из Authorization."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError()
    return credentials.credentials


async def get_current_account(
    token: str = Depends(get_bearer_token),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthenticatedAccount:
    """Возвращает текущий аккаунт по Bearer-токену."""
    return await service.get_current_account(token)
