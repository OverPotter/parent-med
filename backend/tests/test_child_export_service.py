import io
import zipfile
from datetime import UTC, date, datetime
from pathlib import Path
from uuid import uuid4

import pytest

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.application.services.child_export_service import ChildExportService
from src.core.exceptions import ValidationError
from src.domain.entities.administration_event import AdministrationEvent
from src.domain.entities.child import Child
from src.domain.entities.family import Family
from src.domain.entities.feeding_record import FeedingRecord
from src.domain.entities.height_entry import HeightEntry
from src.domain.entities.illness_comment import IllnessComment
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.sleep_session import SleepSession
from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.entities.weight_entry import WeightEntry


class StubChildRepository:
    def __init__(self, child: Child) -> None:
        self.child = child

    async def get_by_id(self, child_id):  # noqa: ANN001
        return self.child if child_id == self.child.id else None


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def get_by_id(self, family_id):  # noqa: ANN001
        return self.family if family_id == self.family.id else None


class StubSleepRepository:
    def __init__(self, sessions: list[SleepSession]) -> None:
        self.sessions = sessions
        self.calls = 0

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.sessions if item.child_id == child_id]


class StubFeedingRepository:
    def __init__(self, records: list[FeedingRecord]) -> None:
        self.records = records
        self.calls = 0

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.records if item.child_id == child_id]


class StubWeightRepository:
    def __init__(self, entries: list[WeightEntry]) -> None:
        self.entries = entries
        self.calls = 0

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.entries if item.child_id == child_id]


class StubHeightRepository:
    def __init__(self, entries: list[HeightEntry]) -> None:
        self.entries = entries
        self.calls = 0

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.entries if item.child_id == child_id]


class StubEpisodeRepository:
    def __init__(self, episodes: list[IllnessEpisode]) -> None:
        self.episodes = episodes
        self.calls = 0

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.episodes if item.child_id == child_id]


class StubTemperatureRepository:
    def __init__(self, entries: list[TemperatureEntry]) -> None:
        self.entries = entries
        self.calls = 0
        self.batch_calls = 0

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.entries if item.episode_id == episode_id]

    async def get_by_episode_ids(self, episode_ids):  # noqa: ANN001
        self.batch_calls += 1
        return {
            episode_id: [item for item in self.entries if item.episode_id == episode_id]
            for episode_id in episode_ids
        }


class StubAdministrationRepository:
    def __init__(self, events: list[AdministrationEvent]) -> None:
        self.events = events
        self.calls = 0
        self.batch_calls = 0

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.events if item.episode_id == episode_id]

    async def get_by_episode_ids(self, episode_ids):  # noqa: ANN001
        self.batch_calls += 1
        return {
            episode_id: [item for item in self.events if item.episode_id == episode_id]
            for episode_id in episode_ids
        }


class StubCommentRepository:
    def __init__(self, comments: list[IllnessComment]) -> None:
        self.comments = comments
        self.calls = 0
        self.batch_calls = 0

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        self.calls += 1
        return [item for item in self.comments if item.episode_id == episode_id]

    async def get_by_episode_ids(self, episode_ids):  # noqa: ANN001
        self.batch_calls += 1
        return {
            episode_id: [item for item in self.comments if item.episode_id == episode_id]
            for episode_id in episode_ids
        }


def build_service(
    *,
    child: Child,
    family: Family,
    sleeps: list[SleepSession] | None = None,
    feedings: list[FeedingRecord] | None = None,
    weights: list[WeightEntry] | None = None,
    heights: list[HeightEntry] | None = None,
    episodes: list[IllnessEpisode] | None = None,
    temperatures: list[TemperatureEntry] | None = None,
    administrations: list[AdministrationEvent] | None = None,
    comments: list[IllnessComment] | None = None,
) -> ChildExportService:
    return ChildExportService(
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
        sleep_repo=StubSleepRepository(sleeps or []),
        feeding_repo=StubFeedingRepository(feedings or []),
        weight_repo=StubWeightRepository(weights or []),
        height_repo=StubHeightRepository(heights or []),
        episode_repo=StubEpisodeRepository(episodes or []),
        temperature_repo=StubTemperatureRepository(temperatures or []),
        administration_repo=StubAdministrationRepository(administrations or []),
        comment_repo=StubCommentRepository(comments or []),
    )


