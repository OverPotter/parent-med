"""Lifespan: БД, планировщик push."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.application.services.push_reminder_scheduler import PushNotificationScheduler
from src.core.config import settings
from src.core.logging import get_logger, setup_logging

logger = get_logger(__name__)

_engine = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None
_push_scheduler: PushNotificationScheduler | None = None


def get_engine():
    if _engine is None:
        raise RuntimeError("Engine not initialized. Use lifespan context.")
    return _engine


def get_async_session_factory() -> async_sessionmaker[AsyncSession]:
    if _async_session_factory is None:
        raise RuntimeError("Session factory not initialized. Use lifespan context.")
    return _async_session_factory


def get_push_scheduler() -> PushNotificationScheduler:
    if _push_scheduler is None:
        raise RuntimeError("Push scheduler not initialized. Use lifespan context.")
    return _push_scheduler


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    if _async_session_factory is None:
        raise RuntimeError("Session factory not initialized.")
    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def lifespan_context():
    global _engine, _async_session_factory, _push_scheduler
    setup_logging()
    logger.info("Логирование настроено")
    from src.infrastructure.database import models  # noqa: F401

    _engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
    )
    _async_session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    _push_scheduler = PushNotificationScheduler(_async_session_factory)
    _push_scheduler.start()
    logger.info("Старт: БД и планировщик push")

    yield

    logger.info("Остановка: планировщик и пул БД")
    if _push_scheduler is not None:
        await _push_scheduler.stop()
        _push_scheduler = None
    await _engine.dispose()
    _engine = None
    _async_session_factory = None
