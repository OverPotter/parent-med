from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.illness_episode import IllnessEpisodeCreateDto, IllnessEpisodeUpdateDto
from src.application.services.illness_episode_service import IllnessEpisodeService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.family import Family
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
    def __init__(self, child: Child) -> None:
        self.child = child

    async def get_by_id(self, id):  # noqa: ANN001
        return self.child if id == self.child.id else None


class StubAccount:
    def __init__(self, id):  # noqa: ANN001
        self.id = id


class StubAccountRepository:
    def __init__(self, account_ids) -> None:  # noqa: ANN001
        self.accounts = [StubAccount(account_id) for account_id in account_ids]

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return self.accounts


class StubFamilyRepository:
    def __init__(self, family: Family | None) -> None:
        self.family = family

    async def get_by_id(self, id):  # noqa: ANN001
        if self.family is None:
            return None
        return self.family if id == self.family.id else None


def make_service(
    entity: IllnessEpisode,
    child: Child,
    account_ids=None,  # noqa: ANN001
    family: Family | None = None,
) -> tuple[IllnessEpisodeService, StubIllnessEpisodeRepository]:
    repo = StubIllnessEpisodeRepository(entity)
    service = IllnessEpisodeService(
        episode_repo=repo,
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
        account_repo=(StubAccountRepository(account_ids) if account_ids is not None else None),
    )
    return service, repo


@pytest.mark.asyncio
async def test_update_allows_editing_history_fields() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="closed",
        medication_mode="guided",
        note="Старая заметка",
        closed_at=datetime(2026, 3, 12, 8, 30, tzinfo=UTC),
        deleted_at=None,
    )
    service, repo = make_service(entity, child)

    result = await service.update(
        entity.id,
        IllnessEpisodeUpdateDto(
            started_at=date(2026, 3, 9),
            title="ОРВИ с температурой",
            status="closed",
            medication_mode="manual",
            note="Стало лучше к вечеру",
            closed_at=datetime(2026, 3, 11, 18, 15, tzinfo=UTC),
        ),
        child.family_id,
    )

    assert result.started_at == date(2026, 3, 9)
    assert result.title == "ОРВИ с температурой"
    assert result.note == "Стало лучше к вечеру"
    assert result.closed_at == datetime(2026, 3, 11, 18, 15, tzinfo=UTC)
    assert result.medication_mode == "manual"
    assert repo.updated is not None
    assert repo.updated.started_at == date(2026, 3, 9)


@pytest.mark.asyncio
async def test_update_rejects_closed_at_before_started_at() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title=None,
        status="closed",
        medication_mode="manual",
        note=None,
        closed_at=datetime(2026, 3, 12, 8, 30, tzinfo=UTC),
        deleted_at=None,
    )
    service, _ = make_service(entity, child)

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
            child.family_id,
        )


@pytest.mark.asyncio
async def test_update_accepts_closed_at_with_positive_offset_on_same_local_day() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 4, 24),
        title="ОРВИ",
        status="active",
        medication_mode="manual",
        note=None,
        closed_at=None,
        deleted_at=None,
    )
    service, repo = make_service(entity, child)
    closed_at = datetime.fromisoformat("2026-04-24T00:16:35+03:00")

    result = await service.update(
        entity.id,
        IllnessEpisodeUpdateDto(
            status="closed",
            closed_at=closed_at,
        ),
        child.family_id,
    )

    assert result.closed_at == closed_at
    assert repo.updated is not None
    assert repo.updated.closed_at == closed_at


@pytest.mark.asyncio
async def test_update_rejects_foreign_family() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="active",
        medication_mode="manual",
        note=None,
        closed_at=None,
        deleted_at=None,
    )
    service, _ = make_service(entity, child)

    with pytest.raises(ForbiddenError, match="Нет доступа к ребёнку из другой семьи"):
        await service.update(
            entity.id,
            IllnessEpisodeUpdateDto(note="Новая заметка"),
            uuid4(),
        )


@pytest.mark.asyncio
async def test_update_saves_episode_recipients() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    member_id = uuid4()
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="active",
        medication_mode="guided",
        note=None,
        closed_at=None,
        deleted_at=None,
    )
    service, repo = make_service(entity, child, account_ids=[member_id])

    result = await service.update(
        entity.id,
        IllnessEpisodeUpdateDto(member_account_ids=[member_id]),
        child.family_id,
    )

    assert result.member_account_ids == [member_id]
    assert repo.updated is not None
    assert repo.updated.member_account_ids == [member_id]


@pytest.mark.asyncio
async def test_create_rejects_new_episode_for_non_primary_child_after_downgrade() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    primary_child_id = uuid4()
    family = Family(
        id=child.family_id,
        name="Family",
        plan_code="free",
        subscription_status="inactive",
        free_primary_child_id=primary_child_id,
    )
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=primary_child_id,
        started_at=date(2026, 3, 10),
        title=None,
        status="closed",
        medication_mode="manual",
        note=None,
        closed_at=datetime(2026, 3, 11, 12, 0, tzinfo=UTC),
        deleted_at=None,
    )
    service, _ = make_service(entity, child, family=family)

    with pytest.raises(ForbiddenError, match="Во Free для этого ребёнка"):
        await service.create(
            dto=IllnessEpisodeCreateDto(
                child_id=child.id,
                started_at=date(2026, 4, 2),
                title="ОРВИ",
                medication_mode="manual",
                note=None,
                member_account_ids=[],
            ),
            current_account=child.family_id,
        )


@pytest.mark.asyncio
async def test_update_allows_active_episode_for_non_primary_child_after_downgrade() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    family = Family(
        id=child.family_id,
        name="Family",
        plan_code="free",
        subscription_status="inactive",
        free_primary_child_id=uuid4(),
    )
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="active",
        medication_mode="manual",
        note="Старая заметка",
        closed_at=None,
        deleted_at=None,
    )
    service, repo = make_service(entity, child, family=family)

    result = await service.update(
        entity.id,
        IllnessEpisodeUpdateDto(note="Продолжаем наблюдение"),
        child.family_id,
    )

    assert result.note == "Продолжаем наблюдение"
    assert repo.updated is not None
    assert repo.updated.note == "Продолжаем наблюдение"


@pytest.mark.asyncio
async def test_update_rejects_closed_episode_for_non_primary_child_after_downgrade() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    family = Family(
        id=child.family_id,
        name="Family",
        plan_code="free",
        subscription_status="inactive",
        free_primary_child_id=uuid4(),
    )
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="closed",
        medication_mode="manual",
        note="История",
        closed_at=datetime(2026, 3, 12, 8, 30, tzinfo=UTC),
        deleted_at=None,
    )
    service, _ = make_service(entity, child, family=family)

    with pytest.raises(ForbiddenError, match="можно завершить только уже начатое наблюдение"):
        await service.update(
            entity.id,
            IllnessEpisodeUpdateDto(note="Правка истории"),
            child.family_id,
        )


@pytest.mark.asyncio
async def test_update_rejects_episode_recipients_from_other_family() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    allowed_member_id = uuid4()
    foreign_member_id = uuid4()
    entity = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 10),
        title="ОРВИ",
        status="active",
        medication_mode="guided",
        note=None,
        closed_at=None,
        deleted_at=None,
    )
    service, _ = make_service(entity, child, account_ids=[allowed_member_id])

    with pytest.raises(ForbiddenError, match="Нельзя выбрать получателей из другой семьи"):
        await service.update(
            entity.id,
            IllnessEpisodeUpdateDto(member_account_ids=[foreign_member_id]),
            child.family_id,
        )
