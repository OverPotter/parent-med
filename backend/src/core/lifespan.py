"""Lifespan приложения: подключение к БД при старте, отключение при выходе."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.logging import setup_logging
from src.application.services.push_reminder_scheduler import PushNotificationScheduler

# Движок и фабрика сессий создаются при импорте после загрузки моделей
_engine = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None
_push_scheduler: PushNotificationScheduler | None = None


def get_engine():
    """Возвращает глобальный async-движок (создаётся в lifespan)."""
    if _engine is None:
        raise RuntimeError("Engine not initialized. Use lifespan context.")
    return _engine


def get_async_session_factory() -> async_sessionmaker[AsyncSession]:
    """Возвращает фабрику сессий."""
    if _async_session_factory is None:
        raise RuntimeError("Session factory not initialized. Use lifespan context.")
    return _async_session_factory


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Генератор сессий для Depends."""
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
    """Контекст жизни приложения: логирование, БД."""
    global _engine, _async_session_factory, _push_scheduler
    setup_logging(debug=settings.debug)

    # Импорт моделей для регистрации в Base.metadata (Alembic, миграции)
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

    yield

    if _push_scheduler is not None:
        await _push_scheduler.stop()
        _push_scheduler = None
    await _engine.dispose()
    _engine = None
    _async_session_factory = None
