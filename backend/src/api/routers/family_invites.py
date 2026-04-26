"""Роуты: приглашения в семью."""

from fastapi import APIRouter, Depends, Response

from src.api.deps import get_auth_service, get_current_account, get_family_invite_service
from src.api.utils.auth_response import build_auth_response
from src.application.dto.auth import AuthenticatedAccount, AuthResponseDto
from src.application.dto.family_invite import (
    FamilyInviteCreateDto,
    FamilyInvitePreviewResponseDto,
    FamilyInviteResponseDto,
)
from src.application.services.base_auth_service import BaseAuthService
from src.application.services.family_invite_service import FamilyInviteService

router = APIRouter(prefix="/family-invites", tags=["family-invites"])


@router.post("", response_model=FamilyInviteResponseDto, status_code=201)
async def create_family_invite(
    dto: FamilyInviteCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyInviteService = Depends(get_family_invite_service),
) -> FamilyInviteResponseDto:
    """Создать invite-ссылку в текущую семью."""
    return await service.create_for_account(
        current_account.family_id,
        current_account.id,
        dto,
    )


@router.get("/dev/latest", response_model=FamilyInvitePreviewResponseDto)
async def get_latest_family_invite_preview_for_dev(
    service: FamilyInviteService = Depends(get_family_invite_service),
) -> FamilyInvitePreviewResponseDto:
    """Dev-only preview последнего активного инвайта без копирования ссылки."""
    return await service.get_latest_preview_for_dev()


@router.get("/{token}", response_model=FamilyInvitePreviewResponseDto)
async def get_family_invite_preview(
    token: str,
    service: FamilyInviteService = Depends(get_family_invite_service),
) -> FamilyInvitePreviewResponseDto:
    """Показать, в какую семью ведёт приглашение."""
    return await service.get_preview(token)


@router.post("/{token}/accept", response_model=AuthResponseDto)
async def accept_family_invite(
    token: str,
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    auth_service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Принять приглашение существующим аккаунтом и перейти в новую семью."""
    auth = await auth_service.accept_family_invite(current_account.id, token)
    return build_auth_response(
        response,
        auth,
        include_tokens=False,
        include_cookies=True,
    )


@router.post("/{token}/accept/native", response_model=AuthResponseDto)
async def accept_family_invite_native(
    token: str,
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    auth_service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Native-вариант принятия приглашения с токенами в JSON."""
    auth = await auth_service.accept_family_invite(current_account.id, token)
    return build_auth_response(
        response,
        auth,
        include_tokens=True,
        include_cookies=False,
    )


@router.post("/dev/latest/accept", response_model=AuthResponseDto)
async def accept_latest_family_invite_for_dev(
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    auth_service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Dev-only: принять последнее активное приглашение без токена."""
    auth = await auth_service.accept_latest_family_invite_for_dev(current_account.id)
    return build_auth_response(
        response,
        auth,
        include_tokens=False,
        include_cookies=True,
    )


@router.post("/dev/latest/accept/native", response_model=AuthResponseDto)
async def accept_latest_family_invite_for_dev_native(
    response: Response,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    auth_service: BaseAuthService = Depends(get_auth_service),
) -> AuthResponseDto:
    """Dev-only native: принять последнее активное приглашение без токена."""
    auth = await auth_service.accept_latest_family_invite_for_dev(current_account.id)
    return build_auth_response(
        response,
        auth,
        include_tokens=True,
        include_cookies=False,
    )
