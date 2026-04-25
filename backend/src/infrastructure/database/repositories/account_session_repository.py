"""Реализация репозитория refresh-сессий аккаунта."""

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.account_session import AccountSession
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.infrastructure.database.models.account_session import AccountSessionModel


class SqlAccountSessionRepository(AccountSessionRepository):
    """Репозиторий refresh-сессий на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: AccountSessionModel) -> AccountSession:
        return AccountSession(
            id=model.id,
            account_id=model.account_id,
            token_hash=model.token_hash,
            created_at=model.created_at,
            expires_at=model.expires_at,
        )

    def _to_model(self, entity: AccountSession) -> AccountSessionModel:
        return AccountSessionModel(
            id=entity.id,
            account_id=entity.account_id,
            token_hash=entity.token_hash,
            created_at=entity.created_at,
            expires_at=entity.expires_at,
        )

    async def get_by_id(self, id: UUID) -> AccountSession | None:
        result = await self._session.execute(
            select(AccountSessionModel).where(AccountSessionModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_token_hash(self, token_hash: str) -> AccountSession | None:
        result = await self._session.execute(
            select(AccountSessionModel).where(AccountSessionModel.token_hash == token_hash)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: AccountSession) -> AccountSession:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(AccountSessionModel).where(AccountSessionModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False

    async def delete_by_account_id(self, account_id: UUID) -> int:
        result = await self._session.execute(
            delete(AccountSessionModel).where(AccountSessionModel.account_id == account_id)
        )
        await self._session.flush()
        return result.rowcount or 0

    async def delete_other_sessions(self, account_id: UUID, keep_session_id: UUID) -> int:
        result = await self._session.execute(
            delete(AccountSessionModel).where(
                AccountSessionModel.account_id == account_id,
                AccountSessionModel.id != keep_session_id,
            )
        )
        await self._session.flush()
        return result.rowcount or 0
