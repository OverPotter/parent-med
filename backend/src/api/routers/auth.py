"""Auth: регистрация, вход, refresh, me, выход."""

from fastapi import APIRouter, Depends, Request, Response

from src.api.deps import get_auth_service
from src.api.deps.auth import get_current_account
from src.api.utils.auth_cookies import clear_auth_cookies, set_auth_cookies
from src.application.dto.auth import (
    AccountResponseDto,
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    ChangePasswordDto,
    LoginDto,
    RefreshDto,
    RegisterDto,
    UpdateAccountProfileDto,
    UpdateLanguageDto,
)
from src.application.services.base_auth_service import BaseAuthService
from src.core.config import settings
from src.core.exceptions import UnauthorizedError
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponseDto, status_code=201, include_in_schema=False)
@router.post("/signup", response_model=AuthResponseDto, status_code=201)
async def signup(
    response: Response,
    dto: RegisterDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    auth = await service.signup(dto)
    logger.info(f"Регистрация | login={dto.login}")
    set_auth_cookies(response, auth)
    return auth


@router.post("/login", response_model=AuthResponseDto, include_in_schema=False)
@router.post("/signin", response_model=AuthResponseDto)
async def signin(
    response: Response,
    dto: LoginDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    auth = await service.signin(dto)
    logger.info(f"Вход | login={dto.login}")
    set_auth_cookies(response, auth)
    return auth


@router.post("/refresh", response_model=AuthResponseDto)
async def refresh(
    request: Request,
    response: Response,
    dto: RefreshDto | None = None,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    refresh_token = (dto.refresh_token if dto is not None else None) or request.cookies.get(
        settings.refresh_cookie_name
    )
    if not refresh_token:
        raise UnauthorizedError(code="INVALID_REFRESH_TOKEN")
    logger.debug("refresh_token")
    auth = await service.refresh(RefreshDto(refresh_token=refresh_token))
    set_auth_cookies(response, auth)
    return auth


@router.get("/me", response_model=AuthStateResponseDto)
async def me(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthStateResponseDto:
    return await service.get_me(current_account.id, current_account.family_id)


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info("Выход | account_id={}", current_account.id)
    await service.logout(current_account.id)
    clear_auth_cookies(response)


@router.delete("/me", status_code=204)
async def delete_me(
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info("Удаление аккаунта | account_id={}", current_account.id)
    await service.delete_me(current_account.id)
    clear_auth_cookies(response)


@router.delete("/family", status_code=204)
async def delete_family(
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info("Удаление семьи | account_id={}", current_account.id)
    await service.delete_family(current_account.id)
    clear_auth_cookies(response)


@router.patch("/password", status_code=204)
async def change_password(
    dto: ChangePasswordDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info(f"Смена пароля | account_id={current_account.id}")
    await service.change_password(current_account.id, dto)


@router.patch("/language", response_model=AccountResponseDto)
async def update_language(
    dto: UpdateLanguageDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AccountResponseDto:
    logger.info(f"Смена языка | account_id={current_account.id} language={dto.preferred_language}")
    return await service.update_language(current_account.id, dto)


@router.patch("/profile", response_model=AccountResponseDto)
async def update_profile(
    dto: UpdateAccountProfileDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AccountResponseDto:
    logger.info("Обновление профиля | account_id={}", current_account.id)
    return await service.update_profile(current_account.id, dto)
