"""Create or update App Review demo accounts for RU/EN locales."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.security import hash_password
from src.infrastructure.database.models.account import AccountModel
from src.infrastructure.database.models.family import FamilyModel


@dataclass(frozen=True)
class DemoAccountSpec:
    email: str
    language: str
    display_name: str
    family_name: str


DEMO_PASSWORD = "PillPathReview2026!"
DEMO_SPECS: tuple[DemoAccountSpec, ...] = (
    DemoAccountSpec(
        email="appreview-demo-ru@test.com",
        language="ru",
        display_name="App Review RU",
        family_name="App Review Family RU",
    ),
    DemoAccountSpec(
        email="appreview-demo-en@test.com",
        language="en",
        display_name="App Review EN",
        family_name="App Review Family EN",
    ),
)


async def upsert_demo_account(session: AsyncSession, spec: DemoAccountSpec) -> None:
    existing = await session.execute(select(AccountModel).where(AccountModel.email == spec.email))
    account = existing.scalars().one_or_none()

    if account is None:
        family = FamilyModel(id=uuid4(), name=spec.family_name)
        session.add(family)
        await session.flush()
        account = AccountModel(
            id=uuid4(),
            email=spec.email,
            password_hash=hash_password(DEMO_PASSWORD),
            family_id=family.id,
            display_name=spec.display_name,
            relationship_label=None,
            phone=None,
            preferred_language=spec.language,
            family_role="owner",
            push_before_reminder_minutes=10,
            pillbox_push_before_reminder_minutes=10,
            cabinet_notify_15_days=True,
            cabinet_notify_7_days=True,
            cabinet_notify_3_days=True,
            cabinet_notify_1_day=True,
            created_at=datetime.now(UTC),
        )
        session.add(account)
        await session.flush()
        print(f"created account: {spec.email}")
        return

    account.password_hash = hash_password(DEMO_PASSWORD)
    account.preferred_language = spec.language
    account.display_name = spec.display_name
    account.family_role = "owner"
    await session.flush()
    print(f"updated account: {spec.email}")


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
            for spec in DEMO_SPECS:
                await upsert_demo_account(session, spec)
            await session.commit()
    finally:
        await engine.dispose()

    print("\nApp Review demo accounts are ready:")
    for spec in DEMO_SPECS:
        print(f"- {spec.email} / {DEMO_PASSWORD} ({spec.language})")


if __name__ == "__main__":
    asyncio.run(main())
