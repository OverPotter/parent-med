"""Роуты для аналитики (server-side hash идентификаторов)."""

import hashlib
import hmac

from fastapi import APIRouter, Depends

from src.api.deps.auth import get_current_account
from src.application.dto.analytics import AnalyticsHashRequestDto, AnalyticsHashResponseDto
from src.core.config import settings

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/hash-identifier", response_model=AnalyticsHashResponseDto)
async def hash_identifier(
    dto: AnalyticsHashRequestDto,
    _current_account=Depends(get_current_account),
) -> AnalyticsHashResponseDto:
    """Возвращает HMAC-SHA256 hash для аналитики (с серверной солью)."""
    msg = f"{dto.kind}\0{dto.value}".encode()
    digest = hmac.new(
        settings.analytics_hash_salt.encode(),
        msg,
        hashlib.sha256,
    ).hexdigest()
    return AnalyticsHashResponseDto(kind=dto.kind, value_hash=digest)
