"""Роуты: публичная поддержка."""

from fastapi import APIRouter, Depends

from src.api.deps import get_public_support_request_service
from src.application.dto.public_support_request import (
    PublicSupportRequestCreateDto,
    PublicSupportRequestResponseDto,
)
from src.application.services.public_support_request_service import (
    PublicSupportRequestService,
)

router = APIRouter(prefix="/public-support", tags=["public-support"])


@router.post("", response_model=PublicSupportRequestResponseDto, status_code=201)
async def submit_public_support_request(
    dto: PublicSupportRequestCreateDto,
    service: PublicSupportRequestService = Depends(get_public_support_request_service),
) -> PublicSupportRequestResponseDto:
    """Принять публичное сообщение в поддержку."""
    return await service.submit(dto)
