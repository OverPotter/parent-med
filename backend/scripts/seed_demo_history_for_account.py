"""Пересобирает demo-данные детей и истории болезней для одного аккаунта."""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID, uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.config import settings
from src.infrastructure.database.models import (
    AccountModel,
    ChildModel,
    EpisodeMedicationPlanModel,
    FamilyModel,
    HouseholdMedicineModel,
    IllnessEpisodeEventModel,
    IllnessEpisodeModel,
    PillboxDoseLogModel,
    PillboxMedicationModel,
    PillboxNotificationDeliveryModel,
    PillboxPlanModel,
    WeightEntryModel,
)

TARGET_EMAIL = os.getenv("TARGET_EMAIL", "a.khmialev@gmail.com")


@dataclass
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


@dataclass
class ChildSeed:
    name: str
    birth_date: date
    notes: str | None
    weights: list[tuple[int, float]]
    episodes: list[EpisodeSeed]


@dataclass
class EventAuthorSeed:
    account_id: UUID
    display_name: str


def _dt_days_ago(days_ago: int, hour: int = 9, minute: int = 0) -> datetime:
    base = datetime.now(UTC) - timedelta(days=days_ago)
    return base.replace(hour=hour, minute=minute, second=0, microsecond=0)


def pick_author(authors: list[EventAuthorSeed], seed_index: int) -> EventAuthorSeed:
    return authors[seed_index % len(authors)]


