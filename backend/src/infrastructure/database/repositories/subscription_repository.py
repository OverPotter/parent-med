"""SQLAlchemy repository for subscriptions."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.subscription import Subscription
from src.domain.repositories.subscription_repository import SubscriptionRepository
from src.infrastructure.database.models.subscription import SubscriptionModel


class SqlSubscriptionRepository(SubscriptionRepository):
    """Subscription repository implementation."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: SubscriptionModel) -> Subscription:
        return Subscription(
            id=model.id,
            family_id=model.family_id,
            plan_id=model.plan_id,
            provider=model.provider,
            provider_customer_id=model.provider_customer_id,
            provider_subscription_id=model.provider_subscription_id,
            status=model.status,
            starts_at=model.starts_at,
            expires_at=model.expires_at,
            trial_ends_at=model.trial_ends_at,
            canceled_at=model.canceled_at,
            raw_payload_json=dict(model.raw_payload_json or {}),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: Subscription) -> SubscriptionModel:
        return SubscriptionModel(
            id=entity.id,
            family_id=entity.family_id,
            plan_id=entity.plan_id,
            provider=entity.provider,
            provider_customer_id=entity.provider_customer_id,
            provider_subscription_id=entity.provider_subscription_id,
            status=entity.status,
            starts_at=entity.starts_at,
            expires_at=entity.expires_at,
            trial_ends_at=entity.trial_ends_at,
            canceled_at=entity.canceled_at,
            raw_payload_json=dict(entity.raw_payload_json),
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, id: UUID) -> Subscription | None:
        result = await self._session.execute(
            select(SubscriptionModel).where(SubscriptionModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_current_by_family_id(self, family_id: UUID) -> Subscription | None:
        result = await self._session.execute(
            select(SubscriptionModel)
            .where(SubscriptionModel.family_id == family_id)
            .order_by(SubscriptionModel.updated_at.desc(), SubscriptionModel.created_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def list_by_family_id(self, family_id: UUID) -> list[Subscription]:
        result = await self._session.execute(
            select(SubscriptionModel)
            .where(SubscriptionModel.family_id == family_id)
            .order_by(SubscriptionModel.updated_at.desc(), SubscriptionModel.created_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def add(self, entity: Subscription) -> Subscription:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: Subscription) -> Subscription:
        result = await self._session.execute(
            select(SubscriptionModel).where(SubscriptionModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Subscription {entity.id} not found")
        row.plan_id = entity.plan_id
        row.provider = entity.provider
        row.provider_customer_id = entity.provider_customer_id
        row.provider_subscription_id = entity.provider_subscription_id
        row.status = entity.status
        row.starts_at = entity.starts_at
        row.expires_at = entity.expires_at
        row.trial_ends_at = entity.trial_ends_at
        row.canceled_at = entity.canceled_at
        row.raw_payload_json = dict(entity.raw_payload_json)
        row.updated_at = entity.updated_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(SubscriptionModel).where(SubscriptionModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
