"""Реализация репозитория публичных обращений."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.public_support_request import PublicSupportRequest
from src.domain.repositories.public_support_request_repository import (
    PublicSupportRequestRepository,
)
from src.infrastructure.database.models.public_support_request import PublicSupportRequestModel


class SqlPublicSupportRequestRepository(PublicSupportRequestRepository):
    """Репозиторий public_support_requests."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: PublicSupportRequestModel) -> PublicSupportRequest:
        return PublicSupportRequest(
            id=model.id,
            reply_contact=model.reply_contact,
            message=model.message,
            client_request_id=model.client_request_id,
            created_at=model.created_at,
        )

    async def count_since(self, reply_contact: str, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(PublicSupportRequestModel)
            .where(
                PublicSupportRequestModel.reply_contact == reply_contact,
                PublicSupportRequestModel.created_at >= since,
            )
        )
        return int(result.scalar_one())

    async def get_by_id(self, id: UUID) -> PublicSupportRequest | None:
        result = await self._session.execute(
            select(PublicSupportRequestModel).where(PublicSupportRequestModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_reply_contact_and_client_request_id(
        self,
        reply_contact: str,
        client_request_id: UUID,
    ) -> PublicSupportRequest | None:
        result = await self._session.execute(
            select(PublicSupportRequestModel).where(
                PublicSupportRequestModel.reply_contact == reply_contact,
                PublicSupportRequestModel.client_request_id == client_request_id,
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: PublicSupportRequest) -> PublicSupportRequest:
        try:
            async with self._session.begin_nested():
                model = PublicSupportRequestModel(
                    id=entity.id,
                    reply_contact=entity.reply_contact,
                    message=entity.message,
                    client_request_id=entity.client_request_id,
                    created_at=entity.created_at,
                )
                self._session.add(model)
                await self._session.flush()
                await self._session.refresh(model)
                return self._to_entity(model)
        except IntegrityError:
            existing = await self.get_by_reply_contact_and_client_request_id(
                entity.reply_contact, entity.client_request_id
            )
            if existing:
                return existing
            raise

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(PublicSupportRequestModel).where(PublicSupportRequestModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
