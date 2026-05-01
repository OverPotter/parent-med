"""Роуты: приглашения в семью."""

from fastapi import APIRouter, Depends

from src.api.deps import get_current_account, get_family_invite_service
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.family_invite import (
    FamilyInviteCreateDto,
    FamilyInvitePreviewResponseDto,
    FamilyInviteResponseDto,
)
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