def build_account(*, family_id, language: str = "ru") -> AuthenticatedAccount:
    return AuthenticatedAccount(
        id=uuid4(),
        email="mom@example.com",
        family_id=family_id,
        display_name="Мама",
        family_role="owner",
        preferred_language=language,  # type: ignore[arg-type]
        access_policy=FamilyAccessPolicyDto(
            all_children=True,
            children_access="edit",
            cabinet_access="edit",
            pillbox_access="edit",
        ),
    )


@pytest.mark.asyncio
async def test_export_requires_plus_access() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2023, 4, 2))
    family = Family(id=family_id, name="Family", plan_code="free", subscription_status="inactive")
    service = build_service(child=child, family=family)

    with pytest.raises(ValidationError, match="Экспорт данных доступен только в Plus"):
        await service.export_csv_for_account(
            child_id=child.id,
            export_kind="analytics_summary",
            period="all",
            current_account=build_account(family_id=family_id),
        )


@pytest.mark.asyncio
async def test_analytics_summary_export_contains_human_metrics() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2023, 4, 2))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 4, 20),
        title="Простуда",
        status="active",
        medication_mode="guided",
        note="Наблюдаем",
        closed_at=None,
        deleted_at=None,
    )
    service = build_service(
        child=child,
        family=family,
        sleeps=[
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 20, 21, 0, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 7, 0, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            )
        ],
        feedings=[
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="formula",
                breast_side=None,
                is_expressed=False,
                formula_volume_ml=120,
                recorded_at=datetime(2026, 4, 21, 8, 30, tzinfo=UTC),
                started_at=datetime(2026, 4, 21, 8, 20, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 8, 30, tzinfo=UTC),
                duration_minutes=10,
                status="completed",
                note=None,
                created_by_account_id=None,
            )
        ],
        weights=[
            WeightEntry(
                id=uuid4(),
                child_id=child.id,
                value_kg=12.8,
                measured_at=datetime(2026, 4, 21, 9, 0, tzinfo=UTC),
            )
        ],
        heights=[
            HeightEntry(
                id=uuid4(),
                child_id=child.id,
                value_cm=88,
                measured_at=datetime(2026, 4, 21, 9, 5, tzinfo=UTC),
            )
        ],
        episodes=[episode],
        temperatures=[
            TemperatureEntry(
                id=uuid4(),
                episode_id=episode.id,
                value_celsius=38.6,
                measured_at=datetime(2026, 4, 21, 10, 0, tzinfo=UTC),
                method="axillary",
                comment=None,
            )
        ],
        administrations=[
            AdministrationEvent(
                id=uuid4(),
                episode_id=episode.id,
                household_medicine_id=None,
                custom_medicine_name="Paracetamol",
                administered_at=datetime(2026, 4, 21, 10, 10, tzinfo=UTC),
                administered_by_account_id=None,
                administered_by_name_snapshot="Мама",
                amount="5",
                unit="мл",
                reason="Жаропонижающее",
            )
        ],
    )

    export_file = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="analytics_summary",
        period="custom",
        start_date=date(2026, 4, 20),
        end_date=date(2026, 4, 21),
        current_account=build_account(family_id=family_id),
    )

    assert export_file.filename == "Мия_analytics_summary.csv"
    assert "Показатель,Значение" in export_file.content
    assert "Ребёнок,Мия" in export_file.content
    assert "Возраст,3 года" in export_file.content
    assert "Последний записанный вес,\"12,8 кг\"" in export_file.content
    assert "Последний записанный рост,88 см" in export_file.content
    assert "Средний сон в сутки,5 ч" in export_file.content
    assert "Кормлений в среднем за день,\"0,5\"" in export_file.content
    assert "Максимальная температура,\"38,6 °C\"" in export_file.content
    assert "Записанных приёмов лекарств,1" in export_file.content


