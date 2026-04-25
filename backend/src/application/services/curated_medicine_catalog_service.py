"""Сервис curated-справочника препаратов."""

from uuid import UUID

from src.application.dto.curated_medicine_catalog import CuratedMedicineCatalogResponseDto
from src.core.exceptions import NotFoundError
from src.domain.entities.curated_medicine_catalog_item import CuratedMedicineCatalogItem
from src.domain.repositories.curated_medicine_catalog_repository import (
    CuratedMedicineCatalogRepository,
)


class CuratedMedicineCatalogService:
    """Сервис короткого пользовательского каталога препаратов."""

    def __init__(self, catalog_repo: CuratedMedicineCatalogRepository) -> None:
        self._repo = catalog_repo

    def _to_response(
        self,
        entity: CuratedMedicineCatalogItem,
    ) -> CuratedMedicineCatalogResponseDto:
        return CuratedMedicineCatalogResponseDto(
            id=entity.id,
            language=entity.language,
            display_name=entity.display_name,
            active_substance=entity.active_substance,
            form=entity.form,
            strength=entity.strength,
            short_description=entity.short_description,
            dosage_summary=entity.dosage_summary,
            pediatric_dose_mg_per_kg_min=entity.pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=entity.pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=entity.pediatric_dose_note,
            default_opened_shelf_days=entity.default_opened_shelf_days,
            is_otc=entity.is_otc,
            is_home_cabinet_relevant=entity.is_home_cabinet_relevant,
            search_rank=entity.search_rank,
        )

    async def get_by_id(self, id: UUID) -> CuratedMedicineCatalogResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Препарат не найден", resource="curated_medicine_catalog")
        return self._to_response(entity)

    async def find_by_name(
        self,
        query: str | None,
        language: str = "ru",
        limit: int = 20,
    ) -> list[CuratedMedicineCatalogResponseDto]:
        entities = await self._repo.find_by_name(
            query=query,
            language=language,
            limit=limit,
        )
        return [self._to_response(e) for e in entities]
