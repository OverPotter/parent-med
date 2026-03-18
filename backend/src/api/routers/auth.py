"""Роуты: регистрация и базовая авторизация."""

from fastapi import APIRouter, Depends

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

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponseDto, status_code=201, include_in_schema=False)
@router.post("/signup", response_model=AuthResponseDto, status_code=201)
async def signup(
    dto: RegisterDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Создать аккаунт, семью и сразу вернуть JWT-пару."""
    return await service.signup(dto)


@router.post("/login", response_model=AuthResponseDto, include_in_schema=False)
@router.post("/signin", response_model=AuthResponseDto)
async def signin(
    dto: LoginDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Войти по email и паролю."""
    return await service.signin(dto)


@router.post("/refresh", response_model=AuthResponseDto)
async def refresh(
    dto: RefreshDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Обновить JWT-пару по refresh token."""
    return await service.refresh(dto)


@router.get("/me", response_model=AuthStateResponseDto)
async def me(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthStateResponseDto:
    """Вернуть текущий аккаунт и его семью."""
    return await service.get_me(current_account.id, current_account.family_id)


@router.post("/logout", status_code=204)
async def logout(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    """Закрыть refresh-сессии текущего аккаунта."""
    await service.logout(current_account.id)
