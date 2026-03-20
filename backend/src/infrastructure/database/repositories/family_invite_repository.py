"""Реализация репозитория приглашений в семью."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.family_invite import FamilyInvite
from src.domain.repositories.family_invite_repository import FamilyInviteRepository
from src.infrastructure.database.models.family_invite import FamilyInviteModel


class SqlFamilyInviteRepository(FamilyInviteRepository):
    """Репозиторий invite-ссылок на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: FamilyInviteModel) -> FamilyInvite:
        return FamilyInvite(
            id=model.id,
            family_id=model.family_id,
            created_by_account_id=model.created_by_account_id,
            token_hash=model.token_hash,
            family_role=model.family_role,
            created_at=model.created_at,
            expires_at=model.expires_at,
            accepted_at=model.accepted_at,
            accepted_by_account_id=model.accepted_by_account_id,
        )

    def _to_model(self, entity: FamilyInvite) -> FamilyInviteModel:
        return FamilyInviteModel(
            id=entity.id,
            family_id=entity.family_id,
            created_by_account_id=entity.created_by_account_id,
            token_hash=entity.token_hash,
            family_role=entity.family_role,
            created_at=entity.created_at,
            expires_at=entity.expires_at,
            accepted_at=entity.accepted_at,
            accepted_by_account_id=entity.accepted_by_account_id,
        )

    async def get_by_id(self, id: UUID) -> FamilyInvite | None:
        result = await self._session.execute(
            select(FamilyInviteModel).where(FamilyInviteModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_token_hash(self, token_hash: str) -> FamilyInvite | None:
        result = await self._session.execute(
            select(FamilyInviteModel).where(FamilyInviteModel.token_hash == token_hash)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: FamilyInvite) -> FamilyInvite:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        result = await self._session.execute(
            select(FamilyInviteModel).where(FamilyInviteModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"FamilyInvite {entity.id} not found")
        row.family_id = entity.family_id
        row.created_by_account_id = entity.created_by_account_id
        row.token_hash = entity.token_hash
        row.family_role = entity.family_role
        row.created_at = entity.created_at
        row.expires_at = entity.expires_at
        row.accepted_at = entity.accepted_at
        row.accepted_by_account_id = entity.accepted_by_account_id
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(FamilyInviteModel).where(FamilyInviteModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
