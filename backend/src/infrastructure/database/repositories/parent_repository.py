"""Реализация репозитория родителей."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.parent import Parent
from src.domain.repositories.parent_repository import ParentRepository
from src.infrastructure.database.models.parent import ParentModel
from src.infrastructure.database.repositories.base_sqlalchemy_repository import (
    BaseSQLAlchemyRepository,
)


class SqlParentRepository(BaseSQLAlchemyRepository[Parent, ParentModel], ParentRepository):
    """Репозиторий родителей на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ParentModel)

    def _to_entity(self, model: ParentModel) -> Parent:
        return Parent(
            id=model.id,
            family_id=model.family_id,
            name=model.name,
            role=model.role,
        )

    def _to_model(self, entity: Parent) -> ParentModel:
        return ParentModel(
            id=entity.id,
            family_id=entity.family_id,
            name=entity.name,
            role=entity.role,
        )

    async def get_by_family_id(self, family_id: UUID) -> list[Parent]:
        result = await self._session.execute(
            select(ParentModel)
            .where(ParentModel.family_id == family_id)
            .order_by(ParentModel.role, ParentModel.name)
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def update(self, entity: Parent) -> Parent:
        result = await self._session.execute(select(ParentModel).where(ParentModel.id == entity.id))
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Parent {entity.id} not found")
        row.name = entity.name
        row.role = entity.role
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)