@pytest.mark.asyncio
async def test_analytics_summary_age_uses_period_end_not_today() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2023, 4, 2))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    service = build_service(child=child, family=family)

    export_file = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="analytics_summary",
        period="custom",
        start_date=date(2024, 4, 1),
        end_date=date(2024, 4, 10),
        current_account=build_account(family_id=family_id),
    )

    assert "Возраст,1 год" in export_file.content


@pytest.mark.asyncio
async def test_analytics_summary_skips_empty_metrics() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=None)
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    service = build_service(child=child, family=family)

    export_file = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="analytics_summary",
        period="all",
        current_account=build_account(family_id=family_id),
    )

    assert export_file.content == "Показатель,Значение\r\nРебёнок,Мия\r\nПериод,Все время\r\n"


@pytest.mark.asyncio
async def test_child_care_export_marks_night_sleep_and_numbers_day_naps() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2024, 1, 10))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    service = build_service(
        child=child,
        family=family,
        sleeps=[
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 20, 21, 0, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 7, 0, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 21, 9, 30, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 10, 10, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 21, 13, 15, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 14, 5, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
        ],
    )

    export_file = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="child_care",
        period="all",
        current_account=build_account(family_id=family_id),
    )

    assert "Ребёнок,Мия" in export_file.content
    assert "Период,Все время" in export_file.content
    assert "Всего снов,3" not in export_file.content
    assert "Показатель,Значение" not in export_file.content
    assert "\r\nСон\r\nДата,Время,Что записано,Подробности,Заметка\r\n" in export_file.content
    assert "20.04.2026,21:00-07:00,Ночной сон,10 ч," in export_file.content
    assert "21.04.2026,09:30-10:10,Дневной сон 1,40 мин," in export_file.content
    assert "21.04.2026,13:15-14:05,Дневной сон 2,50 мин," in export_file.content


@pytest.mark.asyncio
async def test_child_care_xlsx_keeps_detailed_sections_without_summary_block() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2024, 1, 10))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    service = build_service(
        child=child,
        family=family,
        sleeps=[
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 20, 21, 0, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 7, 0, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            )
        ],
        feedings=[
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="formula",
                breast_side=None,
                is_expressed=False,
                formula_volume_ml=120,
                recorded_at=datetime(2026, 4, 21, 8, 30, tzinfo=UTC),
                started_at=datetime(2026, 4, 21, 8, 20, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 8, 30, tzinfo=UTC),
                duration_minutes=10,
                status="completed",
                note=None,
                created_by_account_id=None,
            )
        ],
    )

    export_file = await service.export_xlsx_for_account(
        child_id=child.id,
        export_kind="child_care",
        period="all",
        current_account=build_account(family_id=family_id),
    )

    with zipfile.ZipFile(io.BytesIO(export_file.content)) as archive:
        sheet_xml = archive.read("xl/worksheets/sheet1.xml").decode("utf-8")

    assert "Ребёнок" in sheet_xml
    assert "Всего снов" not in sheet_xml
    assert "Сон" in sheet_xml
    assert "Кормление" in sheet_xml
    assert "Ночной сон" in sheet_xml


@pytest.mark.asyncio
async def test_child_care_export_does_not_load_illness_history() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2024, 1, 10))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    sleep_repo = StubSleepRepository([])
    feeding_repo = StubFeedingRepository([])
    weight_repo = StubWeightRepository([])
    height_repo = StubHeightRepository([])
    episode_repo = StubEpisodeRepository([])
    temperature_repo = StubTemperatureRepository([])
    administration_repo = StubAdministrationRepository([])
    comment_repo = StubCommentRepository([])
    service = ChildExportService(
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
        sleep_repo=sleep_repo,
        feeding_repo=feeding_repo,
        weight_repo=weight_repo,
        height_repo=height_repo,
        episode_repo=episode_repo,
        temperature_repo=temperature_repo,
        administration_repo=administration_repo,
        comment_repo=comment_repo,
    )

    await service.export_csv_for_account(
        child_id=child.id,
        export_kind="child_care",
        period="all",
        current_account=build_account(family_id=family_id),
    )

    assert sleep_repo.calls == 1
    assert feeding_repo.calls == 1
    assert weight_repo.calls == 1
    assert height_repo.calls == 1
    assert episode_repo.calls == 0
    assert temperature_repo.batch_calls == 0
    assert administration_repo.batch_calls == 0
    assert comment_repo.batch_calls == 0


