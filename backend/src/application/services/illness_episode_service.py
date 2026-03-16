"""Сервис эпизодов болезни."""

from datetime import datetime
from uuid import UUID, uuid4

from src.application.dto.illness_episode import (
    IllnessEpisodeCreateDto,
    IllnessEpisodeResponseDto,
    IllnessEpisodeUpdateDto,
)
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository


class IllnessEpisodeService:
    """Сервис эпизодов болезни: создание, журнал, закрытие."""

    def __init__(
        self,
        episode_repo: IllnessEpisodeRepository,
        child_repo: ChildRepository,
    ) -> None:
        self._repo = episode_repo
        self._child_repo = child_repo

    def _to_response(self, entity: IllnessEpisode) -> IllnessEpisodeResponseDto:
        return IllnessEpisodeResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            started_at=entity.started_at,
            status=entity.status,
            note=entity.note,
            closed_at=entity.closed_at,
        )

    async def get_by_id(self, id: UUID) -> IllnessEpisodeResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        return self._to_response(entity)

    async def get_by_child_id(self, child_id: UUID) -> list[IllnessEpisodeResponseDto]:
        if await self._child_repo.get_by_id(child_id) is None:
            raise NotFoundError("Ребёнок не найден", resource="child")
        entities = await self._repo.get_by_child_id(child_id)
        return [self._to_response(e) for e in entities]

    async def get_active_for_child(self, child_id: UUID) -> IllnessEpisodeResponseDto | None:
        entity = await self._repo.get_active_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def create(self, dto: IllnessEpisodeCreateDto) -> IllnessEpisodeResponseDto:
        if await self._child_repo.get_by_id(dto.child_id) is None:
            raise NotFoundError("Ребёнок не найден", resource="child")
        active = await self._repo.get_active_by_child_id(dto.child_id)
        if active:
            raise ValidationError(
                f"У ребёнка уже есть активный эпизод (id={active.id}). "
                "Закройте его перед созданием нового."
            )
        entity = IllnessEpisode(
            id=uuid4(),
            child_id=dto.child_id,
            started_at=dto.started_at,
            status="active",
            note=dto.note,
            closed_at=None,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(self, id: UUID, dto: IllnessEpisodeUpdateDto) -> IllnessEpisodeResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        status = dto.status if dto.status is not None else entity.status
        note = dto.note if dto.note is not None else entity.note
        closed_at = dto.closed_at if dto.closed_at is not None else entity.closed_at
        if status == "closed" and closed_at is None:
            closed_at = datetime.now(datetime.UTC)
        entity = IllnessEpisode(
            id=entity.id,
            child_id=entity.child_id,
            started_at=entity.started_at,
            status=status,
            note=note,
            closed_at=closed_at,
        )
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        await self._repo.delete(id)
