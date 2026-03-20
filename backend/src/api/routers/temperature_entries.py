"""Роуты: записи температуры."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_temperature_entry_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.temperature_entry import (
    TemperatureEntryCreateDto,
    TemperatureEntryResponseDto,
)
from src.application.services.temperature_entry_service import TemperatureEntryService

router = APIRouter(prefix="/temperature-entries", tags=["temperature-entries"])


@router.get("/{entry_id}", response_model=TemperatureEntryResponseDto)
async def get_temperature_entry(
    entry_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: TemperatureEntryService = Depends(get_temperature_entry_service),
) -> TemperatureEntryResponseDto:
    """Получить запись температуры по id."""
    return await service.get_by_id(entry_id, current_account.family_id)


@router.get("", response_model=list[TemperatureEntryResponseDto])
async def list_temperature_entries(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: TemperatureEntryService = Depends(get_temperature_entry_service),
) -> list[TemperatureEntryResponseDto]:
    """Журнал температуры по эпизоду болезни."""
    return await service.get_by_episode_id(episode_id, current_account.family_id)


@router.post("", response_model=TemperatureEntryResponseDto, status_code=201)
async def create_temperature_entry(
    dto: TemperatureEntryCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: TemperatureEntryService = Depends(get_temperature_entry_service),
) -> TemperatureEntryResponseDto:
    """Добавить запись температуры."""
    return await service.create(dto, current_account.family_id)


@router.delete("/{entry_id}", status_code=204)
async def delete_temperature_entry(
    entry_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: TemperatureEntryService = Depends(get_temperature_entry_service),
) -> None:
    """Удалить запись температуры."""
    await service.delete(entry_id, current_account.family_id)
