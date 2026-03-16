"""Глобальные обработчики исключений: доменные → HTTPException."""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from src.core.exceptions import AppException

logger = logging.getLogger(__name__)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Преобразует AppException в JSON-ответ с нужным status_code."""
    logger.warning("AppException: %s (code=%s)", exc.message, exc.code)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )
