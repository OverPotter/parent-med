"""Реализация репозитория аккаунтов."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.account import Account
from src.domain.entities.family_access import (
    deserialize_family_access_policy,
    serialize_family_access_policy,
)
from src.domain.entities.family_roles import normalize_family_role
from src.domain.repositories.account_repository import AccountRepository
from src.infrastructure.database.models.account import AccountModel


class SqlAccountRepository(AccountRepository):
    """Репозиторий аккаунтов на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: AccountModel) -> Account:
        return Account(
            id=model.id,
            login=model.login,
            email=model.email,
            password_hash=model.password_hash,
            family_id=model.family_id,
            display_name=model.display_name,
            relationship_label=model.relationship_label,
            phone=model.phone,
            preferred_language=model.preferred_language,
            family_role=normalize_family_role(model.family_role),
            push_before_reminder_minutes=model.push_before_reminder_minutes,
            pillbox_push_before_reminder_minutes=model.pillbox_push_before_reminder_minutes,
            cabinet_notify_10_days=model.cabinet_notify_15_days,
            cabinet_notify_7_days=model.cabinet_notify_7_days,
            cabinet_notify_3_days=model.cabinet_notify_3_days,
            cabinet_notify_1_day=model.cabinet_notify_1_day,
            live_activity_sleep_enabled=model.live_activity_sleep_enabled,
            live_activity_feeding_enabled=model.live_activity_feeding_enabled,
            live_activity_illness_enabled=model.live_activity_illness_enabled,
            created_at=model.created_at,
            access_policy=deserialize_family_access_policy(model.access_policy),
        )

    def _to_model(self, entity: Account) -> AccountModel:
        return AccountModel(
            id=entity.id,
            login=entity.login,
            email=entity.email,
            password_hash=entity.password_hash,
            family_id=entity.family_id,
            display_name=entity.display_name,
            relationship_label=entity.relationship_label,
            phone=entity.phone,
            preferred_language=entity.preferred_language,
            family_role=normalize_family_role(entity.family_role),
            access_policy=serialize_family_access_policy(entity.access_policy),
            push_before_reminder_minutes=entity.push_before_reminder_minutes,
            pillbox_push_before_reminder_minutes=entity.pillbox_push_before_reminder_minutes,
            cabinet_notify_15_days=entity.cabinet_notify_10_days,
            cabinet_notify_7_days=entity.cabinet_notify_7_days,
            cabinet_notify_3_days=entity.cabinet_notify_3_days,
            cabinet_notify_1_day=entity.cabinet_notify_1_day,
            live_activity_sleep_enabled=entity.live_activity_sleep_enabled,
            live_activity_feeding_enabled=entity.live_activity_feeding_enabled,
            live_activity_illness_enabled=entity.live_activity_illness_enabled,
            created_at=entity.created_at,
        )

    async def get_by_id(self, id: UUID) -> Account | None:
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == id))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_login(self, login: str) -> Account | None:
        result = await self._session.execute(
            select(AccountModel).where(AccountModel.login == login)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_email(self, email: str) -> Account | None:
        result = await self._session.execute(
            select(AccountModel).where(AccountModel.email == email)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_family_id(self, family_id: UUID) -> Account | None:
        result = await self._session.execute(
            select(AccountModel)
            .where(AccountModel.family_id == family_id)
            .order_by(AccountModel.created_at.asc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def list_by_family_id(self, family_id: UUID) -> list[Account]:
        result = await self._session.execute(
            select(AccountModel)
            .where(AccountModel.family_id == family_id)
            .order_by(AccountModel.created_at.asc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def add(self, entity: Account) -> Account:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: Account) -> Account:
        result = await self._session.execute(
            select(AccountModel).where(AccountModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Account {entity.id} not found")
        row.login = entity.login
        row.email = entity.email
        row.password_hash = entity.password_hash
        row.family_id = entity.family_id
        row.display_name = entity.display_name
        row.relationship_label = entity.relationship_label
        row.phone = entity.phone
        row.preferred_language = entity.preferred_language
        row.family_role = normalize_family_role(entity.family_role)
        row.access_policy = serialize_family_access_policy(entity.access_policy)
        row.push_before_reminder_minutes = entity.push_before_reminder_minutes
        row.pillbox_push_before_reminder_minutes = entity.pillbox_push_before_reminder_minutes
        row.cabinet_notify_15_days = entity.cabinet_notify_10_days
        row.cabinet_notify_7_days = entity.cabinet_notify_7_days
        row.cabinet_notify_3_days = entity.cabinet_notify_3_days
        row.cabinet_notify_1_day = entity.cabinet_notify_1_day
        row.live_activity_sleep_enabled = entity.live_activity_sleep_enabled
        row.live_activity_feeding_enabled = entity.live_activity_feeding_enabled
        row.live_activity_illness_enabled = entity.live_activity_illness_enabled
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == id))
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
