"""Роуты: эпизоды болезни."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_illness_episode_service
from src.application.dto.illness_episode import (
    IllnessEpisodeCreateDto,
    IllnessEpisodeResponseDto,
    IllnessEpisodeUpdateDto,
)
from src.application.services.illness_episode_service import IllnessEpisodeService

router = APIRouter(prefix="/illness-episodes", tags=["illness-episodes"])


@router.get("/{episode_id}", response_model=IllnessEpisodeResponseDto)
async def get_episode(
    episode_id: UUID,
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto:
    """Получить эпизод болезни по id."""
    return await service.get_by_id(episode_id)


@router.get("", response_model=list[IllnessEpisodeResponseDto])
async def list_episodes(
    child_id: UUID,
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> list[IllnessEpisodeResponseDto]:
    """Эпизоды болезни по ребёнку."""
    return await service.get_by_child_id(child_id)


@router.get("/child/{child_id}/active", response_model=IllnessEpisodeResponseDto | None)
async def get_active_episode(
    child_id: UUID,
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto | None:
    """Активный эпизод по ребёнку (если есть)."""
    return await service.get_active_for_child(child_id)


@router.post("", response_model=IllnessEpisodeResponseDto, status_code=201)
async def create_episode(
    dto: IllnessEpisodeCreateDto,
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto:
    """Создать эпизод болезни."""
    return await service.create(dto)


@router.patch("/{episode_id}", response_model=IllnessEpisodeResponseDto)
async def update_episode(
    episode_id: UUID,
    dto: IllnessEpisodeUpdateDto,
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> IllnessEpisodeResponseDto:
    """Обновить эпизод (закрытие, заметка)."""
    return await service.update(episode_id, dto)


@router.delete("/{episode_id}", status_code=204)
async def delete_episode(
    episode_id: UUID,
    service: IllnessEpisodeService = Depends(get_illness_episode_service),
) -> None:
    """Удалить эпизод болезни."""
    await service.delete(episode_id)
