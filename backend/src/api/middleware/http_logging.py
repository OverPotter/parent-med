"""Логи HTTP: метод, путь, статус, время."""

import time

from fastapi import FastAPI, Request

from src.core.logging import get_logger

logger = get_logger(__name__)


def register_http_logging(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        path = request.url.path
        if path == "/health" or request.method == "OPTIONS":
            return await call_next(request)
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        message = f"HTTP | {request.method} {path} → {response.status_code} ({int(ms)} мс)"
        if response.status_code >= 500:
            logger.error(message)
        elif response.status_code >= 400:
            logger.warning(message)
        else:
            logger.debug(message)
        return response
