"""Роуты: записи кормления ребёнка."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_current_account, get_feeding_record_service
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.feeding_record import (
    FeedingRecordCreateDto,
    FeedingRecordResponseDto,
    FeedingRecordStartDto,
    FeedingRecordStopDto,
)
from src.application.services.feeding_record_service import FeedingRecordService

router = APIRouter(prefix="/feeding-records", tags=["feeding-records"])


@router.get("/child/{child_id}", response_model=list[FeedingRecordResponseDto])
async def list_feeding_records(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FeedingRecordService = Depends(get_feeding_record_service),
) -> list[FeedingRecordResponseDto]:
    """История кормлений по ребёнку."""
    return await service.list_for_child(child_id, current_account.family_id)


@router.get("/child/{child_id}/active", response_model=FeedingRecordResponseDto | None)
async def get_active_feeding_record(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FeedingRecordService = Depends(get_feeding_record_service),
) -> FeedingRecordResponseDto | None:
    """Текущее активное кормление по ребёнку."""
    return await service.get_active_for_child(child_id, current_account.family_id)


@router.post("", response_model=FeedingRecordResponseDto, status_code=201)
async def create_feeding_record(
    dto: FeedingRecordCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FeedingRecordService = Depends(get_feeding_record_service),
) -> FeedingRecordResponseDto:
    """Создать запись кормления."""
    return await service.create(dto, current_account.family_id, current_account.id)


@router.post("/start", response_model=FeedingRecordResponseDto, status_code=201)
async def start_feeding_record(
    dto: FeedingRecordStartDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FeedingRecordService = Depends(get_feeding_record_service),
) -> FeedingRecordResponseDto:
    """Начать отслеживание кормления."""
    return await service.start(dto, current_account.family_id, current_account.id)


@router.post("/{record_id}/stop", response_model=FeedingRecordResponseDto)
async def stop_feeding_record(
    record_id: UUID,
    dto: FeedingRecordStopDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FeedingRecordService = Depends(get_feeding_record_service),
) -> FeedingRecordResponseDto:
    """Завершить активное кормление."""
    return await service.stop(record_id, dto, current_account.family_id)


@router.delete("/{record_id}", status_code=204)
async def delete_feeding_record(
    record_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: FeedingRecordService = Depends(get_feeding_record_service),
) -> None:
    """Удалить запись кормления."""
    await service.delete(record_id, current_account.family_id)
