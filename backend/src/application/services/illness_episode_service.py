"""Сервис эпизодов болезни."""

from datetime import UTC, datetime
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
            title=entity.title,
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
                "У ребёнка уже есть активный эпизод. "
                "Закройте его перед созданием нового."
            )
        entity = IllnessEpisode(
            id=uuid4(),
            child_id=dto.child_id,
            started_at=dto.started_at,
            title=dto.title.strip() if dto.title else None,
            status="active",
            note=dto.note,
            closed_at=None,
            deleted_at=None,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(self, id: UUID, dto: IllnessEpisodeUpdateDto) -> IllnessEpisodeResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        fields_set = dto.model_fields_set

        started_at = dto.started_at if "started_at" in fields_set else entity.started_at
        title = dto.title.strip() if "title" in fields_set and dto.title else (
            None if "title" in fields_set else entity.title
        )
        status = dto.status if "status" in fields_set else entity.status
        note = dto.note if "note" in fields_set else entity.note
        closed_at = dto.closed_at if "closed_at" in fields_set else entity.closed_at

        if started_at > datetime.now(UTC).date():
            raise ValidationError("Дата начала эпизода не может быть в будущем")
        if closed_at and closed_at.date() < started_at:
            raise ValidationError("Дата закрытия не может быть раньше даты начала эпизода")
        if status not in {"active", "closed"}:
            raise ValidationError("Неизвестный статус эпизода болезни")

        if status == "closed" and "closed_at" not in fields_set and closed_at is None:
            closed_at = datetime.now(UTC)
        if status == "active":
            closed_at = None

        entity = IllnessEpisode(
            id=entity.id,
            child_id=entity.child_id,
            started_at=started_at,
            title=title,
            status=status,
            note=note,
            closed_at=closed_at,
            deleted_at=entity.deleted_at,
        )
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        await self._repo.delete(id)
