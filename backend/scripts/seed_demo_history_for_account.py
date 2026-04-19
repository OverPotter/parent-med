"""Пересобирает demo-данные детей и истории болезней для одного аккаунта."""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.config import settings
from src.infrastructure.database.models import (
    AccountModel,
    ChildModel,
    EpisodeMedicationPlanModel,
    IllnessEpisodeEventModel,
    IllnessEpisodeModel,
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
                select(AccountModel.id, AccountModel.display_name)
                .where(AccountModel.family_id == family_id)
                .order_by(AccountModel.created_at.asc())
            )
        ).all()
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

        children = build_children()

        for child_index, child_seed in enumerate(children):
            child = ChildModel(
                id=uuid4(),
                family_id=family_id,
                name=child_seed.name,
                birth_date=child_seed.birth_date,
                notes=child_seed.notes,
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

        await session.commit()

    await engine.dispose()
    print(f"Seeded demo history for account {TARGET_EMAIL}")


if __name__ == "__main__":
    asyncio.run(main())
