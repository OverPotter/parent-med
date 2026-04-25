"""Роуты: curated-справочник препаратов."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from src.api.deps import get_curated_medicine_catalog_service
from src.application.dto.curated_medicine_catalog import CuratedMedicineCatalogResponseDto
from src.application.services.curated_medicine_catalog_service import (
    CuratedMedicineCatalogService,
)

router = APIRouter(prefix="/curated-medicine-catalog", tags=["curated-medicine-catalog"])


@router.get("/{item_id}", response_model=CuratedMedicineCatalogResponseDto)
async def get_catalog_item(
    item_id: UUID,
    service: CuratedMedicineCatalogService = Depends(get_curated_medicine_catalog_service),
) -> CuratedMedicineCatalogResponseDto:
    """Получить препарат из curated-справочника по id."""
    return await service.get_by_id(item_id)


@router.get("", response_model=list[CuratedMedicineCatalogResponseDto])
async def search_catalog(
    query: str | None = Query(None, min_length=1),
    language: str = Query("ru", min_length=2, max_length=8),
    limit: int = Query(20, ge=1, le=100),
    service: CuratedMedicineCatalogService = Depends(get_curated_medicine_catalog_service),
) -> list[CuratedMedicineCatalogResponseDto]:
    """Поиск по curated-каталогу для будущего пользовательского выбора."""
    return await service.find_by_name(query=query, language=language, limit=limit)
