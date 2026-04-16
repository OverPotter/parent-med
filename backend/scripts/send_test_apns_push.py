"""Send a one-off APNs test push to the latest native iOS subscription.

Usage:
    uv run python scripts/send_test_apns_push.py
"""

from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.application.services.push_reminder_scheduler import PushNotificationScheduler
from src.core.config import settings
from src.infrastructure.database.models.push_subscription import PushSubscriptionModel
from src.infrastructure.database.repositories.push_subscription_repository import (
    SqlPushSubscriptionRepository,
)


async def main() -> None:
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

    async with session_factory() as session:
        repo = SqlPushSubscriptionRepository(session)
        result = await session.execute(
            select(PushSubscriptionModel)
            .where(
                PushSubscriptionModel.channel == "native",
                PushSubscriptionModel.platform == "ios",
                PushSubscriptionModel.native_token.is_not(None),
            )
            .order_by(PushSubscriptionModel.updated_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        if row is None:
            print("No native iOS push subscription found.")
            await engine.dispose()
            return

        scheduler = PushNotificationScheduler(session_factory)
        payload: dict[str, Any] = {
            "title": "PillPath test",
            "body": "Тестовый push от PillPath",
            "url": "/settings",
            "tag": "qa-apns-test",
            "data": {"kind": "qa_apns_test"},
        }
        sent = await scheduler._send_apns_push(repo._to_entity(row), repo, payload)
        await session.commit()
        print(f"APNs test sent={sent} subscription_id={row.id}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
