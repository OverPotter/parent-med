"""Роуты: регистрация и базовая авторизация."""

from fastapi import APIRouter, Depends

from src.api.deps import get_auth_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthResponseDto, AuthStateResponseDto, LoginDto, RefreshDto, RegisterDto
from src.application.services.auth_service import AuthService, AuthenticatedAccount

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponseDto, status_code=201)
async def register(
    dto: RegisterDto,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Создать аккаунт, семью и сразу вернуть JWT-пару."""
    return await service.register(dto)


@router.post("/login", response_model=AuthResponseDto)
async def login(
    dto: LoginDto,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Войти по email и паролю."""
    return await service.login(dto)


@router.post("/refresh", response_model=AuthResponseDto)
async def refresh(
    dto: RefreshDto,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Обновить JWT-пару по refresh token."""
    return await service.refresh(dto)


@router.get("/me", response_model=AuthStateResponseDto)
async def me(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AuthService = Depends(get_auth_service),
) -> AuthStateResponseDto:
    """Вернуть текущий аккаунт и его семью."""
    return await service.get_me(current_account.id, current_account.family_id)


@router.post("/logout", status_code=204)
async def logout(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AuthService = Depends(get_auth_service),
) -> None:
    """Закрыть refresh-сессии текущего аккаунта."""
    await service.logout(current_account.id)
