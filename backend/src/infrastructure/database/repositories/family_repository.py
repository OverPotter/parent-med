"""Реализация репозитория семей."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.family import Family
from src.domain.repositories.family_repository import FamilyRepository
from src.infrastructure.database.models.family import FamilyModel


class SqlFamilyRepository(FamilyRepository):
    """Репозиторий семей на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: FamilyModel) -> Family:
        return Family(id=m.id, name=m.name)

    def _to_model(self, e: Family) -> FamilyModel:
        return FamilyModel(id=e.id, name=e.name)

    async def list_all(self) -> list[Family]:
        result = await self._session.execute(select(FamilyModel).order_by(FamilyModel.name))
        return [self._to_entity(row) for row in result.scalars().all()]

    async def get_by_id(self, id: UUID) -> Family | None:
        result = await self._session.execute(select(FamilyModel).where(FamilyModel.id == id))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: Family) -> Family:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: Family) -> Family:
        result = await self._session.execute(select(FamilyModel).where(FamilyModel.id == entity.id))
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Family {entity.id} not found")
        row.name = entity.name
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(select(FamilyModel).where(FamilyModel.id == id))
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
