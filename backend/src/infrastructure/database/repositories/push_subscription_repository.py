"""Реализация репозитория push-подписок."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.push_subscription import PushSubscription
from src.domain.repositories.push_subscription_repository import PushSubscriptionRepository
from src.infrastructure.database.models.push_subscription import PushSubscriptionModel


class SqlPushSubscriptionRepository(PushSubscriptionRepository):
    """Репозиторий push-подписок на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: PushSubscriptionModel) -> PushSubscription:
        return PushSubscription(
            id=model.id,
            account_id=model.account_id,
            channel=model.channel,
            endpoint=model.endpoint,
            p256dh_key=model.p256dh_key,
            auth_key=model.auth_key,
            native_token=model.native_token,
            platform=model.platform,
            expiration_time=model.expiration_time,
            user_agent=model.user_agent,
            device_label=model.device_label,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: PushSubscription) -> PushSubscriptionModel:
        return PushSubscriptionModel(
            id=entity.id,
            account_id=entity.account_id,
            channel=entity.channel,
            endpoint=entity.endpoint,
            p256dh_key=entity.p256dh_key,
            auth_key=entity.auth_key,
            native_token=entity.native_token,
            platform=entity.platform,
            expiration_time=entity.expiration_time,
            user_agent=entity.user_agent,
            device_label=entity.device_label,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, id: UUID) -> PushSubscription | None:
        result = await self._session.execute(
            select(PushSubscriptionModel).where(PushSubscriptionModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_endpoint(self, endpoint: str) -> PushSubscription | None:
        result = await self._session.execute(
            select(PushSubscriptionModel).where(PushSubscriptionModel.endpoint == endpoint)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_native_token(self, native_token: str) -> PushSubscription | None:
        result = await self._session.execute(
            select(PushSubscriptionModel).where(PushSubscriptionModel.native_token == native_token)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_account_id(self, account_id: UUID) -> list[PushSubscription]:
        result = await self._session.execute(
            select(PushSubscriptionModel)
            .where(PushSubscriptionModel.account_id == account_id)
            .order_by(PushSubscriptionModel.updated_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def add(self, entity: PushSubscription) -> PushSubscription:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: PushSubscription) -> PushSubscription:
        result = await self._session.execute(
            select(PushSubscriptionModel).where(PushSubscriptionModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"PushSubscription {entity.id} not found")
        row.account_id = entity.account_id
        row.channel = entity.channel
        row.endpoint = entity.endpoint
        row.p256dh_key = entity.p256dh_key
        row.auth_key = entity.auth_key
        row.native_token = entity.native_token
        row.platform = entity.platform
        row.expiration_time = entity.expiration_time
        row.user_agent = entity.user_agent
        row.device_label = entity.device_label
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(PushSubscriptionModel).where(PushSubscriptionModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False

    async def delete_by_endpoint(self, endpoint: str) -> bool:
        result = await self._session.execute(
            select(PushSubscriptionModel).where(PushSubscriptionModel.endpoint == endpoint)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
