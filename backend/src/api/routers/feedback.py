"""Роуты: обратная связь."""

from fastapi import APIRouter, Depends

from src.api.deps import get_account_feedback_service
from src.api.deps.auth import get_current_account
from src.application.dto.account_feedback import (
    AccountFeedbackCreateDto,
    AccountFeedbackResponseDto,
)
from src.application.dto.auth import AuthenticatedAccount
from src.application.services.account_feedback_service import AccountFeedbackService

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=AccountFeedbackResponseDto, status_code=201)
async def submit_feedback(
    dto: AccountFeedbackCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AccountFeedbackService = Depends(get_account_feedback_service),
) -> AccountFeedbackResponseDto:
    """Принять сообщение от текущего аккаунта."""
    return await service.submit(dto, current_account.id)
