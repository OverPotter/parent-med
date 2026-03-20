from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.illness_comment import IllnessCommentCreateDto
from src.application.services.illness_comment_service import IllnessCommentService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.illness_comment import IllnessComment
from src.domain.entities.illness_episode import IllnessEpisode


class StubIllnessCommentRepository:
    def __init__(self) -> None:
        self.items: list[IllnessComment] = []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.items if item.id == id), None)

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return [item for item in self.items if item.episode_id == episode_id]

    async def add(self, entity: IllnessComment) -> IllnessComment:
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.items = [item for item in self.items if item.id != id]
        return True


class StubIllnessEpisodeRepository:
    def __init__(self, episode: IllnessEpisode) -> None:
        self.episode = episode

    async def get_by_id(self, id):  # noqa: ANN001
        return self.episode if id == self.episode.id else None


class StubChildRepository:
    def __init__(self, child: Child) -> None:
        self.child = child

    async def get_by_id(self, id):  # noqa: ANN001
        return self.child if id == self.child.id else None


def make_service(
    status: str = "active",
) -> tuple[IllnessCommentService, StubIllnessCommentRepository, IllnessEpisode, Child]:
    child = Child(
        id=uuid4(),
        family_id=uuid4(),
        name="Маша",
        birth_date=date(2021, 5, 1),
    )
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 18),
        title="ОРВИ",
        status=status,
        medication_mode="manual",
        note=None,
        closed_at=None,
        deleted_at=None,
    )
    repo = StubIllnessCommentRepository()
    service = IllnessCommentService(
        comment_repo=repo,
        episode_repo=StubIllnessEpisodeRepository(episode),
        child_repo=StubChildRepository(child),
    )
    return service, repo, episode, child


@pytest.mark.asyncio
async def test_create_illness_comment() -> None:
    service, repo, episode, child = make_service()

    result = await service.create(
        IllnessCommentCreateDto(
            episode_id=episode.id,
            text="К вечеру ребёнок стал активнее",
            created_at=datetime(2026, 3, 18, 18, 0, tzinfo=UTC),
        ),
        child.family_id,
    )

    assert result.text == "К вечеру ребёнок стал активнее"
    assert len(repo.items) == 1


@pytest.mark.asyncio
async def test_create_illness_comment_rejects_blank_text() -> None:
    service, _, episode, child = make_service()

    with pytest.raises(ValidationError, match="Комментарий не может быть пустым"):
        await service.create(
            IllnessCommentCreateDto(
                episode_id=episode.id,
                text="   ",
            ),
            child.family_id,
        )


@pytest.mark.asyncio
async def test_create_illness_comment_rejects_closed_episode() -> None:
    service, _, episode, child = make_service(status="closed")

    with pytest.raises(ValidationError, match="Эпизод закрыт, комментарии добавлять нельзя"):
        await service.create(
            IllnessCommentCreateDto(
                episode_id=episode.id,
                text="Новая запись",
            ),
            child.family_id,
        )


@pytest.mark.asyncio
async def test_create_illness_comment_rejects_foreign_family() -> None:
    service, _, episode, _ = make_service()

    with pytest.raises(ForbiddenError, match="Нет доступа к ребёнку из другой семьи"):
        await service.create(
            IllnessCommentCreateDto(
                episode_id=episode.id,
                text="Новая запись",
            ),
            uuid4(),
        )
