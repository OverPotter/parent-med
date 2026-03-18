"""Базовый SQLAlchemy-репозиторий для простых CRUD-операций."""

from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

EntityT = TypeVar("EntityT")
ModelT = TypeVar("ModelT")


class BaseSQLAlchemyRepository(Generic[EntityT, ModelT]):
    """Общая реализация get_by_id/add/delete для SQLAlchemy async."""

    def __init__(self, session: AsyncSession, model_type: type[ModelT]) -> None:
        self._session = session
        self._model_type = model_type

    def _to_entity(self, model: ModelT) -> EntityT:
        raise NotImplementedError

    def _to_model(self, entity: EntityT) -> ModelT:
        raise NotImplementedError

    async def get_by_id(self, id: UUID) -> EntityT | None:
        result = await self._session.execute(
            select(self._model_type).where(self._model_type.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: EntityT) -> EntityT:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(self._model_type).where(self._model_type.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
