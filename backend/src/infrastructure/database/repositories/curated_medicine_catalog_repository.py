"""Реализация репозитория curated-справочника препаратов."""

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.curated_medicine_catalog_item import CuratedMedicineCatalogItem
from src.domain.repositories.curated_medicine_catalog_repository import (
    CuratedMedicineCatalogRepository,
)
from src.infrastructure.database.models.curated_medicine_catalog_item import (
    CuratedMedicineCatalogItemModel,
)


class SqlCuratedMedicineCatalogRepository(CuratedMedicineCatalogRepository):
    """Репозиторий пользовательского каталога на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: CuratedMedicineCatalogItemModel) -> CuratedMedicineCatalogItem:
        return CuratedMedicineCatalogItem(
            id=m.id,
            language=m.language,
            display_name=m.display_name,
            active_substance=m.active_substance,
            form=m.form,
            strength=m.strength,
            short_description=m.short_description,
            dosage_summary=m.dosage_summary,
            pediatric_dose_mg_per_kg_min=m.pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=m.pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=m.pediatric_dose_note,
            default_opened_shelf_days=m.default_opened_shelf_days,
            is_otc=m.is_otc,
            is_home_cabinet_relevant=m.is_home_cabinet_relevant,
            search_rank=m.search_rank,
        )

    def _to_model(self, e: CuratedMedicineCatalogItem) -> CuratedMedicineCatalogItemModel:
        return CuratedMedicineCatalogItemModel(
            id=e.id,
            language=e.language,
            display_name=e.display_name,
            active_substance=e.active_substance,
            form=e.form,
            strength=e.strength,
            short_description=e.short_description,
            dosage_summary=e.dosage_summary,
            pediatric_dose_mg_per_kg_min=e.pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=e.pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=e.pediatric_dose_note,
            default_opened_shelf_days=e.default_opened_shelf_days,
            is_otc=e.is_otc,
            is_home_cabinet_relevant=e.is_home_cabinet_relevant,
            search_rank=e.search_rank,
        )

    async def get_by_id(self, id: UUID) -> CuratedMedicineCatalogItem | None:
        result = await self._session.execute(
            select(CuratedMedicineCatalogItemModel).where(CuratedMedicineCatalogItemModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def find_by_name(
        self,
        query: str | None,
        language: str,
        limit: int = 20,
    ) -> list[CuratedMedicineCatalogItem]:
        normalized_query = (query or "").strip()

        statement = (
            select(CuratedMedicineCatalogItemModel)
            .where(CuratedMedicineCatalogItemModel.language == language)
            .where(CuratedMedicineCatalogItemModel.is_home_cabinet_relevant.is_(True))
        )

        if normalized_query:
            pattern = f"%{normalized_query}%"
            statement = statement.where(
                or_(
                    CuratedMedicineCatalogItemModel.display_name.ilike(pattern),
                    CuratedMedicineCatalogItemModel.active_substance.ilike(pattern),
                )
            )

        result = await self._session.execute(
            statement.order_by(
                CuratedMedicineCatalogItemModel.search_rank.desc(),
                func.length(CuratedMedicineCatalogItemModel.display_name).asc(),
                CuratedMedicineCatalogItemModel.display_name.asc(),
            ).limit(limit)
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: CuratedMedicineCatalogItem) -> CuratedMedicineCatalogItem:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(CuratedMedicineCatalogItemModel).where(CuratedMedicineCatalogItemModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
