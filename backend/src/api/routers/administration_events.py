"""Роуты: приёмы лекарств (с проверкой Safety Engine)."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_administration_service
from src.application.dto.administration_event import (
    AdministrationEventCreateDto,
    AdministrationEventResponseDto,
)
from src.application.services.administration_service import AdministrationService

router = APIRouter(prefix="/administration-events", tags=["administration-events"])


@router.get("/{event_id}", response_model=AdministrationEventResponseDto)
async def get_administration_event(
    event_id: UUID,
    service: AdministrationService = Depends(get_administration_service),
) -> AdministrationEventResponseDto:
    """Получить запись приёма по id."""
    return await service.get_by_id(event_id)


@router.get("", response_model=list[AdministrationEventResponseDto])
async def list_administration_events(
    episode_id: UUID,
    service: AdministrationService = Depends(get_administration_service),
) -> list[AdministrationEventResponseDto]:
    """Журнал приёмов по эпизоду болезни."""
    return await service.get_by_episode_id(episode_id)


@router.post("", response_model=AdministrationEventResponseDto, status_code=201)
async def create_administration_event(
    dto: AdministrationEventCreateDto,
    service: AdministrationService = Depends(get_administration_service),
) -> AdministrationEventResponseDto:
    """Зафиксировать приём лекарства (проверка срока годности и вскрытия через Safety Engine)."""
    return await service.create(dto)


@router.delete("/{event_id}", status_code=204)
async def delete_administration_event(
    event_id: UUID,
    service: AdministrationService = Depends(get_administration_service),
) -> None:
    """Удалить запись приёма."""
    await service.delete(event_id)
