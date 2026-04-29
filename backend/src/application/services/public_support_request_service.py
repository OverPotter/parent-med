"""Сервис публичных обращений: валидация, лимит, идемпотентность."""

from datetime import UTC, datetime, timedelta
from itertools import groupby
from uuid import uuid4

from src.application.dto.public_support_request import (
    PublicSupportRequestCreateDto,
    PublicSupportRequestResponseDto,
)
from src.core.config import settings
from src.core.exceptions import RateLimitedError, ValidationError
from src.core.logging import get_logger
from src.domain.entities.public_support_request import PublicSupportRequest
from src.domain.repositories.public_support_request_repository import (
    PublicSupportRequestRepository,
)

logger = get_logger(__name__)

_MAX_MESSAGE_LEN = 8000
_MAX_REPLY_CONTACT_LEN = 320
_MIN_DISTINCT_RATIO_LEN = 30
_MIN_DISTINCT_CHARS = 4
_MAX_SAME_CHAR_RUN = 40


class PublicSupportRequestService:
    """Приём публичных обращений без авторизации."""

    def __init__(self, support_repo: PublicSupportRequestRepository) -> None:
        self._repo = support_repo

    def _to_response(self, entity: PublicSupportRequest) -> PublicSupportRequestResponseDto:
        return PublicSupportRequestResponseDto(
            id=entity.id,
            reply_contact=entity.reply_contact,
            message=entity.message,
            client_request_id=entity.client_request_id,
            created_at=entity.created_at,
        )

    def _validate_reply_contact(self, raw: str) -> str:
        reply_contact = raw.strip()
        if len(reply_contact) < 3:
            raise ValidationError("Укажите контакт для ответа")
        if len(reply_contact) > _MAX_REPLY_CONTACT_LEN:
            raise ValidationError(
                f"Контакт для ответа слишком длинный (не более {_MAX_REPLY_CONTACT_LEN} символов)"
            )
        return reply_contact

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
        dto: PublicSupportRequestCreateDto,
    ) -> PublicSupportRequestResponseDto:
        reply_contact = self._validate_reply_contact(dto.reply_contact)
        message = self._validate_message_body(dto.message)
        existing = await self._repo.get_by_reply_contact_and_client_request_id(
            reply_contact, dto.client_request_id
        )
        if existing:
            logger.info(
                "public_support_idempotent | reply_contact={} support_id={} client_request_id={}",
                reply_contact,
                existing.id,
                dto.client_request_id,
            )
            return self._to_response(existing)

        since = datetime.now(UTC) - timedelta(hours=1)
        count = await self._repo.count_since(reply_contact, since)
        if count >= settings.public_support_rate_limit_per_hour:
            logger.warning(
                "public_support_rate_limited | reply_contact={} count={} limit={}",
                reply_contact,
                count,
                settings.public_support_rate_limit_per_hour,
            )
            raise RateLimitedError(
                "Превышен лимит обращений в час. Попробуйте позже.",
                code="PUBLIC_SUPPORT_RATE_LIMITED",
            )

        entity = PublicSupportRequest(
            id=uuid4(),
            reply_contact=reply_contact,
            message=message,
            client_request_id=dto.client_request_id,
            created_at=datetime.now(UTC),
        )
        created = await self._repo.add(entity)
        logger.info(
            "public_support_saved | support_id={} reply_contact={} "
            "client_request_id={} message_len={}",
            created.id,
            reply_contact,
            dto.client_request_id,
            len(created.message),
        )
        return self._to_response(created)
