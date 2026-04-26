"""SQLAlchemy repository for billing events."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.billing_event import BillingEvent
from src.domain.repositories.billing_event_repository import BillingEventRepository
from src.infrastructure.database.models.billing_event import BillingEventModel


class SqlBillingEventRepository(BillingEventRepository):
    """Billing event repository implementation."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: BillingEventModel) -> BillingEvent:
        return BillingEvent(
            id=model.id,
            subscription_id=model.subscription_id,
            family_id=model.family_id,
            provider=model.provider,
            event_type=model.event_type,
            external_event_id=model.external_event_id,
            payload_json=dict(model.payload_json or {}),
            processed_at=model.processed_at,
            created_at=model.created_at,
        )

    def _to_model(self, entity: BillingEvent) -> BillingEventModel:
        return BillingEventModel(
            id=entity.id,
            subscription_id=entity.subscription_id,
            family_id=entity.family_id,
            provider=entity.provider,
            event_type=entity.event_type,
            external_event_id=entity.external_event_id,
            payload_json=dict(entity.payload_json),
            processed_at=entity.processed_at,
            created_at=entity.created_at,
        )

    async def get_by_id(self, id: UUID) -> BillingEvent | None:
        result = await self._session.execute(
            select(BillingEventModel).where(BillingEventModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_external_event_id(self, external_event_id: str) -> BillingEvent | None:
        result = await self._session.execute(
            select(BillingEventModel).where(
                BillingEventModel.external_event_id == external_event_id
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: BillingEvent) -> BillingEvent:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: BillingEvent) -> BillingEvent:
        result = await self._session.execute(
            select(BillingEventModel).where(BillingEventModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"BillingEvent {entity.id} not found")
        row.subscription_id = entity.subscription_id
        row.provider = entity.provider
        row.event_type = entity.event_type
        row.external_event_id = entity.external_event_id
        row.payload_json = dict(entity.payload_json)
        row.processed_at = entity.processed_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(BillingEventModel).where(BillingEventModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
