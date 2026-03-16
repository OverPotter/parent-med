"""Реализация репозитория приёмов лекарств."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.administration_event import AdministrationEvent
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.infrastructure.database.models.administration_event import AdministrationEventModel


class SqlAdministrationEventRepository(AdministrationEventRepository):
    """Репозиторий приёмов лекарств на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: AdministrationEventModel) -> AdministrationEvent:
        return AdministrationEvent(
            id=m.id,
            episode_id=m.episode_id,
            household_medicine_id=m.household_medicine_id,
            administered_at=m.administered_at,
            amount=m.amount,
            unit=m.unit,
            reason=m.reason,
        )

    def _to_model(self, e: AdministrationEvent) -> AdministrationEventModel:
        return AdministrationEventModel(
            id=e.id,
            episode_id=e.episode_id,
            household_medicine_id=e.household_medicine_id,
            administered_at=e.administered_at,
            amount=e.amount,
            unit=e.unit,
            reason=e.reason,
        )

    async def get_by_id(self, id: UUID) -> AdministrationEvent | None:
        result = await self._session.execute(
            select(AdministrationEventModel).where(AdministrationEventModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_episode_id(self, episode_id: UUID) -> list[AdministrationEvent]:
        result = await self._session.execute(
            select(AdministrationEventModel)
            .where(AdministrationEventModel.episode_id == episode_id)
            .order_by(AdministrationEventModel.administered_at.desc())
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: AdministrationEvent) -> AdministrationEvent:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(AdministrationEventModel).where(AdministrationEventModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
