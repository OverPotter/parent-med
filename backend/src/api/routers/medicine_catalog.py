"""Роуты: справочник препаратов."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_medicine_catalog_service
from src.application.dto.medicine_catalog import (
    MedicineCatalogCreateDto,
    MedicineCatalogResponseDto,
)
from src.application.services.medicine_catalog_service import MedicineCatalogService

router = APIRouter(prefix="/medicine-catalog", tags=["medicine-catalog"])


@router.get("/{item_id}", response_model=MedicineCatalogResponseDto)
async def get_catalog_item(
    item_id: UUID,
    service: MedicineCatalogService = Depends(get_medicine_catalog_service),
) -> MedicineCatalogResponseDto:
    """Получить препарат из справочника по id."""
    return await service.get_by_id(item_id)


@router.get("", response_model=list[MedicineCatalogResponseDto])
async def search_catalog(
    name: str,
    limit: int = 20,
    service: MedicineCatalogService = Depends(get_medicine_catalog_service),
) -> list[MedicineCatalogResponseDto]:
    """Поиск препаратов по названию (для ручного добавления в аптечку)."""
    return await service.find_by_name(name, limit=limit)


@router.post("", response_model=MedicineCatalogResponseDto, status_code=201)
async def create_catalog_item(
    dto: MedicineCatalogCreateDto,
    service: MedicineCatalogService = Depends(get_medicine_catalog_service),
) -> MedicineCatalogResponseDto:
    """Добавить препарат в справочник."""
    return await service.create(dto)


@router.delete("/{item_id}", status_code=204)
async def delete_catalog_item(
    item_id: UUID,
    service: MedicineCatalogService = Depends(get_medicine_catalog_service),
) -> None:
    """Удалить препарат из справочника."""
    await service.delete(item_id)
