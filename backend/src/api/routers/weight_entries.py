"""Роуты: записи веса."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_weight_entry_service
from src.application.dto.weight_entry import WeightEntryCreateDto, WeightEntryResponseDto
from src.application.services.weight_entry_service import WeightEntryService

router = APIRouter(prefix="/weight-entries", tags=["weight-entries"])


@router.get("/{entry_id}", response_model=WeightEntryResponseDto)
async def get_weight_entry(
    entry_id: UUID,
    service: WeightEntryService = Depends(get_weight_entry_service),
) -> WeightEntryResponseDto:
    """Получить запись веса по id."""
    return await service.get_by_id(entry_id)


@router.get("", response_model=list[WeightEntryResponseDto])
async def list_weight_entries(
    child_id: UUID,
    service: WeightEntryService = Depends(get_weight_entry_service),
) -> list[WeightEntryResponseDto]:
    """История веса по ребёнку."""
    return await service.get_by_child_id(child_id)


@router.get("/child/{child_id}/latest", response_model=WeightEntryResponseDto | None)
async def get_latest_weight(
    child_id: UUID,
    service: WeightEntryService = Depends(get_weight_entry_service),
) -> WeightEntryResponseDto | None:
    """Последняя запись веса по ребёнку (для дозировок)."""
    return await service.get_latest_for_child(child_id)


@router.post("", response_model=WeightEntryResponseDto, status_code=201)
async def create_weight_entry(
    dto: WeightEntryCreateDto,
    service: WeightEntryService = Depends(get_weight_entry_service),
) -> WeightEntryResponseDto:
    """Добавить запись веса."""
    return await service.create(dto)


@router.delete("/{entry_id}", status_code=204)
async def delete_weight_entry(
    entry_id: UUID,
    service: WeightEntryService = Depends(get_weight_entry_service),
) -> None:
    """Удалить запись веса."""
    await service.delete(entry_id)
