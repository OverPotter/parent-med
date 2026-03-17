"""Роуты: родители внутри семьи."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_parent_service
from src.application.dto.parent import ParentCreateDto, ParentResponseDto, ParentUpdateDto
from src.application.services.parent_service import ParentService

router = APIRouter(prefix="/parents", tags=["parents"])


@router.get("/{parent_id}", response_model=ParentResponseDto)
async def get_parent(
    parent_id: UUID,
    service: ParentService = Depends(get_parent_service),
) -> ParentResponseDto:
    """Получить родителя по id."""
    return await service.get_by_id(parent_id)


@router.get("", response_model=list[ParentResponseDto])
async def list_parents(
    family_id: UUID,
    service: ParentService = Depends(get_parent_service),
) -> list[ParentResponseDto]:
    """Список родителей семьи."""
    return await service.get_by_family_id(family_id)


@router.post("", response_model=ParentResponseDto, status_code=201)
async def create_parent(
    dto: ParentCreateDto,
    service: ParentService = Depends(get_parent_service),
) -> ParentResponseDto:
    """Создать родителя внутри семьи."""
    return await service.create(dto)


@router.patch("/{parent_id}", response_model=ParentResponseDto)
async def update_parent(
    parent_id: UUID,
    dto: ParentUpdateDto,
    service: ParentService = Depends(get_parent_service),
) -> ParentResponseDto:
    """Обновить родителя."""
    return await service.update(parent_id, dto)


@router.delete("/{parent_id}", status_code=204)
async def delete_parent(
    parent_id: UUID,
    service: ParentService = Depends(get_parent_service),
) -> None:
    """Удалить родителя."""
    await service.delete(parent_id)
