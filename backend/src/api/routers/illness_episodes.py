"""Роуты: эпизоды болезни."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_illness_episode_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.illness_analytics import (
    IllnessEpisodeInsightsDto,
    IllnessHistorySummaryDto,
)
from src.application.dto.illness_episode import (
    IllnessEpisodeCreateDto,
    IllnessEpisodeResponseDto,
    IllnessEpisodeUpdateDto,
)
from src.application.services.illness_episode_service import IllnessEpisodeService

router = APIRouter(prefix="/illness-episodes", tags=["illness-episodes"])


@router.get("/child/{child_id}/history-summary", response_model=IllnessHistorySummaryDto)
async def get_history_summary(
    child_id: UUID,
    period: str = "half_year",
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessHistorySummaryDto:
    """Сводка по истории завершённых эпизодов ребёнка за период."""
    return await service.get_history_summary(child_id, current_account.family_id, period)


@router.get("/{episode_id}/insights", response_model=IllnessEpisodeInsightsDto)
async def get_episode_insights(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeInsightsDto:
    """Разбор конкретного эпизода болезни."""
    return await service.get_episode_insights(episode_id, current_account.family_id)


@router.get("/{episode_id}", response_model=IllnessEpisodeResponseDto)
async def get_episode(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto:
    """Получить эпизод болезни по id."""
    return await service.get_by_id(episode_id, current_account.family_id)


@router.get("", response_model=list[IllnessEpisodeResponseDto])
async def list_episodes(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> list[IllnessEpisodeResponseDto]:
    """Эпизоды болезни по ребёнку."""
    return await service.get_by_child_id(child_id, current_account.family_id)


@router.get("/child/{child_id}/active", response_model=IllnessEpisodeResponseDto | None)
async def get_active_episode(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto | None:
    """Активный эпизод по ребёнку (если есть)."""
    return await service.get_active_for_child(child_id, current_account.family_id)


@router.post("", response_model=IllnessEpisodeResponseDto, status_code=201)
async def create_episode(
    dto: IllnessEpisodeCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto:
    """Создать эпизод болезни."""
    return await service.create(dto, current_account.family_id)


@router.patch("/{episode_id}", response_model=IllnessEpisodeResponseDto)
async def update_episode(
    episode_id: UUID,
    dto: IllnessEpisodeUpdateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto:
    """Обновить эпизод (закрытие, заметка)."""
    return await service.update(episode_id, dto, current_account.family_id)


@router.delete("/{episode_id}", status_code=204)
async def delete_episode(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> None:
    """Удалить эпизод болезни."""
    await service.delete(episode_id, current_account.family_id)
