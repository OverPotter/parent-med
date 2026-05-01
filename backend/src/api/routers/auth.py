"""Auth: регистрация, вход, refresh, me, выход."""

from fastapi import APIRouter, Depends, Request, Response

from src.api.deps import get_auth_attempt_repo, get_auth_service
from src.api.deps.auth import get_current_account
from src.api.utils.auth_cookies import clear_auth_cookies
from src.api.utils.auth_response import build_auth_response
from src.application.dto.auth import (
    AccountResponseDto,
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    ChangePasswordDto,
    LoginFamilyInviteDto,
    LoginDto,
    RecoverPasswordByCodeDto,
    RefreshDto,
    RegisterDto,
    UpdateAccountProfileDto,
    UpdateLanguageDto,
    UpdateRecoveryCodeDto,
)
from src.application.security.auth_rate_limit import (
    build_auth_attempt_bucket_keys,
    build_auth_attempt_throttle,
)
from src.application.services.base_auth_service import BaseAuthService
from src.core.config import settings
from src.core.exceptions import UnauthorizedError
from src.core.logging import get_logger
from src.domain.repositories.auth_attempt_repository import AuthAttemptRepository

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_throttle(auth_attempt_repo: AuthAttemptRepository):
    return build_auth_attempt_throttle(auth_attempt_repo)


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


async def _run_signin(
    *,
    request: Request,
    response: Response,
    dto: LoginDto,
    service: BaseAuthService,
    auth_attempt_repo: AuthAttemptRepository,
    include_tokens: bool,
    include_cookies: bool,
    log_message: str,
) -> AuthResponseDto:
    identifier = dto.email.strip().lower()
    client_ip = _client_ip(request)
    logger.info(
        "Auth signin attempt | native={} identifier={} ip={}",
        include_tokens,
        identifier,
        client_ip,
    )
    bucket_keys = build_auth_attempt_bucket_keys(client_ip, identifier)
    async with auth_attempt_repo.locked(bucket_keys) as locked_repo:
        throttle = _build_throttle(locked_repo)
        await throttle.assert_allowed("signin", client_ip, identifier)
        try:
            auth = await service.signin(dto)
        except UnauthorizedError:
            await throttle.record_failure("signin", client_ip, identifier)
            raise
    logger.info("{} | identifier={}", log_message, dto.email)
    return build_auth_response(
        response,
        auth,
        include_tokens=include_tokens,
        include_cookies=include_cookies,
    )


async def _run_signin_and_accept_family_invite(
    *,
    request: Request,
    response: Response,
    dto: LoginFamilyInviteDto,
    service: BaseAuthService,
    auth_attempt_repo: AuthAttemptRepository,
) -> AuthResponseDto:
    identifier = dto.email.strip().lower()
    client_ip = _client_ip(request)
    logger.info(
        "Auth signin+invite attempt | identifier={} ip={} has_token={} dev_latest={}",
        identifier,
        client_ip,
        bool(dto.invite_token),
        dto.use_latest_dev_invite,
    )
    bucket_keys = build_auth_attempt_bucket_keys(client_ip, identifier)
    async with auth_attempt_repo.locked(bucket_keys) as locked_repo:
        throttle = _build_throttle(locked_repo)
        await throttle.assert_allowed("signin", client_ip, identifier)
        try:
            auth = await service.signin_and_accept_family_invite(dto)
        except UnauthorizedError:
            await throttle.record_failure("signin", client_ip, identifier)
            raise
    logger.info("Вход и принятие приглашения | identifier={}", dto.email)
    return build_auth_response(
        response,
        auth,
        include_tokens=False,
        include_cookies=True,
    )


async def _run_refresh(
    *,
    request: Request,
    response: Response,
    dto: RefreshDto | None,
    service: BaseAuthService,
    include_tokens: bool,
    include_cookies: bool,
    log_message: str,
) -> AuthResponseDto:
    refresh_token = (dto.refresh_token if dto is not None else None) or request.cookies.get(
        settings.refresh_cookie_name
    )
    logger.info(
        "Auth refresh attempt | native={} has_body={} has_cookie={} ip={}",
        include_tokens,
        bool(dto and dto.refresh_token),
        bool(request.cookies.get(settings.refresh_cookie_name)),
        _client_ip(request),
    )
    if not refresh_token:
        raise UnauthorizedError(code="INVALID_REFRESH_TOKEN")
    logger.debug(log_message)
    auth = await service.refresh(RefreshDto(refresh_token=refresh_token))
    return build_auth_response(
        response,
        auth,
        include_tokens=include_tokens,
        include_cookies=include_cookies,
    )


