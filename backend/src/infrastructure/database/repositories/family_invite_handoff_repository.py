"""Реализация репозитория handoff-сессий invite-flow."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.family_invite_handoff import FamilyInviteHandoff
from src.domain.repositories.family_invite_handoff_repository import (
    FamilyInviteHandoffRepository,
)
from src.infrastructure.database.models.family_invite_handoff import FamilyInviteHandoffModel


class SqlFamilyInviteHandoffRepository(FamilyInviteHandoffRepository):
    """Репозиторий handoff-сессий invite-flow на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _to_entity(model: FamilyInviteHandoffModel) -> FamilyInviteHandoff:
        return FamilyInviteHandoff(
            id=model.id,
            handoff_token_hash=model.handoff_token_hash,
            invite_id=model.invite_id,
            family_id=model.family_id,
            family_name=model.family_name,
            family_role=model.family_role,
            created_at=model.created_at,
            expires_at=model.expires_at,
            consumed_at=model.consumed_at,
        )

    @staticmethod
    def _to_model(entity: FamilyInviteHandoff) -> FamilyInviteHandoffModel:
        return FamilyInviteHandoffModel(
            id=entity.id,
            handoff_token_hash=entity.handoff_token_hash,
            invite_id=entity.invite_id,
            family_id=entity.family_id,
            family_name=entity.family_name,
            family_role=entity.family_role,
            created_at=entity.created_at,
            expires_at=entity.expires_at,
            consumed_at=entity.consumed_at,
        )

    async def get_by_id(self, id: UUID) -> FamilyInviteHandoff | None:
        result = await self._session.execute(
            select(FamilyInviteHandoffModel).where(FamilyInviteHandoffModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_handoff_token_hash(self, handoff_token_hash: str) -> FamilyInviteHandoff | None:
        result = await self._session.execute(
            select(FamilyInviteHandoffModel).where(
                FamilyInviteHandoffModel.handoff_token_hash == handoff_token_hash
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: FamilyInviteHandoff) -> FamilyInviteHandoff:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: FamilyInviteHandoff) -> FamilyInviteHandoff:
        result = await self._session.execute(
            select(FamilyInviteHandoffModel).where(FamilyInviteHandoffModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"FamilyInviteHandoff {entity.id} not found")
        row.handoff_token_hash = entity.handoff_token_hash
        row.invite_id = entity.invite_id
        row.family_id = entity.family_id
        row.family_name = entity.family_name
        row.family_role = entity.family_role
        row.created_at = entity.created_at
        row.expires_at = entity.expires_at
        row.consumed_at = entity.consumed_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(FamilyInviteHandoffModel).where(FamilyInviteHandoffModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
