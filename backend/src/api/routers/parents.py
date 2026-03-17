"""Роуты: родители внутри семьи."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_current_account, get_parent_service
from src.application.services.auth_service import AuthenticatedAccount
from src.application.dto.parent import ParentCreateDto, ParentResponseDto, ParentUpdateDto
from src.application.services.parent_service import ParentService

router = APIRouter(prefix="/parents", tags=["parents"])


@router.get("/{parent_id}", response_model=ParentResponseDto)
async def get_parent(
    parent_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ParentService = Depends(get_parent_service),
) -> ParentResponseDto:
    """Получить родителя по id."""
    return await service.get_by_id_for_account(parent_id, account.family_id)


@router.get("", response_model=list[ParentResponseDto])
async def list_parents(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ParentService = Depends(get_parent_service),
) -> list[ParentResponseDto]:
    """Список родителей семьи."""
    return await service.get_by_family_id_for_account(family_id, account.family_id)


@router.post("", response_model=ParentResponseDto, status_code=201)
async def create_parent(
    dto: ParentCreateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ParentService = Depends(get_parent_service),
) -> ParentResponseDto:
    """Создать родителя внутри семьи."""
    return await service.create_for_account(dto, account.family_id)


@router.patch("/{parent_id}", response_model=ParentResponseDto)
async def update_parent(
    parent_id: UUID,
    dto: ParentUpdateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ParentService = Depends(get_parent_service),
) -> ParentResponseDto:
    """Обновить родителя."""
    return await service.update_for_account(parent_id, dto, account.family_id)


@router.delete("/{parent_id}", status_code=204)
async def delete_parent(
    parent_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ParentService = Depends(get_parent_service),
) -> None:
    """Удалить родителя."""
    await service.delete_for_account(parent_id, account.family_id)
