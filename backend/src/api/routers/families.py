"""Роуты: семьи."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_family_service
from src.application.dto.family import FamilyCreateDto, FamilyResponseDto, FamilyUpdateDto
from src.application.services.family_service import FamilyService

router = APIRouter(prefix="/families", tags=["families"])


@router.get("/{family_id}", response_model=FamilyResponseDto)
async def get_family(
    family_id: UUID,
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Получить семью по id."""
    return await service.get_by_id(family_id)


@router.post("", response_model=FamilyResponseDto, status_code=201)
async def create_family(
    dto: FamilyCreateDto,
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Создать семью."""
    return await service.create(dto)


@router.patch("/{family_id}", response_model=FamilyResponseDto)
async def update_family(
    family_id: UUID,
    dto: FamilyUpdateDto,
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Обновить семью."""
    return await service.update(family_id, dto)


@router.delete("/{family_id}", status_code=204)
async def delete_family(
    family_id: UUID,
    service: FamilyService = Depends(get_family_service),
) -> None:
    """Удалить семью."""
    await service.delete(family_id)
