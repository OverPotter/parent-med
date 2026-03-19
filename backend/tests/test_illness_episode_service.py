from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.illness_episode import IllnessEpisodeUpdateDto
from src.application.services.illness_episode_service import IllnessEpisodeService
from src.core.exceptions import ValidationError
from src.domain.entities.illness_episode import IllnessEpisode


class StubIllnessEpisodeRepository:
    def __init__(self, entity: IllnessEpisode) -> None:
        self.entity = entity
        self.updated: IllnessEpisode | None = None

    async def get_by_id(self, id):  # noqa: ANN001
        return self.entity if id == self.entity.id else None

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        return [self.entity]

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        if self.entity.child_id != child_id:
            return None
        return self.entity if self.entity.status == "active" else None

    async def add(self, entity: IllnessEpisode) -> IllnessEpisode:
        self.entity = entity
        return entity

    async def update(self, entity: IllnessEpisode) -> IllnessEpisode:
        self.updated = entity
        self.entity = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubChildRepository:
    async def get_by_id(self, id):  # noqa: ANN001
        return object()


def make_service(
    entity: IllnessEpisode,
) -> tuple[IllnessEpisodeService, StubIllnessEpisodeRepository]:
    repo = StubIllnessEpisodeRepository(entity)
    service = IllnessEpisodeService(
        episode_repo=repo,
        child_repo=StubChildRepository(),
    )
    return service, repo


@pytest.mark.asyncio
async def test_update_allows_editing_history_fields() -> None:
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=uuid4(),
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="closed",
        note="Старая заметка",
        closed_at=datetime(2026, 3, 12, 8, 30, tzinfo=UTC),
        deleted_at=None,
    )
    service, repo = make_service(entity)

    result = await service.update(
        entity.id,
        IllnessEpisodeUpdateDto(
            started_at=date(2026, 3, 9),
            title="ОРВИ с температурой",
            status="closed",
            note="Стало лучше к вечеру",
            closed_at=datetime(2026, 3, 11, 18, 15, tzinfo=UTC),
        ),
    )

    assert result.started_at == date(2026, 3, 9)
    assert result.title == "ОРВИ с температурой"
    assert result.note == "Стало лучше к вечеру"
    assert result.closed_at == datetime(2026, 3, 11, 18, 15, tzinfo=UTC)
    assert repo.updated is not None
    assert repo.updated.started_at == date(2026, 3, 9)


@pytest.mark.asyncio
async def test_update_rejects_closed_at_before_started_at() -> None:
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=uuid4(),
        started_at=date(2026, 3, 10),
        title=None,
        status="closed",
        note=None,
        closed_at=datetime(2026, 3, 12, 8, 30, tzinfo=UTC),
        deleted_at=None,
    )
    service, _ = make_service(entity)

    with pytest.raises(
        ValidationError,
        match="Дата закрытия не может быть раньше даты начала эпизода",
    ):
        await service.update(
            entity.id,
            IllnessEpisodeUpdateDto(
                started_at=date(2026, 3, 10),
                status="closed",
                closed_at=datetime(2026, 3, 9, 18, 15, tzinfo=UTC),
            ),
        )
