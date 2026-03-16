"""
Точка входа: FastAPI-приложение с роутами, обработчиками и lifespan.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.routers import (
    administration_events,
    children,
    families,
    household_medicines,
    illness_episodes,
    medicine_catalog,
    temperature_entries,
    weight_entries,
)
from src.core.exception_handlers import app_exception_handler
from src.core.exceptions import AppException
from src.core.lifespan import lifespan_context


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Обёртка lifespan для FastAPI."""
    async with lifespan_context():
        yield


def create_app() -> FastAPI:
    """Создаёт и возвращает экземпляр FastAPI."""
    app = FastAPI(
        title="Parent Med API",
        description="Умная аптечка и ведение болезни ребёнка (MVP)",
        lifespan=lifespan,
    )
    app.add_exception_handler(AppException, app_exception_handler)

    app.include_router(families.router, prefix="/api/v1")
    app.include_router(children.router, prefix="/api/v1")
    app.include_router(weight_entries.router, prefix="/api/v1")
    app.include_router(medicine_catalog.router, prefix="/api/v1")
    app.include_router(household_medicines.router, prefix="/api/v1")
    app.include_router(illness_episodes.router, prefix="/api/v1")
    app.include_router(temperature_entries.router, prefix="/api/v1")
    app.include_router(administration_events.router, prefix="/api/v1")

    @app.get("/health")
    async def health() -> dict[str, str]:
        """Проверка доступности API."""
        return {"status": "ok"}

    return app


app = create_app()