async def _create_household_medicines(
    session,
    family_id: UUID,
) -> list[HouseholdMedicineModel]:
    now = datetime.now(UTC)
    medicines = [
        HouseholdMedicineModel(
            id=uuid4(),
            family_id=family_id,
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
            family_id=family_id,
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
            family_id=family_id,
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
            family_id=family_id,
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
            family_id=family_id,
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
    session,
    family_id: UUID,
    accounts: list[AccountModel],
    medicines: list[HouseholdMedicineModel],
) -> list[PillboxPlanModel]:
    if not accounts:
        return []
    created_by = accounts[0]
    now = datetime.now(UTC)

    primary_plan = PillboxPlanModel(
        id=uuid4(),
        family_id=family_id,
        title="Утренние и вечерние домашние лекарства",
        status="active",
        member_account_ids=[account.id for account in accounts],
        created_by_account_id=created_by.id,
        created_at=now - timedelta(days=14),
        updated_at=now,
    )
    recovery_plan = PillboxPlanModel(
        id=uuid4(),
        family_id=family_id,
        title="Восстановление после инфекции",
        status="active",
        member_account_ids=[account.id for account in accounts],
        created_by_account_id=created_by.id,
        created_at=now - timedelta(days=32),
        updated_at=now - timedelta(days=8),
    )
    seasonal_plan = PillboxPlanModel(
        id=uuid4(),
        family_id=family_id,
        title="Осенний курс витаминов",
        status="paused",
        member_account_ids=[account.id for account in accounts],
        created_by_account_id=created_by.id,
        created_at=now - timedelta(days=76),
        updated_at=now - timedelta(days=41),
    )
    travel_plan = PillboxPlanModel(
        id=uuid4(),
        family_id=family_id,
        title="Дорожный набор на выходные",
        status="active",
        member_account_ids=[account.id for account in accounts],
        created_by_account_id=created_by.id,
        created_at=now - timedelta(days=54),
        updated_at=now - timedelta(days=50),
    )
    allergy_plan = PillboxPlanModel(
        id=uuid4(),
        family_id=family_id,
        title="Сезонная аллергия",
        status="paused",
        member_account_ids=[account.id for account in accounts],
        created_by_account_id=created_by.id,
        created_at=now - timedelta(days=23),
        updated_at=now - timedelta(days=16),
    )
    session.add_all([primary_plan, recovery_plan, seasonal_plan, travel_plan, allergy_plan])
    await session.flush()

    vitamin_d = PillboxMedicationModel(
        id=uuid4(),
        plan_id=primary_plan.id,
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
        plan_id=primary_plan.id,
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
    recovery_saline = PillboxMedicationModel(
        id=uuid4(),
        plan_id=recovery_plan.id,
        household_medicine_id=medicines[2].id,
        custom_medicine_name=None,
        dose_amount="2 впрыска",
        meal_rule="after_meal",
        repeat_days=[0, 1, 2, 3, 4, 5, 6],
        times=[time(9, 0), time(21, 0)],
        course_mode="date_range",
        course_start_date=(now - timedelta(days=18)).date(),
        course_end_date=(now - timedelta(days=11)).date(),
        position=0,
    )
    seasonal_vitamin = PillboxMedicationModel(
        id=uuid4(),
        plan_id=seasonal_plan.id,
        household_medicine_id=medicines[3].id,
        custom_medicine_name=None,
        dose_amount="1 капля",
        meal_rule="after_meal",
        repeat_days=[0, 1, 2, 3, 4, 5, 6],
        times=[time(8, 45)],
        course_mode="date_range",
        course_start_date=(now - timedelta(days=65)).date(),
        course_end_date=(now - timedelta(days=44)).date(),
        position=0,
    )
    travel_paracetamol = PillboxMedicationModel(
        id=uuid4(),
        plan_id=travel_plan.id,
        household_medicine_id=medicines[1].id,
        custom_medicine_name=None,
        dose_amount="7.5 мл",
        meal_rule="after_meal",
        repeat_days=[5, 6],
        times=[time(10, 0), time(18, 0)],
        course_mode="date_range",
        course_start_date=(now - timedelta(days=53)).date(),
        course_end_date=(now - timedelta(days=51)).date(),
        position=0,
    )
    allergy_support = PillboxMedicationModel(
        id=uuid4(),
        plan_id=allergy_plan.id,
        household_medicine_id=medicines[2].id,
        custom_medicine_name="Спрей перед прогулкой",
        dose_amount="1 впрыск",
        meal_rule="after_meal",
        repeat_days=[0, 1, 2, 3, 4, 5, 6],
        times=[time(8, 10)],
        course_mode="date_range",
        course_start_date=(now - timedelta(days=21)).date(),
        course_end_date=(now - timedelta(days=17)).date(),
        position=0,
    )
    session.add_all(
        [
            vitamin_d,
            probiotic,
            recovery_saline,
            seasonal_vitamin,
            travel_paracetamol,
            allergy_support,
        ]
    )
    await session.flush()

    logs: list[PillboxDoseLogModel] = []
    for days_ago in range(10, -1, -1):
        morning_author = accounts[days_ago % len(accounts)]
        morning_time = _dt_days_ago(days_ago, 8, 35)
        logs.append(
            PillboxDoseLogModel(
                id=uuid4(),
                family_id=family_id,
                plan_id=primary_plan.id,
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
            evening_author = accounts[(days_ago + 1) % len(accounts)]
            probiotic_time = _dt_days_ago(days_ago, 20, 15)
            logs.append(
                PillboxDoseLogModel(
                    id=uuid4(),
                    family_id=family_id,
                    plan_id=primary_plan.id,
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
    for days_ago in range(18, 10, -1):
        author = accounts[days_ago % len(accounts)]
        saline_time = _dt_days_ago(days_ago, 21, 0)
        logs.append(
            PillboxDoseLogModel(
                id=uuid4(),
                family_id=family_id,
                plan_id=recovery_plan.id,
                medication_id=recovery_saline.id,
                scheduled_for=saline_time,
                taken_at=saline_time + timedelta(minutes=7),
                taken_by_account_id=author.id,
                taken_by_name_snapshot=author.display_name,
                amount_snapshot="2 впрыска",
                source="manual",
                notes="Курс восстановления после ОРВИ",
            )
        )
    for days_ago in range(65, 44, -7):
        author = accounts[days_ago % len(accounts)]
        vitamin_time = _dt_days_ago(days_ago, 8, 45)
        logs.append(
            PillboxDoseLogModel(
                id=uuid4(),
                family_id=family_id,
                plan_id=seasonal_plan.id,
                medication_id=seasonal_vitamin.id,
                scheduled_for=vitamin_time,
                taken_at=vitamin_time + timedelta(minutes=3),
                taken_by_account_id=author.id,
                taken_by_name_snapshot=author.display_name,
                amount_snapshot="1 капля",
                source="manual",
                notes="Осенний курс витаминов",
            )
        )
    for days_ago in range(53, 50, -1):
        author = accounts[(days_ago + 1) % len(accounts)]
        travel_time = _dt_days_ago(days_ago, 18, 0)
        logs.append(
            PillboxDoseLogModel(
                id=uuid4(),
                family_id=family_id,
                plan_id=travel_plan.id,
                medication_id=travel_paracetamol.id,
                scheduled_for=travel_time,
                taken_at=travel_time + timedelta(minutes=9),
                taken_by_account_id=author.id,
                taken_by_name_snapshot=author.display_name,
                amount_snapshot="7.5 мл",
                source="manual",
                notes="Дорожный сценарий в поездке",
            )
        )
    for days_ago in range(21, 16, -1):
        author = accounts[days_ago % len(accounts)]
        allergy_time = _dt_days_ago(days_ago, 8, 10)
        logs.append(
            PillboxDoseLogModel(
                id=uuid4(),
                family_id=family_id,
                plan_id=allergy_plan.id,
                medication_id=allergy_support.id,
                scheduled_for=allergy_time,
                taken_at=allergy_time + timedelta(minutes=2),
                taken_by_account_id=author.id,
                taken_by_name_snapshot=author.display_name,
                amount_snapshot="1 впрыск",
                source="manual",
                notes="Короткий курс на сезонную аллергию",
            )
        )
    session.add_all(logs)
    await session.flush()
    return [primary_plan, recovery_plan, seasonal_plan, travel_plan, allergy_plan]


def build_children() -> list[ChildSeed]:
    return [
        ChildSeed(
            name="Антон",
            birth_date=date(2021, 4, 18),
            notes="Сценарий с насыщенной историей для проверки общей аналитики и разбора.",
            weights=[(180, 16.4), (90, 17.1), (10, 17.8)],
            episodes=[
                EpisodeSeed(
                    title="ОРВИ с высокой температурой",
                    started_days_ago=12,
                    duration_days=4,
                    status="closed",
                    medication_mode="guided",
                    note="Тяжёлый старт, потом стабилизация.",
                    temperatures=[
                        (12, 38.4, "Утро"),
                        (11, 39.1, "Под вечер"),
                        (10, 38.0, "После жаропонижающего"),
                        (9, 37.4, "Перед сном"),
                    ],
                    administrations=[
                        (11, "Ибупрофен", "5 мл", "Высокая температура"),
                        (10, "Парацетамол", "5 мл", "Ночью снова поднялась"),
                    ],
                    comments=[
                        (11, "Вечером температура поднялась до пика."),
                        (10, "После сна чувствовал себя лучше."),
                    ],
                    plans=[
                        ("Ибупрофен", "5 мл", 480, 3, "Ночной сценарий"),
                    ],
                ),
                EpisodeSeed(
                    title="Лёгкая простуда",
                    started_days_ago=46,
                    duration_days=3,
                    status="closed",
                    medication_mode="manual",
                    note="Без лекарств, только наблюдение.",
                    temperatures=[
                        (46, 37.6, "Утро"),
                        (45, 37.3, "День"),
                    ],
                    administrations=[],
                    comments=[(45, "Аппетит был снижен, но активность нормальная.")],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Ночной кашель",
                    started_days_ago=103,
                    duration_days=2,
                    status="closed",
                    medication_mode="manual",
                    note="Короткий эпизод без температуры.",
                    temperatures=[],
                    administrations=[],
                    comments=[
                        (103, "Сильнее беспокоил ночью."),
                        (102, "К утру почти прошло."),
                    ],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Температура и слабость",
                    started_days_ago=168,
                    duration_days=6,
                    status="closed",
                    medication_mode="guided",
                    note="Длинный эпизод для проверки bucket 6+.",
                    temperatures=[
                        (168, 38.1, "Старт"),
                        (167, 38.7, "Вечер"),
                        (166, 37.9, "После сна"),
                        (164, 37.5, "День"),
                    ],
                    administrations=[
                        (167, "Ибупрофен", "5 мл", "Температура выше 38.5"),
                        (166, "Ибупрофен", "5 мл", "По плану"),
                        (165, "Парацетамол", "5 мл", "Ночной подъём"),
                    ],
                    comments=[(166, "Много спал днём."), (164, "Аппетит начал возвращаться.")],
                    plans=[
                        ("Ибупрофен", "5 мл", 480, 3, "Основной план"),
                        ("Парацетамол", "5 мл", 360, 4, "Если ночью снова растёт"),
                    ],
                ),
                EpisodeSeed(
                    title="Осенняя вирусная инфекция",
                    started_days_ago=264,
                    duration_days=5,
                    status="closed",
                    medication_mode="manual",
                    note="Есть температура, но без guided-плана.",
                    temperatures=[
                        (264, 38.2, "Утро"),
                        (263, 38.5, "Вечер"),
                        (261, 37.8, "Перед сном"),
                    ],
                    administrations=[(263, "Ибупрофен", "5 мл", "На ночь")],
                    comments=[(262, "Днём было больше энергии.")],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Короткий февральский эпизод",
                    started_days_ago=390,
                    duration_days=2,
                    status="closed",
                    medication_mode="manual",
                    note="Нужен для режима 'всё время'.",
                    temperatures=[(390, 37.8, "Утро")],
                    administrations=[],
                    comments=[],
                    plans=[],
                ),
                EpisodeSeed(
                    title="Активное наблюдение: температура и напоминания",
                    started_days_ago=1,
                    duration_days=1,
                    status="active",
                    medication_mode="guided",
                    note="Открытый эпизод для проверки текущего сценария и блока напоминаний.",
                    temperatures=[
                        (1, 37.9, "Утро"),
                        (1, 38.6, "После тихого часа"),
                        (0, 38.1, "Перед сном"),
                    ],
                    administrations=[
                        (0, "Ибупрофен", "5 мл", "После роста температуры вечером"),
                    ],
                    comments=[
                        (1, "Днём был вялый, но пил воду."),
                        (0, "К вечеру появился аппетит."),
                    ],
                    plans=[
                        ("Ибупрофен", "5 мл", 480, 3, "Основное напоминание"),
                        ("Парацетамол", "5 мл", 360, 4, "Запасной вариант на ночь"),
                    ],
                ),
            ],
        ),
        ChildSeed(
            name="София",
            birth_date=date(2019, 9, 3),
            notes="Смешанные сценарии: мало записей, эпизод без температуры и эпизод с лекарством.",
            weights=[(150, 20.6), (20, 21.2)],
            episodes=[
                EpisodeSeed(
                    title="Наблюдение без температуры",
                    started_days_ago=28,
                    duration_days=2,
                    status="closed",
                    medication_mode="manual",
                    note="Проверка пустого графика в разборе.",
                    temperatures=[],
                    administrations=[],
                    comments=[(28, "Жаловалась на горло."), (27, "На следующий день стало лучше.")],
                    plans=[],
                ),
                EpisodeSeed(
                    title="ОРВИ с одним жаропонижающим",
                    started_days_ago=74,
                    duration_days=4,
                    status="closed",
                    medication_mode="manual",
                    note="Один приём и несколько замеров.",
                    temperatures=[
                        (74, 38.0, "Утро"),
                        (73, 38.6, "День"),
                        (72, 37.5, "После отдыха"),
                    ],
                    administrations=[(73, "Парацетамол", "7.5 мл", "Когда поднялась выше 38.5")],
                    comments=[(73, "Вечером ела хуже обычного.")],
                    plans=[],
                ),
            ],
        ),
        ChildSeed(
            name="Лев",
            birth_date=date(2023, 2, 11),
            notes="Новый ребёнок без истории для проверки пустых состояний.",
            weights=[(14, 12.8)],
            episodes=[],
        ),
    ]


async def main() -> None:
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        account = (
            await session.execute(select(AccountModel).where(AccountModel.email == TARGET_EMAIL))
        ).scalar_one_or_none()
        if account is None:
            raise RuntimeError(f"Account with email {TARGET_EMAIL} not found")

        family_id = account.family_id
        family_accounts = (
            await session.execute(
                select(AccountModel)
                .where(AccountModel.family_id == family_id)
                .order_by(AccountModel.created_at.asc())
            )
        ).scalars().all()
        authors = [
            EventAuthorSeed(account_id=row.id, display_name=row.display_name)
            for row in family_accounts
        ] or [EventAuthorSeed(account_id=account.id, display_name=account.display_name)]

        existing_child_ids = (
            (await session.execute(select(ChildModel.id).where(ChildModel.family_id == family_id)))
            .scalars()
            .all()
        )

        if existing_child_ids:
            await session.execute(
                delete(IllnessEpisodeEventModel).where(
                    IllnessEpisodeEventModel.episode_id.in_(
                        select(IllnessEpisodeModel.id).where(
                            IllnessEpisodeModel.child_id.in_(existing_child_ids)
                        )
                    )
                )
            )
            await session.execute(
                delete(EpisodeMedicationPlanModel).where(
                    EpisodeMedicationPlanModel.episode_id.in_(
                        select(IllnessEpisodeModel.id).where(
                            IllnessEpisodeModel.child_id.in_(existing_child_ids)
                        )
                    )
                )
            )
            await session.execute(
                delete(IllnessEpisodeModel).where(
                    IllnessEpisodeModel.child_id.in_(existing_child_ids)
                )
            )
            await session.execute(
                delete(WeightEntryModel).where(WeightEntryModel.child_id.in_(existing_child_ids))
            )
            await session.execute(delete(ChildModel).where(ChildModel.id.in_(existing_child_ids)))

        existing_plan_ids = (
            (
                await session.execute(
                    select(PillboxPlanModel.id).where(PillboxPlanModel.family_id == family_id)
                )
            )
            .scalars()
            .all()
        )
        if existing_plan_ids:
            await session.execute(
                delete(PillboxNotificationDeliveryModel).where(
                    PillboxNotificationDeliveryModel.plan_id.in_(existing_plan_ids)
                )
            )
            await session.execute(
                delete(PillboxDoseLogModel).where(PillboxDoseLogModel.plan_id.in_(existing_plan_ids))
            )
            await session.execute(
                delete(PillboxMedicationModel).where(
                    PillboxMedicationModel.plan_id.in_(existing_plan_ids)
                )
            )
            await session.execute(
                delete(PillboxPlanModel).where(PillboxPlanModel.id.in_(existing_plan_ids))
            )
        await session.execute(
            delete(HouseholdMedicineModel).where(HouseholdMedicineModel.family_id == family_id)
        )

        children = build_children()

        for child_index, child_seed in enumerate(children):
            child = ChildModel(
                id=uuid4(),
                family_id=family_id,
                name=child_seed.name,
                birth_date=child_seed.birth_date,
                notes=child_seed.notes,
                created_at=datetime.now(UTC),
            )
            session.add(child)
            await session.flush()

            for days_ago, value_kg in child_seed.weights:
                session.add(
                    WeightEntryModel(
                        id=uuid4(),
                        child_id=child.id,
                        value_kg=value_kg,
                        measured_at=_dt_days_ago(days_ago, 10, 15),
                    )
                )

            for episode_index, episode_seed in enumerate(child_seed.episodes):
                started_at = (
                    datetime.now(UTC) - timedelta(days=episode_seed.started_days_ago)
                ).date()
                closed_at = _dt_days_ago(
                    max(0, episode_seed.started_days_ago - episode_seed.duration_days + 1),
                    18,
                    30,
                )
                episode = IllnessEpisodeModel(
                    id=uuid4(),
                    child_id=child.id,
                    started_at=started_at,
                    title=episode_seed.title,
                    status=episode_seed.status,
                    medication_mode=episode_seed.medication_mode,
                    note=episode_seed.note,
                    closed_at=closed_at if episode_seed.status == "closed" else None,
                    deleted_at=None,
                )
                session.add(episode)
                await session.flush()

                for event_index, (days_ago, value_celsius, comment) in enumerate(
                    episode_seed.temperatures
                ):
                    author = pick_author(authors, child_index + episode_index + event_index)
                    session.add(
                        IllnessEpisodeEventModel(
                            id=uuid4(),
                            episode_id=episode.id,
                            event_type="temperature",
                            occurred_at=_dt_days_ago(days_ago, 8, 40),
                            value_celsius=value_celsius,
                            method="axillary",
                            comment=comment,
                            created_by_account_id=author.account_id,
                            created_by_name_snapshot=author.display_name,
                        )
                    )

                for event_index, (days_ago, medicine_name, amount, reason) in enumerate(
                    episode_seed.administrations
                ):
                    author = pick_author(authors, child_index + episode_index + event_index + 3)
                    session.add(
                        IllnessEpisodeEventModel(
                            id=uuid4(),
                            episode_id=episode.id,
                            event_type="administration",
                            occurred_at=_dt_days_ago(days_ago, 21, 5),
                            household_medicine_id=None,
                            created_by_account_id=author.account_id,
                            created_by_name_snapshot=author.display_name,
                            administered_by_account_id=author.account_id,
                            administered_by_name_snapshot=author.display_name,
                            amount=amount,
                            unit="мл",
                            reason=reason,
                            comment=medicine_name,
                        )
                    )

                for event_index, (days_ago, text) in enumerate(episode_seed.comments):
                    author = pick_author(authors, child_index + episode_index + event_index + 7)
                    session.add(
                        IllnessEpisodeEventModel(
                            id=uuid4(),
                            episode_id=episode.id,
                            event_type="comment",
                            occurred_at=_dt_days_ago(days_ago, 13, 20),
                            comment=text,
                            created_by_account_id=author.account_id,
                            created_by_name_snapshot=author.display_name,
                        )
                    )

                for (
                    medicine_name,
                    dose_amount,
                    min_interval,
                    max_doses,
                    notes,
                ) in episode_seed.plans:
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

        family = await session.get(FamilyModel, family_id)
        if family is not None and family.plan_code == "free" and family.subscription_status == "inactive":
            oldest_child = (
                (
                    await session.execute(
                        select(ChildModel.id)
                        .where(ChildModel.family_id == family_id)
                        .order_by(ChildModel.created_at.asc(), ChildModel.id.asc())
                        .limit(1)
                    )
                )
                .scalars()
                .first()
            )
            family.free_primary_child_id = oldest_child

        medicines = await _create_household_medicines(session, family_id)
        pillbox_plans = await _create_pillbox(session, family_id, family_accounts or [account], medicines)
        if family is not None and family.plan_code == "free" and family.subscription_status == "inactive":
            family.free_primary_pillbox_plan_id = pillbox_plans[0].id if pillbox_plans else None

        await session.commit()

    await engine.dispose()
    print(f"Seeded demo history for account {TARGET_EMAIL}")


if __name__ == "__main__":
    asyncio.run(main())