@pytest.mark.asyncio
async def test_root_sample_csv_files_match_current_export_output() -> None:
    project_root = Path(__file__).resolve().parents[2]
    csv_examples_dir = project_root / "frontend" / "docs" / "csv-examples"
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2024, 4, 21))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    active_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 4, 20),
        title="Простуда",
        status="active",
        medication_mode="guided",
        note="Наблюдаем дома",
        closed_at=None,
        deleted_at=None,
    )
    closed_episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 4, 24),
        title="Ушиб колена",
        status="closed",
        medication_mode="manual",
        note="Упал на площадке",
        closed_at=datetime(2026, 4, 24, 19, 0, tzinfo=UTC),
        deleted_at=None,
    )
    service = build_service(
        child=child,
        family=family,
        sleeps=[
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 20, 21, 10, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 6, 55, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 21, 9, 35, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 10, 10, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 21, 14, 10, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 15, 5, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
            SleepSession(
                id=uuid4(),
                child_id=child.id,
                started_at=datetime(2026, 4, 21, 21, 0, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 22, 57, tzinfo=UTC),
                status="completed",
                created_by_account_id=None,
            ),
        ],
        feedings=[
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="breast",
                breast_side="right",
                is_expressed=False,
                formula_volume_ml=None,
                recorded_at=datetime(2026, 4, 20, 20, 12, tzinfo=UTC),
                started_at=datetime(2026, 4, 20, 20, 0, tzinfo=UTC),
                ended_at=datetime(2026, 4, 20, 20, 12, tzinfo=UTC),
                duration_minutes=12,
                status="completed",
                note=None,
                created_by_account_id=None,
            ),
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="breast",
                breast_side="left",
                is_expressed=False,
                formula_volume_ml=None,
                recorded_at=datetime(2026, 4, 21, 7, 55, tzinfo=UTC),
                started_at=datetime(2026, 4, 21, 7, 40, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 7, 55, tzinfo=UTC),
                duration_minutes=15,
                status="completed",
                note=None,
                created_by_account_id=None,
            ),
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="formula",
                breast_side=None,
                is_expressed=False,
                formula_volume_ml=120,
                recorded_at=datetime(2026, 4, 21, 12, 0, tzinfo=UTC),
                started_at=datetime(2026, 4, 21, 11, 50, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 12, 0, tzinfo=UTC),
                duration_minutes=None,
                status="completed",
                note=None,
                created_by_account_id=None,
            ),
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="formula",
                breast_side=None,
                is_expressed=False,
                formula_volume_ml=120,
                recorded_at=datetime(2026, 4, 21, 16, 30, tzinfo=UTC),
                started_at=datetime(2026, 4, 21, 16, 20, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 16, 30, tzinfo=UTC),
                duration_minutes=None,
                status="completed",
                note=None,
                created_by_account_id=None,
            ),
            FeedingRecord(
                id=uuid4(),
                child_id=child.id,
                feeding_type="formula",
                breast_side=None,
                is_expressed=False,
                formula_volume_ml=120,
                recorded_at=datetime(2026, 4, 21, 19, 50, tzinfo=UTC),
                started_at=datetime(2026, 4, 21, 19, 40, tzinfo=UTC),
                ended_at=datetime(2026, 4, 21, 19, 50, tzinfo=UTC),
                duration_minutes=None,
                status="completed",
                note="Перед сном",
                created_by_account_id=None,
            ),
        ],
        weights=[
            WeightEntry(
                id=uuid4(),
                child_id=child.id,
                value_kg=12.8,
                measured_at=datetime(2026, 4, 21, 9, 0, tzinfo=UTC),
            )
        ],
        heights=[
            HeightEntry(
                id=uuid4(),
                child_id=child.id,
                value_cm=88,
                measured_at=datetime(2026, 4, 21, 9, 5, tzinfo=UTC),
            )
        ],
        episodes=[active_episode, closed_episode],
        temperatures=[
            TemperatureEntry(
                id=uuid4(),
                episode_id=active_episode.id,
                value_celsius=38.1,
                measured_at=datetime(2026, 4, 20, 10, 0, tzinfo=UTC),
                method="axillary",
                comment=None,
                created_by_name_snapshot="Мама",
            ),
            TemperatureEntry(
                id=uuid4(),
                episode_id=active_episode.id,
                value_celsius=38.6,
                measured_at=datetime(2026, 4, 20, 18, 40, tzinfo=UTC),
                method="axillary",
                comment=None,
                created_by_name_snapshot="Папа",
            ),
        ],
        administrations=[
            AdministrationEvent(
                id=uuid4(),
                episode_id=active_episode.id,
                household_medicine_id=None,
                custom_medicine_name="Парацетамол",
                administered_at=datetime(2026, 4, 20, 10, 10, tzinfo=UTC),
                administered_by_account_id=None,
                administered_by_name_snapshot="Мама",
                amount="5",
                unit="мл",
                reason="После еды",
            ),
            AdministrationEvent(
                id=uuid4(),
                episode_id=active_episode.id,
                household_medicine_id=None,
                custom_medicine_name="Парацетамол",
                administered_at=datetime(2026, 4, 20, 18, 50, tzinfo=UTC),
                administered_by_account_id=None,
                administered_by_name_snapshot="Папа",
                amount="5",
                unit="мл",
                reason="Повторно",
            ),
            AdministrationEvent(
                id=uuid4(),
                episode_id=closed_episode.id,
                household_medicine_id=None,
                custom_medicine_name="Пантенол",
                administered_at=datetime(2026, 4, 24, 17, 30, tzinfo=UTC),
                administered_by_account_id=None,
                administered_by_name_snapshot="Мама",
                amount="1",
                unit="нанесение",
                reason="На кожу",
            ),
        ],
        comments=[
            IllnessComment(
                id=uuid4(),
                episode_id=active_episode.id,
                created_at=datetime(2026, 4, 20, 11, 30, tzinfo=UTC),
                text="Пьёт мало воды",
                created_by_name_snapshot="Мама",
            ),
            IllnessComment(
                id=uuid4(),
                episode_id=closed_episode.id,
                created_at=datetime(2026, 4, 24, 17, 20, tzinfo=UTC),
                text="Обработали и приложили холод",
                created_by_name_snapshot="Мама",
            ),
        ],
    )

    analytics_summary = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="analytics_summary",
        period="custom",
        start_date=date(2026, 4, 20),
        end_date=date(2026, 4, 21),
        current_account=build_account(family_id=family_id),
    )
    child_care = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="child_care",
        period="custom",
        start_date=date(2026, 4, 20),
        end_date=date(2026, 4, 21),
        current_account=build_account(family_id=family_id),
    )
    child_illness = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="child_illness",
        period="all",
        current_account=build_account(family_id=family_id),
    )

    assert _normalize_csv_newlines(analytics_summary.content) == _read_normalized_csv_sample(
        csv_examples_dir / "analytics_summary.csv"
    )
    assert _normalize_csv_newlines(child_care.content) == _read_normalized_csv_sample(
        csv_examples_dir / "child_care.csv"
    )
    assert _normalize_csv_newlines(child_illness.content) == _read_normalized_csv_sample(
        csv_examples_dir / "child_illness.csv"
    )


