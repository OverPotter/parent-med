"""AppException → JSON."""

from fastapi import Request
from fastapi.responses import JSONResponse

from src.core.exceptions import AppException
from src.core.logging import get_logger

logger = get_logger(__name__)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.warning(f"Ошибка API | message={exc.message} code={exc.code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )
