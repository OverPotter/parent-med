"""Реализация репозитория обратной связи."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.account_feedback import AccountFeedback
from src.domain.repositories.account_feedback_repository import AccountFeedbackRepository
from src.infrastructure.database.models.account_feedback import AccountFeedbackModel


class SqlAccountFeedbackRepository(AccountFeedbackRepository):
    """Репозиторий account_feedback."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: AccountFeedbackModel) -> AccountFeedback:
        return AccountFeedback(
            id=model.id,
            account_id=model.account_id,
            message=model.message,
            client_request_id=model.client_request_id,
            created_at=model.created_at,
        )

    async def count_since(self, account_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(AccountFeedbackModel)
            .where(
                AccountFeedbackModel.account_id == account_id,
                AccountFeedbackModel.created_at >= since,
            )
        )
        return int(result.scalar_one())

    async def get_by_id(self, id: UUID) -> AccountFeedback | None:
        result = await self._session.execute(
            select(AccountFeedbackModel).where(AccountFeedbackModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_account_and_client_request_id(
        self,
        account_id: UUID,
        client_request_id: UUID,
    ) -> AccountFeedback | None:
        result = await self._session.execute(
            select(AccountFeedbackModel).where(
                AccountFeedbackModel.account_id == account_id,
                AccountFeedbackModel.client_request_id == client_request_id,
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: AccountFeedback) -> AccountFeedback:
        try:
            async with self._session.begin_nested():
                model = AccountFeedbackModel(
                    id=entity.id,
                    account_id=entity.account_id,
                    message=entity.message,
                    client_request_id=entity.client_request_id,
                    created_at=entity.created_at,
                )
                self._session.add(model)
                await self._session.flush()
                await self._session.refresh(model)
                return self._to_entity(model)
        except IntegrityError:
            existing = await self.get_by_account_and_client_request_id(
                entity.account_id, entity.client_request_id
            )
            if existing:
                return existing
            raise

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(AccountFeedbackModel).where(AccountFeedbackModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
