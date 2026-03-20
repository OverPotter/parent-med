"""Роуты: приёмы лекарств (с проверкой Safety Engine)."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_administration_service
from src.api.deps.auth import get_current_account
from src.application.dto.administration_event import (
    AdministrationEventCreateDto,
    AdministrationEventResponseDto,
)
from src.application.dto.auth import AuthenticatedAccount
from src.application.services.administration_service import AdministrationService

router = APIRouter(prefix="/administration-events", tags=["administration-events"])


@router.get("/{event_id}", response_model=AdministrationEventResponseDto)
async def get_administration_event(
    event_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(get_administration_service),
) -> AdministrationEventResponseDto:
    """Получить запись приёма по id."""
    return await service.get_by_id(event_id, current_account.family_id)


@router.get("", response_model=list[AdministrationEventResponseDto])
async def list_administration_events(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(get_administration_service),
) -> list[AdministrationEventResponseDto]:
    """Журнал приёмов по эпизоду болезни."""
    return await service.get_by_episode_id(episode_id, current_account.family_id)


@router.post("", response_model=AdministrationEventResponseDto, status_code=201)
async def create_administration_event(
    dto: AdministrationEventCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(get_administration_service),
) -> AdministrationEventResponseDto:
    """Зафиксировать приём лекарства (проверка срока годности и вскрытия через Safety Engine)."""
    return await service.create(
        dto,
        current_account.family_id,
        current_account.id,
        current_account.display_name,
    )


@router.delete("/{event_id}", status_code=204)
async def delete_administration_event(
    event_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(get_administration_service),
) -> None:
    """Удалить запись приёма."""
    await service.delete(event_id, current_account.family_id)
