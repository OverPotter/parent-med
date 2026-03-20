"""Реализация репозитория приёмов лекарств."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.administration_event import AdministrationEvent
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.infrastructure.database.models.illness_episode_event import IllnessEpisodeEventModel


class SqlAdministrationEventRepository(AdministrationEventRepository):
    """Репозиторий приёмов лекарств на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: IllnessEpisodeEventModel) -> AdministrationEvent:
        return AdministrationEvent(
            id=m.id,
            episode_id=m.episode_id,
            household_medicine_id=m.household_medicine_id,
            custom_medicine_name=m.comment,
            administered_at=m.occurred_at,
            administered_by_account_id=m.administered_by_account_id,
            administered_by_name_snapshot=m.administered_by_name_snapshot,
            amount=m.amount or "",
            unit=m.unit,
            reason=m.reason,
        )

    def _to_model(self, e: AdministrationEvent) -> IllnessEpisodeEventModel:
        return IllnessEpisodeEventModel(
            id=e.id,
            episode_id=e.episode_id,
            event_type="administration",
            household_medicine_id=e.household_medicine_id,
            occurred_at=e.administered_at,
            administered_by_account_id=e.administered_by_account_id,
            administered_by_name_snapshot=e.administered_by_name_snapshot,
            amount=e.amount,
            unit=e.unit,
            reason=e.reason,
            comment=e.custom_medicine_name,
        )

    async def get_by_id(self, id: UUID) -> AdministrationEvent | None:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.id == id,
                IllnessEpisodeEventModel.event_type == "administration",
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_episode_id(self, episode_id: UUID) -> list[AdministrationEvent]:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel)
            .where(
                IllnessEpisodeEventModel.episode_id == episode_id,
                IllnessEpisodeEventModel.event_type == "administration",
            )
            .order_by(IllnessEpisodeEventModel.occurred_at.desc())
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
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.id == id,
                IllnessEpisodeEventModel.event_type == "administration",
            )
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False

    async def clear_household_medicine_references(
        self,
        household_medicine_id: UUID,
        fallback_medicine_name: str,
    ) -> None:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.event_type == "administration",
                IllnessEpisodeEventModel.household_medicine_id == household_medicine_id,
            )
        )
        rows = result.scalars().all()
        for row in rows:
            row.household_medicine_id = None
            if not (row.comment or "").strip():
                row.comment = fallback_medicine_name
        if rows:
            await self._session.flush()
