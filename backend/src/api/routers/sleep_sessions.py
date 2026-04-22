"""Роуты: сессии сна ребёнка."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_current_account, get_sleep_session_service
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.sleep_session import (
    SleepSessionCreateDto,
    SleepSessionResponseDto,
    SleepSessionStopDto,
)
from src.application.services.sleep_session_service import SleepSessionService

router = APIRouter(prefix="/sleep-sessions", tags=["sleep-sessions"])


@router.get("/child/{child_id}/active", response_model=SleepSessionResponseDto | None)
async def get_active_sleep_session(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: SleepSessionService = Depends(get_sleep_session_service),
) -> SleepSessionResponseDto | None:
    """Текущая активная сессия сна по ребёнку."""
    return await service.get_active_for_child(child_id, current_account)


@router.get("/child/{child_id}", response_model=list[SleepSessionResponseDto])
async def list_sleep_sessions(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: SleepSessionService = Depends(get_sleep_session_service),
) -> list[SleepSessionResponseDto]:
    """История сна по ребёнку."""
    return await service.list_for_child(child_id, current_account)


@router.post("", response_model=SleepSessionResponseDto, status_code=201)
async def start_sleep_session(
    dto: SleepSessionCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: SleepSessionService = Depends(get_sleep_session_service),
) -> SleepSessionResponseDto:
    """Начать отслеживание сна."""
    return await service.start(dto, current_account)


@router.post("/{session_id}/stop", response_model=SleepSessionResponseDto)
async def stop_sleep_session(
    session_id: UUID,
    dto: SleepSessionStopDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: SleepSessionService = Depends(get_sleep_session_service),
) -> SleepSessionResponseDto:
    """Остановить активную сессию сна."""
    return await service.stop(session_id, dto, current_account)


@router.delete("/{session_id}", status_code=204)
async def delete_sleep_session(
    session_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: SleepSessionService = Depends(get_sleep_session_service),
) -> None:
    """Удалить сессию сна."""
    await service.delete(session_id, current_account)