def _normalize_csv_newlines(value: str) -> str:
    return value.replace("\r\n", "\n").rstrip("\n")


def _read_normalized_csv_sample(path: Path) -> str:
    return _normalize_csv_newlines(path.read_text())


@pytest.mark.asyncio
async def test_child_illness_export_contains_episode_timeline() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Mia", birth_date=date(2023, 4, 2))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 4, 22),
        title="Evening fever",
        status="active",
        medication_mode="manual",
        note="Watch overnight",
        closed_at=None,
        deleted_at=None,
    )
    service = build_service(
        child=child,
        family=family,
        episodes=[episode],
        temperatures=[
            TemperatureEntry(
                id=uuid4(),
                episode_id=episode.id,
                value_celsius=38.4,
                measured_at=datetime(2026, 4, 22, 18, 0, tzinfo=UTC),
                method="axillary",
                comment="Before medicine",
                created_by_name_snapshot="Mom",
            )
        ],
        administrations=[
            AdministrationEvent(
                id=uuid4(),
                episode_id=episode.id,
                household_medicine_id=None,
                custom_medicine_name="Ibuprofen",
                administered_at=datetime(2026, 4, 22, 18, 10, tzinfo=UTC),
                administered_by_account_id=None,
                administered_by_name_snapshot="Mom",
                amount="5",
                unit="ml",
                reason="Fever reducer",
            )
        ],
        comments=[
            IllnessComment(
                id=uuid4(),
                episode_id=episode.id,
                created_at=datetime(2026, 4, 22, 21, 0, tzinfo=UTC),
                text="Fell asleep earlier than usual",
                created_by_name_snapshot="Mom",
            )
        ],
    )

    export_file = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="child_illness",
        period="all",
        current_account=build_account(family_id=family_id, language="en"),
    )

    assert export_file.filename == "Mia_child_illness.csv"
    assert (
        "Child,Mia"
        in export_file.content
    )
    assert (
        "Period,All time"
        in export_file.content
    )
    assert (
        "Episode,Event,Date,Time,Value,Medicine,Recorded by,Status,Details,Note"
        in export_file.content
    )
    assert "Evening fever,,2026-04-22,,,,,Active,Manual log,Watch overnight" in export_file.content
    assert (
        ",Temperature,2026-04-22,18:00,38.4 °C,,Mom,,Axillary,Before medicine"
        in export_file.content
    )
    assert (
        ",Medication,2026-04-22,18:10,5 ml,Ibuprofen,Mom,,Fever reducer,"
        in export_file.content
    )
    assert (
        ",Comment,2026-04-22,21:00,,,Mom,,,Fell asleep earlier than usual"
        in export_file.content
    )


