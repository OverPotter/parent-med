"""Реализация репозитория детей."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.child import Child
from src.domain.repositories.child_repository import ChildRepository
from src.infrastructure.database.models.child import ChildModel


class SqlChildRepository(ChildRepository):
    """Репозиторий детей на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: ChildModel) -> Child:
        return Child(
            id=m.id,
            family_id=m.family_id,
            name=m.name,
            birth_date=m.birth_date,
        )

    def _to_model(self, e: Child) -> ChildModel:
        return ChildModel(
            id=e.id,
            family_id=e.family_id,
            name=e.name,
            birth_date=e.birth_date,
        )

    async def get_by_id(self, id: UUID) -> Child | None:
        result = await self._session.execute(select(ChildModel).where(ChildModel.id == id))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_family_id(self, family_id: UUID) -> list[Child]:
        result = await self._session.execute(
            select(ChildModel).where(ChildModel.family_id == family_id).order_by(ChildModel.name)
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: Child) -> Child:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: Child) -> Child:
        result = await self._session.execute(select(ChildModel).where(ChildModel.id == entity.id))
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Child {entity.id} not found")
        row.name = entity.name
        row.birth_date = entity.birth_date
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(select(ChildModel).where(ChildModel.id == id))
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
