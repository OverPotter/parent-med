"""Reset local user data and seed one realistic family demo dataset."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from urllib.parse import urlparse
from uuid import UUID, uuid4

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.security import hash_password
from src.domain.entities.family_access import build_default_family_access_policy
from src.infrastructure.database.models import (
    AccountModel,
    ChildModel,
    FamilyModel,
    FeedingRecordModel,
    HeightEntryModel,
    HouseholdMedicineModel,
    IllnessEpisodeEventModel,
    IllnessEpisodeModel,
    ParentModel,
    PillboxDoseLogModel,
    PillboxMedicationModel,
    PillboxPlanModel,
    SleepSessionModel,
    WeightEntryModel,
)
from src.infrastructure.database.models.episode_medication_plan import EpisodeMedicationPlanModel


DEMO_PASSWORD = "20390680"
DEMO_RECOVERY_CODE = "20390680"
LOCAL_HOSTS = {"localhost", "127.0.0.1"}


@dataclass(frozen=True)
class AccountSeed:
    email: str
    display_name: str
    relationship_label: str
    family_role: str
    preferred_language: str = "ru"


@dataclass(frozen=True)
class EpisodeSeed:
    title: str
    started_days_ago: int
    duration_days: int
    status: str
    medication_mode: str
    note: str | None
    temperatures: list[tuple[int, float, str | None]]
    administrations: list[tuple[int, str, str, str | None]]
    comments: list[tuple[int, str]]
    plans: list[tuple[str, str, int, int | None, str | None]]


@dataclass(frozen=True)
class ChildSeed:
    name: str
    birth_date: date
    baby_mode_enabled: bool
    notes: str | None
    allergies: str | None
    doctor_name: str | None
    doctor_phone: str | None
    institution_name: str | None
    institution_phone: str | None
    weights: list[tuple[int, float]]
    heights: list[tuple[int, float]]
    episodes: list[EpisodeSeed]


def _assert_local_database() -> None:
    parsed = urlparse(settings.database_url.replace("+asyncpg", ""))
    if parsed.hostname not in LOCAL_HOSTS:
        raise RuntimeError(
            "Refusing to reset a non-local database. "
            f"Configured host is {parsed.hostname!r}, expected localhost."
        )


def _dt_days_ago(days_ago: int, hour: int, minute: int) -> datetime:
    base = datetime.now(UTC) - timedelta(days=days_ago)
    return base.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _pick_author(accounts: list[AccountModel], index: int) -> AccountModel:
    return accounts[index % len(accounts)]


def _build_children() -> list[ChildSeed]:
    return [
        ChildSeed(
            name="Марк",
            birth_date=date(2020, 8, 14),
            baby_mode_enabled=False,
            notes=(
                "Ходит в сад, часто приносит сезонные вирусы. "
                "Родители обычно фиксируют температуру и один-два приёма жаропонижающих."
            ),
            allergies="Чувствительность к клубнике, без лекарственных аллергий.",
            doctor_name="Андрей Сергеевич Морозов",
            doctor_phone="+375291110011",
            institution_name="Детский сад №17",
            institution_phone="+375172001717",
            weights=[(190, 17.6), (120, 18.1), (60, 18.6), (12, 19.0)],
            heights=[(190, 108.0), (120, 109.8), (60, 111.4), (12, 112.6)],
            episodes=[
                EpisodeSeed(
                    title="ОРВИ с температурой и ночным скачком",
                    started_days_ago=9,
                    duration_days=4,
                    status="closed",
                    medication_mode="guided",
                    note="После второго дня стало легче, но ночью был ещё один подъём.",
                    temperatures=[
                        (9, 38.2, "Утром жаловался на озноб"),
                        (8, 39.0, "После сада уснул раньше обычного"),
                        (8, 38.4, "После ибупрофена"),
                        (7, 37.6, "К вечеру активность вернулась"),
                    ],
                    administrations=[
                        (8, "Ибупрофен суспензия", "7.5", "Температура поднялась выше 38.8"),
                        (7, "Парацетамол сироп", "7.5", "Ночной подъём температуры"),
                    ],
                    comments=[
                        (8, "Вечером почти не ужинал, но пил много воды."),
                        (7, "После дневного сна стал бодрее, попросил мультики."),
                    ],
                    plans=[
                        ("Ибупрофен суспензия", "7.5", 480, 3, "Основной жаропонижающий план"),
                        ("Парацетамол сироп", "7.5", 360, 4, "Если ночью снова выше 38.5"),
                    ],
                ),
                EpisodeSeed(
                    title="Сухой кашель без температуры",
                    started_days_ago=41,
                    duration_days=3,
                    status="closed",
                    medication_mode="manual",
                    note="Наблюдение дома, без жаропонижающих.",
                    temperatures=[],
                    administrations=[],
                    comments=[
                        (41, "Кашель усиливался под утро."),
                        (40, "После увлажнителя ночью спал спокойнее."),
                    ],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Осенняя вирусная инфекция",
                    started_days_ago=97,
                    duration_days=5,
                    status="closed",
                    medication_mode="guided",
                    note="Типичный затяжной эпизод после сада.",
                    temperatures=[
                        (97, 37.9, "После дневного сна"),
                        (96, 38.6, "К вечеру"),
                        (95, 38.1, "После лекарства"),
                        (94, 37.5, "Утро четвёртого дня"),
                    ],
                    administrations=[
                        (96, "Ибупрофен суспензия", "7.5", "Высокая температура вечером"),
                        (95, "Ибупрофен суспензия", "7.5", "Утром снова 38+"),
                    ],
                    comments=[
                        (96, "Спал днём почти два часа вместо обычного одного."),
                        (94, "Появился аппетит, попросил суп."),
                    ],
                    plans=[
                        ("Ибупрофен суспензия", "7.5", 480, 3, "На 3 дня наблюдения"),
                    ],
                ),
                EpisodeSeed(
                    title="Февральская простуда",
                    started_days_ago=176,
                    duration_days=4,
                    status="closed",
                    medication_mode="manual",
                    note="Короткая температура, без активных напоминаний.",
                    temperatures=[
                        (176, 38.0, "Вечер"),
                        (175, 37.7, "Утро"),
                    ],
                    administrations=[(176, "Парацетамол сироп", "7.5", "Перед сном")],
                    comments=[(175, "На второй день уже просился гулять.")],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Текущий насморк и субфебрилитет",
                    started_days_ago=1,
                    duration_days=1,
                    status="active",
                    medication_mode="guided",
                    note="Открытый эпизод для проверки актуальной карточки и timeline.",
                    temperatures=[
                        (1, 37.8, "Утро"),
                        (0, 38.3, "После тихого часа"),
                    ],
                    administrations=[
                        (0, "Ибупрофен суспензия", "7.5", "К вечеру стал вялым"),
                    ],
                    comments=[
                        (1, "Ночью спал хуже обычного, просыпался от заложенности."),
                        (0, "После лекарства поиграл и поел суп."),
                    ],
                    plans=[
                        ("Ибупрофен суспензия", "7.5", 480, 3, "Оставить напоминания на текущий эпизод"),
                    ],
                ),
            ],
        ),
        ChildSeed(
            name="Алиса",
            birth_date=date(2017, 11, 2),
            baby_mode_enabled=False,
            notes="Школьный возраст, болеет реже, но родители ведут комментарии и динамику температуры.",
            allergies="Нет известных аллергий.",
            doctor_name="Елена Викторовна Гринь",
            doctor_phone="+375292220022",
            institution_name="Школа №8",
            institution_phone="+375172008008",
            weights=[(180, 23.4), (90, 24.1), (14, 24.8)],
            heights=[(180, 122.0), (90, 124.1), (14, 125.0)],
            episodes=[
                EpisodeSeed(
                    title="Боль в горле и температура",
                    started_days_ago=58,
                    duration_days=4,
                    status="closed",
                    medication_mode="manual",
                    note="Один жаропонижающий, дальше только наблюдение.",
                    temperatures=[
                        (58, 38.1, "После школы"),
                        (57, 38.5, "Под вечер"),
                        (56, 37.4, "После отдыха"),
                    ],
                    administrations=[
                        (57, "Парацетамол сироп", "10", "На ночь при 38.5"),
                    ],
                    comments=[
                        (58, "Жаловалась на боль при глотании."),
                        (56, "На третий день уже делала уроки без усталости."),
                    ],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Весенний насморк",
                    started_days_ago=133,
                    duration_days=3,
                    status="closed",
                    medication_mode="manual",
                    note="Лёгкий эпизод без температуры.",
                    temperatures=[],
                    administrations=[],
                    comments=[
                        (133, "Чихала утром и вечером."),
                        (132, "К концу второго дня стало заметно легче."),
                    ],
                    plans=[],
                ),
            ],
        ),
        ChildSeed(
            name="Илья",
            birth_date=date(2024, 1, 28),
            baby_mode_enabled=True,
            notes="Младший ребёнок: сон и кормления ведутся регулярно, есть лёгкие простуды.",
            allergies="Нет.",
            doctor_name="Мария Петровна Швед",
            doctor_phone="+375293330033",
            institution_name=None,
            institution_phone=None,
            weights=[(180, 9.2), (120, 10.1), (60, 10.9), (7, 11.4)],
            heights=[(180, 74.5), (120, 77.2), (60, 79.9), (7, 81.5)],
            episodes=[
                EpisodeSeed(
                    title="Прорезывание зубов и вечерняя температура",
                    started_days_ago=24,
                    duration_days=2,
                    status="closed",
                    medication_mode="manual",
                    note="Состояние больше похоже на зубы, чем на инфекцию.",
                    temperatures=[
                        (24, 37.7, "Под вечер"),
                        (23, 37.3, "Утро"),
                    ],
                    administrations=[],
                    comments=[
                        (24, "Много тянул руки в рот, капризничал перед сном."),
                    ],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Лёгкий насморк у малыша",
                    started_days_ago=142,
                    duration_days=3,
                    status="closed",
                    medication_mode="manual",
                    note="Без лекарств, только наблюдение.",
                    temperatures=[],
                    administrations=[],
                    comments=[
                        (142, "Спал беспокойно из-за заложенности."),
                        (141, "После промывания носа ел лучше."),
                    ],
                    plans=[],
                ),
            ],
        ),
    ]


async def _reset_user_data(session: AsyncSession) -> None:
    tables = [
        "pillbox_notification_deliveries",
        "pillbox_dose_logs",
        "pillbox_medications",
        "pillbox_plans",
        "household_medicine_notification_deliveries",
        "episode_medication_plans",
        "illness_episode_events",
        "administration_events",
        "temperature_entries",
        "illness_episodes",
        "feeding_records",
        "sleep_sessions",
        "height_entries",
        "weight_entries",
        "children",
        "family_invites",
        "push_subscriptions",
        "account_sessions",
        "account_feedback",
        "parents",
        "household_medicines",
        "accounts",
        "families",
    ]
    await session.execute(text(f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE"))


async def _create_family(session: AsyncSession) -> tuple[FamilyModel, list[AccountModel]]:
    family = FamilyModel(
        id=uuid4(),
        name="Семья Хмялевых",
        plan_code="pro",
        subscription_status="active",
        subscription_provider="manual",
        subscription_product_id="local-demo-pro",
        subscription_expires_at=datetime.now(UTC) + timedelta(days=120),
        cabinet_member_account_ids=[],
    )
    session.add(family)
    await session.flush()

    specs = [
        AccountSeed(
            email="a.khmialev@gmail.com",
            display_name="Артем",
            relationship_label="Папа",
            family_role="admin",
        ),
        AccountSeed(
            email="a1.khmialev@gmail.com",
            display_name="Саша",
            relationship_label="Мама",
            family_role="admin",
        ),
    ]

    accounts: list[AccountModel] = []
    for spec in specs:
        account = AccountModel(
            id=uuid4(),
            email=spec.email,
            password_hash=hash_password(DEMO_PASSWORD),
            recovery_code_hash=hash_password(DEMO_RECOVERY_CODE),
            family_id=family.id,
            display_name=spec.display_name,
            relationship_label=spec.relationship_label,
            phone=None,
            preferred_language=spec.preferred_language,
            family_role=spec.family_role,
            access_policy=build_default_family_access_policy().__dict__,
            push_before_reminder_minutes=10,
            children_push_enabled=True,
            pillbox_push_enabled=True,
            pillbox_push_before_reminder_minutes=10,
            cabinet_notify_30_days=True,
            cabinet_notify_15_days=True,
            cabinet_notify_7_days=True,
            cabinet_notify_3_days=True,
            cabinet_notify_1_day=True,
            live_activity_sleep_enabled=True,
            live_activity_feeding_enabled=True,
            live_activity_illness_enabled=True,
            created_at=datetime.now(UTC),
        )
        session.add(account)
        accounts.append(account)

    await session.flush()
    family.billing_account_id = accounts[0].id
    family.cabinet_member_account_ids = [account.id for account in accounts]

    session.add_all(
        [
            ParentModel(id=uuid4(), family_id=family.id, name="Артем", role="Папа"),
            ParentModel(id=uuid4(), family_id=family.id, name="Саша", role="Мама"),
        ]
    )
    await session.flush()
    return family, accounts


async def _create_household_medicines(
    session: AsyncSession,
    family: FamilyModel,
) -> list[HouseholdMedicineModel]:
    now = datetime.now(UTC)
    medicines = [
        HouseholdMedicineModel(
            id=uuid4(),
            family_id=family.id,
            medicine_name="Нурофен для детей",
            medicine_form="suspension",
            medicine_category="Жаропонижающее",
            medicine_concentration="100 мг / 5 мл",
            medicine_description="Используют при температуре и боли.",
            medicine_dosage="Обычно 7.5 мл для старших детей по фактическому весу.",
            expiry_date=(now + timedelta(days=280)).date(),
            opened_at=now - timedelta(days=35),
            opened_shelf_days=180,
            storage_place="Аптечка на кухне",
            comment="Основной жаропонижающий дома",
        ),
        HouseholdMedicineModel(
            id=uuid4(),
            family_id=family.id,
            medicine_name="Парацетамол сироп",
            medicine_form="syrup",
            medicine_category="Жаропонижающее",
            medicine_concentration="120 мг / 5 мл",
            medicine_description="Запасной вариант на ночь.",
            medicine_dosage="7.5-10 мл в зависимости от веса и возраста.",
            expiry_date=(now + timedelta(days=120)).date(),
            opened_at=now - timedelta(days=18),
            opened_shelf_days=120,
            storage_place="Аптечка на кухне",
            comment="Используют реже, когда нужен второй вариант",
        ),
        HouseholdMedicineModel(
            id=uuid4(),
            family_id=family.id,
            medicine_name="Аквалор беби",
            medicine_form="spray",
            medicine_category="Нос",
            medicine_concentration=None,
            medicine_description="Для промывания носа малышу.",
            medicine_dosage="По потребности, особенно перед сном.",
            expiry_date=(now + timedelta(days=400)).date(),
            opened_at=now - timedelta(days=62),
            opened_shelf_days=365,
            storage_place="Комод в спальне",
            comment="Часто используется зимой",
        ),
        HouseholdMedicineModel(
            id=uuid4(),
            family_id=family.id,
            medicine_name="Витамин D3",
            medicine_form="drops",
            medicine_category="Витамины",
            medicine_concentration="500 IU / капля",
            medicine_description="Ежедневный приём младшему.",
            medicine_dosage="1 капля утром после еды.",
            expiry_date=(now + timedelta(days=220)).date(),
            opened_at=now - timedelta(days=12),
            opened_shelf_days=180,
            storage_place="Кухня, верхний шкаф",
            comment="Ежедневная рутина",
        ),
        HouseholdMedicineModel(
            id=uuid4(),
            family_id=family.id,
            medicine_name="Пробиотик в каплях",
            medicine_form="drops",
            medicine_category="ЖКТ",
            medicine_concentration=None,
            medicine_description="Курс после антибиотика.",
            medicine_dosage="5 капель утром 14 дней.",
            expiry_date=(now + timedelta(days=35)).date(),
            opened_at=now - timedelta(days=4),
            opened_shelf_days=30,
            storage_place="Холодильник",
            comment="Почти заканчивается, удобно для cabinet reminders",
        ),
    ]
    session.add_all(medicines)
    await session.flush()
    return medicines


async def _create_pillbox(
    session: AsyncSession,
    family: FamilyModel,
    accounts: list[AccountModel],
    medicines: list[HouseholdMedicineModel],
) -> None:
    created_by = accounts[0]
    now = datetime.now(UTC)

    plan = PillboxPlanModel(
        id=uuid4(),
        family_id=family.id,
        title="Утренние и вечерние домашние лекарства",
        status="active",
        member_account_ids=[account.id for account in accounts],
        created_by_account_id=created_by.id,
        created_at=now - timedelta(days=14),
        updated_at=now,
    )
    session.add(plan)
    await session.flush()

    vitamin_d = PillboxMedicationModel(
        id=uuid4(),
        plan_id=plan.id,
        household_medicine_id=medicines[3].id,
        custom_medicine_name=None,
        dose_amount="1 капля",
        meal_rule="after_meal",
        repeat_days=[0, 1, 2, 3, 4, 5, 6],
        times=[time(8, 30)],
        course_mode="ongoing",
        course_start_date=(now - timedelta(days=45)).date(),
        course_end_date=None,
        position=0,
    )
    probiotic = PillboxMedicationModel(
        id=uuid4(),
        plan_id=plan.id,
        household_medicine_id=medicines[4].id,
        custom_medicine_name=None,
        dose_amount="5 капель",
        meal_rule="after_meal",
        repeat_days=[0, 1, 2, 3, 4, 5, 6],
        times=[time(9, 15), time(20, 15)],
        course_mode="date_range",
        course_start_date=(now - timedelta(days=6)).date(),
        course_end_date=(now + timedelta(days=7)).date(),
        position=1,
    )
    session.add_all([vitamin_d, probiotic])
    await session.flush()

    logs: list[PillboxDoseLogModel] = []
    for days_ago in range(10, -1, -1):
        morning_author = _pick_author(accounts, days_ago)
        morning_time = _dt_days_ago(days_ago, 8, 35)
        logs.append(
            PillboxDoseLogModel(
                id=uuid4(),
                family_id=family.id,
                plan_id=plan.id,
                medication_id=vitamin_d.id,
                scheduled_for=morning_time,
                taken_at=morning_time + timedelta(minutes=4),
                taken_by_account_id=morning_author.id,
                taken_by_name_snapshot=morning_author.display_name,
                amount_snapshot="1 капля",
                source="manual",
                notes="Утренний ритуал после завтрака",
            )
        )
        if days_ago <= 6:
            evening_author = _pick_author(accounts, days_ago + 1)
            probiotic_time = _dt_days_ago(days_ago, 20, 15)
            logs.append(
                PillboxDoseLogModel(
                    id=uuid4(),
                    family_id=family.id,
                    plan_id=plan.id,
                    medication_id=probiotic.id,
                    scheduled_for=probiotic_time,
                    taken_at=probiotic_time + timedelta(minutes=12),
                    taken_by_account_id=evening_author.id,
                    taken_by_name_snapshot=evening_author.display_name,
                    amount_snapshot="5 капель",
                    source="manual",
                    notes="Курс после кишечного вируса",
                )
            )
    session.add_all(logs)
    await session.flush()


async def _create_growth_entries(
    session: AsyncSession,
    child: ChildModel,
    seed: ChildSeed,
) -> None:
    for days_ago, value_kg in seed.weights:
        session.add(
            WeightEntryModel(
                id=uuid4(),
                child_id=child.id,
                value_kg=value_kg,
                measured_at=_dt_days_ago(days_ago, 10, 10),
            )
        )
    for days_ago, value_cm in seed.heights:
        session.add(
            HeightEntryModel(
                id=uuid4(),
                child_id=child.id,
                value_cm=value_cm,
                measured_at=_dt_days_ago(days_ago, 10, 20),
            )
        )
    await session.flush()


async def _create_baby_tracking(
    session: AsyncSession,
    child: ChildModel,
    accounts: list[AccountModel],
) -> None:
    sleep_rows: list[SleepSessionModel] = []
    feeding_rows: list[FeedingRecordModel] = []

    for days_ago in range(21, -1, -1):
        night_author = _pick_author(accounts, days_ago)
        day_author = _pick_author(accounts, days_ago + 1)

        night_start = _dt_days_ago(days_ago + 1, 21, 40)
        night_end = _dt_days_ago(days_ago, 6, 45)
        nap_start = _dt_days_ago(days_ago, 13, 5)
        nap_end = _dt_days_ago(days_ago, 14, 35)

        sleep_rows.extend(
            [
                SleepSessionModel(
                    id=uuid4(),
                    child_id=child.id,
                    started_at=night_start,
                    ended_at=night_end,
                    status="completed",
                    created_by_account_id=night_author.id,
                ),
                SleepSessionModel(
                    id=uuid4(),
                    child_id=child.id,
                    started_at=nap_start,
                    ended_at=nap_end,
                    status="completed",
                    created_by_account_id=day_author.id,
                ),
            ]
        )

        morning_formula_at = _dt_days_ago(days_ago, 7, 15)
        lunch_formula_at = _dt_days_ago(days_ago, 12, 25)
        evening_formula_at = _dt_days_ago(days_ago, 19, 40)

        feeding_rows.extend(
            [
                FeedingRecordModel(
                    id=uuid4(),
                    child_id=child.id,
                    feeding_type="formula",
                    formula_volume_ml=180,
                    is_expressed=False,
                    recorded_at=morning_formula_at,
                    started_at=morning_formula_at,
                    ended_at=morning_formula_at + timedelta(minutes=18),
                    duration_minutes=18,
                    status="completed",
                    note="Утреннее кормление после пробуждения",
                    created_by_account_id=night_author.id,
                ),
                FeedingRecordModel(
                    id=uuid4(),
                    child_id=child.id,
                    feeding_type="formula",
                    formula_volume_ml=160,
                    is_expressed=False,
                    recorded_at=lunch_formula_at,
                    started_at=lunch_formula_at,
                    ended_at=lunch_formula_at + timedelta(minutes=16),
                    duration_minutes=16,
                    status="completed",
                    note="Перед дневным сном",
                    created_by_account_id=day_author.id,
                ),
                FeedingRecordModel(
                    id=uuid4(),
                    child_id=child.id,
                    feeding_type="formula",
                    formula_volume_ml=190,
                    is_expressed=False,
                    recorded_at=evening_formula_at,
                    started_at=evening_formula_at,
                    ended_at=evening_formula_at + timedelta(minutes=17),
                    duration_minutes=17,
                    status="completed",
                    note="Спокойно выпил весь объём",
                    created_by_account_id=night_author.id,
                ),
            ]
        )

    session.add_all(sleep_rows)
    session.add_all(feeding_rows)
    await session.flush()


async def _create_child_history(
    session: AsyncSession,
    family: FamilyModel,
    accounts: list[AccountModel],
) -> list[ChildModel]:
    children: list[ChildModel] = []
    for child_index, seed in enumerate(_build_children()):
        child = ChildModel(
            id=uuid4(),
            family_id=family.id,
            name=seed.name,
            birth_date=seed.birth_date,
            baby_mode_enabled=seed.baby_mode_enabled,
            institution_name=seed.institution_name,
            institution_phone=seed.institution_phone,
            doctor_name=seed.doctor_name,
            doctor_phone=seed.doctor_phone,
            allergies=seed.allergies,
            notes=seed.notes,
        )
        session.add(child)
        await session.flush()

        await _create_growth_entries(session, child, seed)
        if seed.baby_mode_enabled:
            await _create_baby_tracking(session, child, accounts)

        for episode_index, episode_seed in enumerate(seed.episodes):
            closed_at = _dt_days_ago(
                max(0, episode_seed.started_days_ago - episode_seed.duration_days + 1),
                19,
                10,
            )
            episode = IllnessEpisodeModel(
                id=uuid4(),
                child_id=child.id,
                started_at=(datetime.now(UTC) - timedelta(days=episode_seed.started_days_ago)).date(),
                title=episode_seed.title,
                status=episode_seed.status,
                medication_mode=episode_seed.medication_mode,
                note=episode_seed.note,
                member_account_ids=[account.id for account in accounts],
                closed_at=closed_at if episode_seed.status == "closed" else None,
                deleted_at=None,
            )
            session.add(episode)
            await session.flush()

            for event_index, (days_ago, value_celsius, comment) in enumerate(
                episode_seed.temperatures
            ):
                author = _pick_author(accounts, child_index + episode_index + event_index)
                session.add(
                    IllnessEpisodeEventModel(
                        id=uuid4(),
                        episode_id=episode.id,
                        event_type="temperature",
                        occurred_at=_dt_days_ago(days_ago, 8, 50),
                        value_celsius=value_celsius,
                        method="axillary",
                        comment=comment,
                        created_by_account_id=author.id,
                        created_by_name_snapshot=author.display_name,
                    )
                )

            for event_index, (days_ago, medicine_name, amount, reason) in enumerate(
                episode_seed.administrations
            ):
                author = _pick_author(accounts, child_index + episode_index + event_index + 3)
                session.add(
                    IllnessEpisodeEventModel(
                        id=uuid4(),
                        episode_id=episode.id,
                        event_type="administration",
                        occurred_at=_dt_days_ago(days_ago, 21, 5),
                        household_medicine_id=None,
                        created_by_account_id=author.id,
                        created_by_name_snapshot=author.display_name,
                        administered_by_account_id=author.id,
                        administered_by_name_snapshot=author.display_name,
                        amount=amount,
                        unit="мл",
                        reason=reason,
                        comment=medicine_name,
                    )
                )

            for event_index, (days_ago, note) in enumerate(episode_seed.comments):
                author = _pick_author(accounts, child_index + episode_index + event_index + 7)
                session.add(
                    IllnessEpisodeEventModel(
                        id=uuid4(),
                        episode_id=episode.id,
                        event_type="comment",
                        occurred_at=_dt_days_ago(days_ago, 13, 15),
                        comment=note,
                        created_by_account_id=author.id,
                        created_by_name_snapshot=author.display_name,
                    )
                )

            for medicine_name, dose_amount, min_interval, max_doses, notes in episode_seed.plans:
                session.add(
                    EpisodeMedicationPlanModel(
                        id=uuid4(),
                        episode_id=episode.id,
                        household_medicine_id=None,
                        custom_medicine_name=medicine_name,
                        dose_amount=dose_amount,
                        min_interval_minutes=min_interval,
                        max_doses_per_day=max_doses,
                        weight_kg=None,
                        dose_mg_per_kg=None,
                        notes=notes,
                        reminders_enabled=True,
                        reminder_before_minutes=15,
                        notify_at_due=True,
                    )
                )

        children.append(child)
        await session.flush()

    return children


async def _print_summary(session: AsyncSession) -> None:
    counts = {
        "accounts": await session.scalar(select(func.count()).select_from(AccountModel)),
        "families": await session.scalar(select(func.count()).select_from(FamilyModel)),
        "children": await session.scalar(select(func.count()).select_from(ChildModel)),
        "illness_episodes": await session.scalar(select(func.count()).select_from(IllnessEpisodeModel)),
        "illness_episode_events": await session.scalar(
            select(func.count()).select_from(IllnessEpisodeEventModel)
        ),
        "episode_medication_plans": await session.scalar(
            select(func.count()).select_from(EpisodeMedicationPlanModel)
        ),
        "sleep_sessions": await session.scalar(select(func.count()).select_from(SleepSessionModel)),
        "feeding_records": await session.scalar(select(func.count()).select_from(FeedingRecordModel)),
        "pillbox_plans": await session.scalar(select(func.count()).select_from(PillboxPlanModel)),
        "pillbox_dose_logs": await session.scalar(
            select(func.count()).select_from(PillboxDoseLogModel)
        ),
        "household_medicines": await session.scalar(
            select(func.count()).select_from(HouseholdMedicineModel)
        ),
    }

    print("Local family demo is ready.")
    print(f"Database: {settings.database_url}")
    print("Accounts:")
    print(f"- a.khmialev@gmail.com / {DEMO_PASSWORD} / recovery {DEMO_RECOVERY_CODE}")
    print(f"- a1.khmialev@gmail.com / {DEMO_PASSWORD} / recovery {DEMO_RECOVERY_CODE}")
    print("Counts:")
    for key, value in counts.items():
        print(f"- {key}: {value}")


async def main() -> None:
    _assert_local_database()
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    try:
        async with session_factory() as session:
            await _reset_user_data(session)
            family, accounts = await _create_family(session)
            medicines = await _create_household_medicines(session, family)
            await _create_pillbox(session, family, accounts, medicines)
            await _create_child_history(session, family, accounts)
            await session.commit()

        async with session_factory() as session:
            await _print_summary(session)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
