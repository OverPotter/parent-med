"""Реализация репозитория аккаунтов."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.account import Account
from src.domain.repositories.account_repository import AccountRepository
from src.infrastructure.database.models.account import AccountModel


class SqlAccountRepository(AccountRepository):
    """Репозиторий аккаунтов на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: AccountModel) -> Account:
        return Account(
            id=model.id,
            email=model.email,
            password_hash=model.password_hash,
            family_id=model.family_id,
            created_at=model.created_at,
        )

    def _to_model(self, entity: Account) -> AccountModel:
        return AccountModel(
            id=entity.id,
            email=entity.email,
            password_hash=entity.password_hash,
            family_id=entity.family_id,
            created_at=entity.created_at,
        )

    async def get_by_id(self, id: UUID) -> Account | None:
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == id))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_email(self, email: str) -> Account | None:
        result = await self._session.execute(select(AccountModel).where(AccountModel.email == email))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: Account) -> Account:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == id))
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
