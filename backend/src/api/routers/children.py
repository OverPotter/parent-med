"""Роуты: дети."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_child_service
from src.application.dto.child import ChildCreateDto, ChildResponseDto, ChildUpdateDto
from src.application.services.child_service import ChildService

router = APIRouter(prefix="/children", tags=["children"])


@router.get("/{child_id}", response_model=ChildResponseDto)
async def get_child(
    child_id: UUID,
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Получить ребёнка по id."""
    return await service.get_by_id(child_id)


@router.get("", response_model=list[ChildResponseDto])
async def list_children(
    family_id: UUID,
    service: ChildService = Depends(get_child_service),
) -> list[ChildResponseDto]:
    """Список детей в семье."""
    return await service.get_by_family_id(family_id)


@router.post("", response_model=ChildResponseDto, status_code=201)
async def create_child(
    dto: ChildCreateDto,
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Добавить ребёнка."""
    return await service.create(dto)


@router.patch("/{child_id}", response_model=ChildResponseDto)
async def update_child(
    child_id: UUID,
    dto: ChildUpdateDto,
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Обновить ребёнка."""
    return await service.update(child_id, dto)


@router.delete("/{child_id}", status_code=204)
async def delete_child(
    child_id: UUID,
    service: ChildService = Depends(get_child_service),
) -> None:
    """Удалить ребёнка."""
    await service.delete(child_id)
