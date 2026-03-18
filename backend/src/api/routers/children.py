"""Роуты: дети."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_child_service, get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.child import ChildCreateDto, ChildResponseDto, ChildUpdateDto
from src.application.services.child_service import ChildService

router = APIRouter(prefix="/children", tags=["children"])


@router.get("/{child_id}", response_model=ChildResponseDto)
async def get_child(
    child_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Получить ребёнка по id."""
    return await service.get_by_id_for_account(child_id, account.family_id)


@router.get("", response_model=list[ChildResponseDto])
async def list_children(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> list[ChildResponseDto]:
    """Список детей в семье."""
    return await service.get_by_family_id_for_account(family_id, account.family_id)


@router.post("", response_model=ChildResponseDto, status_code=201)
async def create_child(
    dto: ChildCreateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Добавить ребёнка."""
    return await service.create_for_account(dto, account.family_id)


@router.patch("/{child_id}", response_model=ChildResponseDto)
async def update_child(
    child_id: UUID,
    dto: ChildUpdateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Обновить ребёнка."""
    return await service.update_for_account(child_id, dto, account.family_id)


@router.delete("/{child_id}", status_code=204)
async def delete_child(
    child_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> None:
    """Удалить ребёнка."""
    await service.delete_for_account(child_id, account.family_id)
