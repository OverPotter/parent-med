"""Реализация репозитория справочника препаратов."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.medicine_catalog_item import MedicineCatalogItem
from src.domain.repositories.medicine_catalog_repository import MedicineCatalogRepository
from src.infrastructure.database.models.medicine_catalog_item import MedicineCatalogItemModel


class SqlMedicineCatalogRepository(MedicineCatalogRepository):
    """Репозиторий справочника препаратов на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: MedicineCatalogItemModel) -> MedicineCatalogItem:
        return MedicineCatalogItem(
            id=m.id,
            name=m.name,
            form=m.form,
            concentration=m.concentration,
        )

    def _to_model(self, e: MedicineCatalogItem) -> MedicineCatalogItemModel:
        return MedicineCatalogItemModel(
            id=e.id,
            name=e.name,
            form=e.form,
            concentration=e.concentration,
        )

    async def get_by_id(self, id: UUID) -> MedicineCatalogItem | None:
        result = await self._session.execute(
            select(MedicineCatalogItemModel).where(MedicineCatalogItemModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def find_by_name(self, name: str, limit: int = 20) -> list[MedicineCatalogItem]:
        pattern = f"%{name}%"
        result = await self._session.execute(
            select(MedicineCatalogItemModel)
            .where(MedicineCatalogItemModel.name.ilike(pattern))
            .limit(limit)
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: MedicineCatalogItem) -> MedicineCatalogItem:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(MedicineCatalogItemModel).where(MedicineCatalogItemModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