@router.post("/register", response_model=AuthResponseDto, status_code=201, include_in_schema=False)
@router.post("/signup", response_model=AuthResponseDto, status_code=201)
async def signup(
    response: Response,
    dto: RegisterDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    auth = await service.signup(dto)
    logger.info("Регистрация | email={}", dto.email)
    return build_auth_response(
        response,
        auth,
        include_tokens=False,
        include_cookies=True,
    )


@router.post("/native/signup", response_model=AuthResponseDto, status_code=201)
async def native_signup(
    response: Response,
    dto: RegisterDto,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    auth = await service.signup(dto)
    logger.info("Native регистрация | email={}", dto.email)
    return build_auth_response(
        response,
        auth,
        include_tokens=True,
        include_cookies=False,
    )


@router.post("/login", response_model=AuthResponseDto, include_in_schema=False)
@router.post("/signin", response_model=AuthResponseDto)
async def signin(
    request: Request,
    response: Response,
    dto: LoginDto,
    service: BaseAuthService = Depends(get_auth_service),
    auth_attempt_repo: AuthAttemptRepository = Depends(get_auth_attempt_repo),
) -> AuthResponseDto:
    return await _run_signin(
        request=request,
        response=response,
        dto=dto,
        service=service,
        auth_attempt_repo=auth_attempt_repo,
        include_tokens=False,
        include_cookies=True,
        log_message="Вход",
    )


@router.post("/native/signin", response_model=AuthResponseDto)
async def native_signin(
    request: Request,
    response: Response,
    dto: LoginDto,
    service: BaseAuthService = Depends(get_auth_service),
    auth_attempt_repo: AuthAttemptRepository = Depends(get_auth_attempt_repo),
) -> AuthResponseDto:
    return await _run_signin(
        request=request,
        response=response,
        dto=dto,
        service=service,
        auth_attempt_repo=auth_attempt_repo,
        include_tokens=True,
        include_cookies=False,
        log_message="Native вход",
    )


@router.post("/signin/family-invite", response_model=AuthResponseDto)
async def signin_and_accept_family_invite(
    request: Request,
    response: Response,
    dto: LoginFamilyInviteDto,
    service: BaseAuthService = Depends(get_auth_service),
    auth_attempt_repo: AuthAttemptRepository = Depends(get_auth_attempt_repo),
) -> AuthResponseDto:
    return await _run_signin_and_accept_family_invite(
        request=request,
        response=response,
        dto=dto,
        service=service,
        auth_attempt_repo=auth_attempt_repo,
    )


@router.post("/refresh", response_model=AuthResponseDto)
async def refresh(
    request: Request,
    response: Response,
    dto: RefreshDto | None = None,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    return await _run_refresh(
        request=request,
        response=response,
        dto=dto,
        service=service,
        include_tokens=False,
        include_cookies=True,
        log_message="refresh_token",
    )


@router.post("/native/refresh", response_model=AuthResponseDto)
async def native_refresh(
    request: Request,
    response: Response,
    dto: RefreshDto | None = None,
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    return await _run_refresh(
        request=request,
        response=response,
        dto=dto,
        service=service,
        include_tokens=True,
        include_cookies=False,
        log_message="native refresh_token",
    )


@router.get("/me", response_model=AuthStateResponseDto)
async def me(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthStateResponseDto:
    return await service.get_me(current_account.id, current_account.family_id)


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    dto: RefreshDto | None = None,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info("Выход | account_id={}", current_account.id)
    refresh_token = (dto.refresh_token if dto is not None else None) or request.cookies.get(
        settings.refresh_cookie_name
    )
    logger.info(
        "Auth logout attempt | account_id={} has_body={} has_cookie={} ip={}",
        current_account.id,
        bool(dto and dto.refresh_token),
        bool(request.cookies.get(settings.refresh_cookie_name)),
        _client_ip(request),
    )
    await service.logout(current_account.id, refresh_token)
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


@router.post("/family/leave", response_model=AuthStateResponseDto)
async def leave_family(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> AuthStateResponseDto:
    logger.info("Выход из семьи | account_id={}", current_account.id)
    return await service.leave_family(current_account.id)


@router.patch("/password", status_code=204)
async def change_password(
    request: Request,
    dto: ChangePasswordDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info(f"Смена пароля | account_id={current_account.id}")
    refresh_token = dto.refresh_token or request.cookies.get(settings.refresh_cookie_name)
    await service.change_password(current_account.id, dto, refresh_token)


@router.patch("/recovery-code", status_code=204)
async def update_recovery_code(
    dto: UpdateRecoveryCodeDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: BaseAuthService = Depends(get_auth_service),
) -> None:
    logger.info("Обновление recovery code | account_id={}", current_account.id)
    await service.update_recovery_code(current_account.id, dto)


@router.post("/recover-password/code/reset", status_code=204)
async def reset_password_by_recovery_code(
    request: Request,
    response: Response,
    dto: RecoverPasswordByCodeDto,
    service: BaseAuthService = Depends(get_auth_service),
    auth_attempt_repo: AuthAttemptRepository = Depends(get_auth_attempt_repo),
) -> None:
    identifier = dto.email.strip().lower()
    client_ip = _client_ip(request)
    bucket_keys = build_auth_attempt_bucket_keys(client_ip, identifier)
    async with auth_attempt_repo.locked(bucket_keys) as locked_repo:
        throttle = _build_throttle(locked_repo)
        await throttle.assert_allowed("recovery_reset", client_ip, identifier)
        try:
            await service.reset_password_by_recovery_code(dto)
        except UnauthorizedError:
            await throttle.record_failure("recovery_reset", client_ip, identifier)
            raise
    clear_auth_cookies(response)


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
