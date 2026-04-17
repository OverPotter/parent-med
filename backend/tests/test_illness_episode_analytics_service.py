from datetime import UTC, date, datetime, timedelta
from uuid import uuid4

import pytest

from src.application.services.illness_episode_service import IllnessEpisodeService
from src.domain.entities.administration_event import AdministrationEvent
from src.domain.entities.child import Child
from src.domain.entities.illness_comment import IllnessComment
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.temperature_entry import TemperatureEntry


class StubIllnessEpisodeRepository:
    def __init__(self, episodes: list[IllnessEpisode]) -> None:
        self.episodes = episodes

    async def get_by_id(self, id):  # noqa: ANN001
        for episode in self.episodes:
            if episode.id == id:
                return episode
        return None

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        return [episode for episode in self.episodes if episode.child_id == child_id]

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        for episode in self.episodes:
            if episode.child_id == child_id and episode.status == "active":
                return episode
        return None

    async def add(self, entity):  # noqa: ANN001
        self.episodes.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubChildRepository:
    def __init__(self, child: Child) -> None:
        self.child = child

    async def get_by_id(self, id):  # noqa: ANN001
        return self.child if id == self.child.id else None


class StubTemperatureRepository:
    def __init__(self, items_by_episode: dict) -> None:  # noqa: ANN401
        self.items_by_episode = items_by_episode

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return self.items_by_episode.get(episode_id, [])


class StubAdministrationRepository:
    def __init__(self, items_by_episode: dict) -> None:  # noqa: ANN401
        self.items_by_episode = items_by_episode

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return self.items_by_episode.get(episode_id, [])


class StubCommentRepository:
    def __init__(self, items_by_episode: dict) -> None:  # noqa: ANN401
        self.items_by_episode = items_by_episode

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return self.items_by_episode.get(episode_id, [])


def make_service(
    child: Child,
    episodes: list[IllnessEpisode],
    temperatures_by_episode: dict,  # noqa: ANN401
    administrations_by_episode: dict,  # noqa: ANN401
    comments_by_episode: dict,  # noqa: ANN401
) -> IllnessEpisodeService:
    return IllnessEpisodeService(
        episode_repo=StubIllnessEpisodeRepository(episodes),
        child_repo=StubChildRepository(child),
        temperature_repo=StubTemperatureRepository(temperatures_by_episode),
        administration_repo=StubAdministrationRepository(administrations_by_episode),
        comment_repo=StubCommentRepository(comments_by_episode),
    )


@pytest.mark.asyncio
async def test_get_history_summary_returns_period_aggregates() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Антон", birth_date=date(2021, 4, 10))
    now = datetime.now(UTC)
    recent_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=(now - timedelta(days=10)).date(),
        title="ОРВИ",
        status="closed",
        medication_mode="guided",
        note=None,
        closed_at=now - timedelta(days=7),
        deleted_at=None,
    )
    older_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=(now - timedelta(days=50)).date(),
        title="Температура",
        status="closed",
        medication_mode="manual",
        note=None,
        closed_at=now - timedelta(days=47),
        deleted_at=None,
    )
    old_outside_period_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=(now - timedelta(days=220)).date(),
        title="Старый эпизод",
        status="closed",
        medication_mode="manual",
        note=None,
        closed_at=now - timedelta(days=216),
        deleted_at=None,
    )

    service = make_service(
        child=child,
        episodes=[recent_episode, older_episode, old_outside_period_episode],
        temperatures_by_episode={
            recent_episode.id: [
                TemperatureEntry(
                    id=uuid4(),
                    episode_id=recent_episode.id,
                    value_celsius=38.4,
                    measured_at=now - timedelta(days=9),
                    method=None,
                    comment=None,
                )
            ],
            older_episode.id: [
                TemperatureEntry(
                    id=uuid4(),
                    episode_id=older_episode.id,
                    value_celsius=37.8,
                    measured_at=now - timedelta(days=49),
                    method=None,
                    comment=None,
                )
            ],
            old_outside_period_episode.id: [],
        },
        administrations_by_episode={
            recent_episode.id: [
                AdministrationEvent(
                    id=uuid4(),
                    episode_id=recent_episode.id,
                    household_medicine_id=None,
                    custom_medicine_name="Нурофен",
                    administered_at=now - timedelta(days=9),
                    administered_by_account_id=None,
                    administered_by_name_snapshot=None,
                    amount="5",
                    unit="мл",
                    reason=None,
                )
            ],
            older_episode.id: [],
            old_outside_period_episode.id: [],
        },
        comments_by_episode={
            recent_episode.id: [],
            older_episode.id: [],
            old_outside_period_episode.id: [],
        },
    )

    result = await service.get_history_summary(child.id, child.family_id, "half_year")

    assert result.period == "half_year"
    assert result.total_closed_episodes == 3
    assert result.episode_count == 2
    assert result.episodes_with_temperature_38_plus == 1
    assert result.episodes_with_temperature_39_plus == 0
    assert result.episodes_with_administrations == 1
    assert result.observation_only_episodes == 1
    assert result.guided_episodes == 1
    assert result.total_temperature_entries == 2
    assert len(result.timeline) == 6
    assert [bucket.label for bucket in result.duration_buckets] == [
        "1-2 дня",
        "3-5 дней",
        "6+ дней",
    ]


