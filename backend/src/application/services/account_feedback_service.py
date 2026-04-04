"""Сервис обратной связи: валидация, лимит, идемпотентность."""

from datetime import UTC, datetime, timedelta
from itertools import groupby
from uuid import UUID, uuid4

from src.application.dto.account_feedback import (
    AccountFeedbackCreateDto,
    AccountFeedbackResponseDto,
)
from src.core.config import settings
from src.core.exceptions import RateLimitedError, ValidationError
from src.core.logging import get_logger
from src.domain.entities.account_feedback import AccountFeedback
from src.domain.repositories.account_feedback_repository import AccountFeedbackRepository

logger = get_logger(__name__)

_MAX_MESSAGE_LEN = 8000
_MIN_DISTINCT_RATIO_LEN = 30
_MIN_DISTINCT_CHARS = 4
_MAX_SAME_CHAR_RUN = 40


class AccountFeedbackService:
    """Приём сообщений обратной связи."""

    def __init__(self, feedback_repo: AccountFeedbackRepository) -> None:
        self._repo = feedback_repo

    def _to_response(self, entity: AccountFeedback) -> AccountFeedbackResponseDto:
        return AccountFeedbackResponseDto(
            id=entity.id,
            account_id=entity.account_id,
            message=entity.message,
            client_request_id=entity.client_request_id,
            created_at=entity.created_at,
        )

    def _validate_message_body(self, raw: str) -> str:
        text = raw.strip()
        if not text:
            raise ValidationError("Сообщение не может быть пустым")
        if len(text) > _MAX_MESSAGE_LEN:
            raise ValidationError(
                f"Сообщение слишком длинное (не более {_MAX_MESSAGE_LEN} символов)"
            )
        collapsed = "".join(text.split())
        if len(collapsed) > _MIN_DISTINCT_RATIO_LEN and len(set(collapsed)) < _MIN_DISTINCT_CHARS:
            raise ValidationError(
                "Сообщение выглядит как случайный набор символов; опишите мысль обычным текстом"
            )
        longest_run = max((sum(1 for _ in g) for _, g in groupby(text)), default=0)
        if longest_run > _MAX_SAME_CHAR_RUN:
            raise ValidationError("Сообщение содержит слишком длинные повторы одного символа")
        return text

    async def submit(
        self,
        dto: AccountFeedbackCreateDto,
        account_id: UUID,
    ) -> AccountFeedbackResponseDto:
        message = self._validate_message_body(dto.message)
        existing = await self._repo.get_by_account_and_client_request_id(
            account_id, dto.client_request_id
        )
        if existing:
            logger.info(
                "feedback_idempotent | account_id={} feedback_id={} client_request_id={}",
                account_id,
                existing.id,
                dto.client_request_id,
            )
            return self._to_response(existing)

        since = datetime.now(UTC) - timedelta(hours=1)
        count = await self._repo.count_since(account_id, since)
        if count >= settings.feedback_rate_limit_per_hour:
            logger.warning(
                "feedback_rate_limited | account_id={} count={} limit={}",
                account_id,
                count,
                settings.feedback_rate_limit_per_hour,
            )
            raise RateLimitedError(
                "Превышен лимит обращений в час. Попробуйте позже.",
                code="FEEDBACK_RATE_LIMITED",
            )

        entity = AccountFeedback(
            id=uuid4(),
            account_id=account_id,
            message=message,
            client_request_id=dto.client_request_id,
            created_at=datetime.now(UTC),
        )
        created = await self._repo.add(entity)
        logger.info(
            "feedback_saved | feedback_id={} account_id={} client_request_id={} message_len={}",
            created.id,
            account_id,
            dto.client_request_id,
            len(created.message),
        )
        return self._to_response(created)