@pytest.mark.asyncio
async def test_child_illness_export_keeps_overlapping_episode_started_before_period() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Мия", birth_date=date(2023, 4, 2))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 4, 10),
        title="Затяжная температура",
        status="active",
        medication_mode="guided",
        note="Следим дальше",
        closed_at=None,
        deleted_at=None,
    )
    service = build_service(
        child=child,
        family=family,
        episodes=[episode],
        temperatures=[
            TemperatureEntry(
                id=uuid4(),
                episode_id=episode.id,
                value_celsius=38.2,
                measured_at=datetime(2026, 4, 21, 9, 0, tzinfo=UTC),
                method="axillary",
                comment="Утро",
                created_by_name_snapshot="Мама",
            )
        ],
    )

    export_file = await service.export_csv_for_account(
        child_id=child.id,
        export_kind="child_illness",
        period="custom",
        start_date=date(2026, 4, 20),
        end_date=date(2026, 4, 22),
        current_account=build_account(family_id=family_id),
    )

    assert "Затяжная температура,,10.04.2026" in export_file.content
    assert ",Температура,21.04.2026,09:00,\"38,2 °C\"" in export_file.content


@pytest.mark.asyncio
async def test_export_archive_contains_all_three_csv_files() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Mia", birth_date=date(2023, 4, 2))
    family = Family(id=family_id, name="Family", plan_code="plus", subscription_status="active")
    service = build_service(child=child, family=family)

    archive = await service.export_archive_for_account(
        child_id=child.id,
        period="all",
        current_account=build_account(family_id=family_id, language="en"),
    )

    assert archive.filename == "Mia_exports.zip"
    import zipfile
    from io import BytesIO

    with zipfile.ZipFile(BytesIO(archive.content)) as zip_file:
        assert sorted(zip_file.namelist()) == [
            "Mia_analytics_summary.csv",
            "Mia_child_care.csv",
            "Mia_child_illness.csv",
        ]
