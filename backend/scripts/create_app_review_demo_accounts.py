"""Create or rebuild an isolated App Review demo family with realistic data."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from reset_local_family_demo import (
    _create_child_history,
    _create_household_medicines,
    _create_pillbox,
)
from src.core.config import settings
from src.core.security import hash_password
from src.domain.entities.family_access import (
    build_default_family_access_policy,
    serialize_family_access_policy,
)
from src.infrastructure.database.models import (
    AccountModel,
    ChildModel,
    FamilyModel,
    HouseholdMedicineModel,
    IllnessEpisodeEventModel,
    IllnessEpisodeModel,
    ParentModel,
    PillboxDoseLogModel,
    PillboxPlanModel,
    SleepSessionModel,
)
from src.infrastructure.database.models.episode_medication_plan import EpisodeMedicationPlanModel
from src.infrastructure.database.models.family_invite import FamilyInviteModel
from src.infrastructure.database.models.feeding_record import FeedingRecordModel
from src.infrastructure.database.models.height_entry import HeightEntryModel
from src.infrastructure.database.models.push_subscription import PushSubscriptionModel
from src.infrastructure.database.models.weight_entry import WeightEntryModel


@dataclass(frozen=True)
class DemoAccountSpec:
    email: str
    preferred_language: str
    display_name: str
    relationship_label: str
    family_role: str


DEMO_PASSWORD = "PillPathReview2026!"
DEMO_RECOVERY_CODE = "20390680"
DEMO_FAMILY_NAME = "PillPath App Review Family"
DEMO_ACCOUNTS: tuple[DemoAccountSpec, ...] = (
    DemoAccountSpec(
        email="appreview-demo-en@test.com",
        preferred_language="en",
        display_name="Alex",
        relationship_label="Dad",
        family_role="admin",
    ),
    DemoAccountSpec(
        email="appreview-demo-family@test.com",
        preferred_language="en",
        display_name="Jamie",
        relationship_label="Mom",
        family_role="admin",
    ),
)
LEGACY_DEMO_EMAILS = {
    "appreview-demo-en@test.com",
    "appreview-demo-ru@test.com",
    "appreview-demo-family@test.com",
}


async def _cleanup_existing_review_family(session: AsyncSession) -> None:
    family_ids = set(
        (
            await session.execute(
                select(AccountModel.family_id).where(AccountModel.email.in_(LEGACY_DEMO_EMAILS))
            )
        )
        .scalars()
        .all()
    )
    family_ids.update(
        (
            await session.execute(select(FamilyModel.id).where(FamilyModel.name == DEMO_FAMILY_NAME))
        )
        .scalars()
        .all()
    )
    if family_ids:
        await session.execute(delete(FamilyModel).where(FamilyModel.id.in_(family_ids)))
    await session.execute(delete(AccountModel).where(AccountModel.email.in_(LEGACY_DEMO_EMAILS)))
    await session.flush()


async def _create_family(session: AsyncSession) -> tuple[FamilyModel, list[AccountModel]]:
    family = FamilyModel(
        id=uuid4(),
        name=DEMO_FAMILY_NAME,
        plan_code="pro",
        subscription_status="active",
        subscription_provider="manual",
        subscription_product_id="app-review-pro",
        subscription_expires_at=datetime.now(UTC) + timedelta(days=180),
        cabinet_member_account_ids=[],
    )
    session.add(family)
    await session.flush()

    default_policy = serialize_family_access_policy(build_default_family_access_policy())
    now = datetime.now(UTC)
    accounts: list[AccountModel] = []
    for spec in DEMO_ACCOUNTS:
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
            access_policy=default_policy,
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
            created_at=now,
        )
        session.add(account)
        accounts.append(account)

    await session.flush()
    family.billing_account_id = accounts[0].id
    family.cabinet_member_account_ids = [account.id for account in accounts]
    session.add_all(
        [
            ParentModel(id=uuid4(), family_id=family.id, name="Alex", role="Dad"),
            ParentModel(id=uuid4(), family_id=family.id, name="Jamie", role="Mom"),
        ]
    )
    await session.flush()
    return family, accounts


async def _print_summary(session: AsyncSession) -> None:
    review_family_id = await session.scalar(
        select(FamilyModel.id).where(FamilyModel.name == DEMO_FAMILY_NAME)
    )
    if review_family_id is None:
        raise RuntimeError("App Review family was not created")

    review_account_ids = (
        await session.execute(select(AccountModel.id).where(AccountModel.family_id == review_family_id))
    ).scalars().all()
    review_child_ids = (
        await session.execute(select(ChildModel.id).where(ChildModel.family_id == review_family_id))
    ).scalars().all()
    review_episode_ids = (
        await session.execute(
            select(IllnessEpisodeModel.id).where(IllnessEpisodeModel.child_id.in_(review_child_ids))
        )
    ).scalars().all()
    review_plan_ids = (
        await session.execute(
            select(PillboxPlanModel.id).where(PillboxPlanModel.family_id == review_family_id)
        )
    ).scalars().all()

    def _count(stmt):
        return session.scalar(stmt)

    counts = {
        "accounts": await _count(
            select(func.count()).select_from(AccountModel).where(AccountModel.id.in_(review_account_ids))
        ),
        "children": await _count(
            select(func.count()).select_from(ChildModel).where(ChildModel.id.in_(review_child_ids))
        ),
        "weight_entries": await _count(
            select(func.count()).select_from(WeightEntryModel).where(
                WeightEntryModel.child_id.in_(review_child_ids)
            )
        ),
        "height_entries": await _count(
            select(func.count()).select_from(HeightEntryModel).where(
                HeightEntryModel.child_id.in_(review_child_ids)
            )
        ),
        "sleep_sessions": await _count(
            select(func.count()).select_from(SleepSessionModel).where(
                SleepSessionModel.child_id.in_(review_child_ids)
            )
        ),
        "feeding_records": await _count(
            select(func.count()).select_from(FeedingRecordModel).where(
                FeedingRecordModel.child_id.in_(review_child_ids)
            )
        ),
        "illness_episodes": await _count(
            select(func.count()).select_from(IllnessEpisodeModel).where(
                IllnessEpisodeModel.id.in_(review_episode_ids)
            )
        ),
        "illness_events": await _count(
            select(func.count()).select_from(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.episode_id.in_(review_episode_ids)
            )
        ),
        "episode_plans": await _count(
            select(func.count()).select_from(EpisodeMedicationPlanModel).where(
                EpisodeMedicationPlanModel.episode_id.in_(review_episode_ids)
            )
        ),
        "household_medicines": await _count(
            select(func.count()).select_from(HouseholdMedicineModel).where(
                HouseholdMedicineModel.family_id == review_family_id
            )
        ),
        "pillbox_plans": await _count(
            select(func.count()).select_from(PillboxPlanModel).where(
                PillboxPlanModel.id.in_(review_plan_ids)
            )
        ),
        "pillbox_logs": await _count(
            select(func.count()).select_from(PillboxDoseLogModel).where(
                PillboxDoseLogModel.plan_id.in_(review_plan_ids)
            )
        ),
        "push_subscriptions": await _count(
            select(func.count()).select_from(PushSubscriptionModel).where(
                PushSubscriptionModel.account_id.in_(review_account_ids)
            )
        ),
        "family_invites": await _count(
            select(func.count()).select_from(FamilyInviteModel).where(
                FamilyInviteModel.family_id == review_family_id
            )
        ),
    }

    print("\nApp Review demo family is ready:")
    print(f"Database: {settings.database_url}")
    print("Primary login:")
    print(f"- email: {DEMO_ACCOUNTS[0].email}")
    print(f"- password: {DEMO_PASSWORD}")
    print(f"- recovery code: {DEMO_RECOVERY_CODE}")
    print("Secondary family member:")
    print(f"- email: {DEMO_ACCOUNTS[1].email}")
    print(f"- password: {DEMO_PASSWORD}")
    print("Counts:")
    for key, value in counts.items():
        print(f"- {key}: {value}")


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    try:
        async with session_factory() as session:
            await _cleanup_existing_review_family(session)
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
