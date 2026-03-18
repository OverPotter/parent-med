"""Роуты: регистрация и базовая авторизация."""

from fastapi import APIRouter, Depends, Request, Response

from src.api.auth_cookies import clear_auth_cookies, set_auth_cookies
from src.api.deps import get_auth_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import (
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    LoginDto,
    RefreshDto,
    RegisterDto,
)
from src.application.services.base_auth_service import BaseAuthService
from src.core.config import settings
from src.core.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponseDto, status_code=201, include_in_schema=False)
@router.post("/signup", response_model=AuthResponseDto, status_code=201)
async def signup(
    response: Response,
    dto: RegisterDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Создать аккаунт, семью и сразу вернуть JWT-пару."""
    auth = await service.signup(dto)
    set_auth_cookies(response, auth)
    return auth


@router.post("/login", response_model=AuthResponseDto, include_in_schema=False)
@router.post("/signin", response_model=AuthResponseDto)
async def signin(
    response: Response,
    dto: LoginDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Войти по email и паролю."""
    auth = await service.signin(dto)
    set_auth_cookies(response, auth)
    return auth


@router.post("/refresh", response_model=AuthResponseDto)
async def refresh(
    request: Request,
    response: Response,
    dto: RefreshDto | None = None,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Обновить JWT-пару по refresh token."""
    refresh_token = (dto.refresh_token if dto is not None else None) or request.cookies.get(
        settings.refresh_cookie_name
    )
    if not refresh_token:
        raise UnauthorizedError(code="INVALID_REFRESH_TOKEN")
    auth = await service.refresh(RefreshDto(refresh_token=refresh_token))
    set_auth_cookies(response, auth)
    return auth


@router.get("/me", response_model=AuthStateResponseDto)
async def me(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthStateResponseDto:
    """Вернуть текущий аккаунт и его семью."""
    return await service.get_me(current_account.id, current_account.family_id)


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    """Закрыть refresh-сессии текущего аккаунта."""
    await service.logout(current_account.id)
    clear_auth_cookies(response)