@pytest.mark.asyncio
async def test_get_history_summary_includes_episode_closed_inside_period() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Антон", birth_date=date(2021, 4, 10))
    now = datetime.now(UTC)
    overlapping_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=(now - timedelta(days=35)).date(),
        title="Долгий эпизод",
        status="closed",
        medication_mode="manual",
        note=None,
        closed_at=now - timedelta(days=5),
        deleted_at=None,
    )
    old_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=(now - timedelta(days=70)).date(),
        title="Старый эпизод",
        status="closed",
        medication_mode="manual",
        note=None,
        closed_at=now - timedelta(days=60),
        deleted_at=None,
    )

    service = make_service(
        child=child,
        episodes=[overlapping_episode, old_episode],
        temperatures_by_episode={overlapping_episode.id: [], old_episode.id: []},
        administrations_by_episode={overlapping_episode.id: [], old_episode.id: []},
        comments_by_episode={overlapping_episode.id: [], old_episode.id: []},
    )

    result = await service.get_history_summary(child.id, child.family_id, "month")

    assert result.period == "month"
    assert result.total_closed_episodes == 2
    assert result.episode_count == 1
    assert result.average_duration_days == 31


@pytest.mark.asyncio
async def test_get_episode_insights_returns_peak_and_counts() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Антон", birth_date=date(2021, 4, 10))
    now = datetime.now(UTC)
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=(now - timedelta(days=4)).date(),
        title="ОРВИ",
        status="closed",
        medication_mode="guided",
        note=None,
        closed_at=now - timedelta(days=1),
        deleted_at=None,
    )
    first_temp_at = now - timedelta(days=4, hours=2)
    peak_temp_at = now - timedelta(days=3, hours=5)
    last_admin_at = now - timedelta(days=2, hours=4)

    service = make_service(
        child=child,
        episodes=[episode],
        temperatures_by_episode={
            episode.id: [
                TemperatureEntry(
                    id=uuid4(),
                    episode_id=episode.id,
                    value_celsius=37.5,
                    measured_at=first_temp_at,
                    method=None,
                    comment=None,
                ),
                TemperatureEntry(
                    id=uuid4(),
                    episode_id=episode.id,
                    value_celsius=39.1,
                    measured_at=peak_temp_at,
                    method=None,
                    comment=None,
                ),
            ]
        },
        administrations_by_episode={
            episode.id: [
                AdministrationEvent(
                    id=uuid4(),
                    episode_id=episode.id,
                    household_medicine_id=None,
                    custom_medicine_name="Парацетамол",
                    administered_at=last_admin_at,
                    administered_by_account_id=None,
                    administered_by_name_snapshot=None,
                    amount="5",
                    unit="мл",
                    reason=None,
                )
            ]
        },
        comments_by_episode={
            episode.id: [
                IllnessComment(
                    id=uuid4(),
                    episode_id=episode.id,
                    created_at=now - timedelta(days=2),
                    text="К вечеру лучше",
                )
            ]
        },
    )

    result = await service.get_episode_insights(episode.id, child.family_id)

    assert result.duration_days == 4
    assert result.peak_temperature_celsius == 39.1
    assert result.peak_temperature_at == peak_temp_at
    assert result.last_temperature_celsius == 39.1
    assert result.temperature_count == 2
    assert result.administration_count == 1
    assert result.comment_count == 1
    assert result.total_events == 4
    assert result.first_temperature_at == first_temp_at
    assert result.last_administration_at == last_admin_at
    assert result.medicine_names == ["Парацетамол"]
    assert len(result.temperature_points) == 2
