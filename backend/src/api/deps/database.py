"""Зависимость: сессия БД (async)."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.lifespan import get_async_session


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Отдаёт сессию БД для запроса (commit/rollback в lifespan)."""
    async for session in get_async_session():
        yield session
