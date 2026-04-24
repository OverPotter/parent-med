"""Реализация репозитория recovery-токенов пароля."""

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.password_recovery_token import PasswordRecoveryToken
from src.domain.repositories.password_recovery_token_repository import (
    PasswordRecoveryTokenRepository,
)
from src.infrastructure.database.models.password_recovery_token import (
    PasswordRecoveryTokenModel,
)


class SqlPasswordRecoveryTokenRepository(PasswordRecoveryTokenRepository):
    """Репозиторий recovery-токенов на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: PasswordRecoveryTokenModel) -> PasswordRecoveryToken:
        return PasswordRecoveryToken(
            id=model.id,
            account_id=model.account_id,
            token_hash=model.token_hash,
            expires_at=model.expires_at,
            created_at=model.created_at,
            used_at=model.used_at,
        )

    def _to_model(self, entity: PasswordRecoveryToken) -> PasswordRecoveryTokenModel:
        return PasswordRecoveryTokenModel(
            id=entity.id,
            account_id=entity.account_id,
            token_hash=entity.token_hash,
            expires_at=entity.expires_at,
            created_at=entity.created_at,
            used_at=entity.used_at,
        )

    async def add(self, entity: PasswordRecoveryToken) -> PasswordRecoveryToken:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_token_hash(self, token_hash: str) -> PasswordRecoveryToken | None:
        result = await self._session.execute(
            select(PasswordRecoveryTokenModel).where(
                PasswordRecoveryTokenModel.token_hash == token_hash
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def update(self, entity: PasswordRecoveryToken) -> PasswordRecoveryToken:
        result = await self._session.execute(
            select(PasswordRecoveryTokenModel).where(PasswordRecoveryTokenModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Password recovery token {entity.id} not found")
        row.account_id = entity.account_id
        row.token_hash = entity.token_hash
        row.expires_at = entity.expires_at
        row.created_at = entity.created_at
        row.used_at = entity.used_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete_by_account_id(self, account_id: UUID) -> int:
        result = await self._session.execute(
            delete(PasswordRecoveryTokenModel).where(
                PasswordRecoveryTokenModel.account_id == account_id
            )
        )
        await self._session.flush()
        return result.rowcount or 0
