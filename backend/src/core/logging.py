"""Loguru: вызов setup_logging() в lifespan; импорт logger — из loguru или get_logger."""

from __future__ import annotations

import logging
import sys

from loguru import logger

from src.core.config import settings
from src.core.constants import LOG_COMPRESSION, LOG_DIR, LOG_FILE_SIZE

_configured = False


def _format_record(record: dict) -> str:
    """Шаблон строки; при bind(module=…) добавляется колонка."""
    base_head = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan>"
    )
    if record["extra"].get("module"):
        return base_head + " | <cyan>{extra[module]}</cyan> - " + "<level>{message}</level>\n"
    return base_head + " - <level>{message}</level>\n"


class _InterceptHandler(logging.Handler):
    """Пересылает stdlib logging (uvicorn, SQLAlchemy) в Loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = str(record.levelno)
        frame, depth = logging.currentframe(), 2
        while frame is not None and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def _ensure_log_dir() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def _stdlib_to_loguru() -> None:
    logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    for noisy in ("sqlalchemy.engine", "sqlalchemy.pool", "sqlalchemy.dialects"):
        logging.getLogger(noisy).setLevel(logging.ERROR)
    logging.getLogger("sqlalchemy").setLevel(logging.ERROR)


def setup_logging() -> None:
    """Идемпотентно: stdout, app.log, errors.log, перехват stdlib."""
    global _configured
    if _configured:
        return

    level = ("DEBUG" if settings.debug else settings.log_level).upper()
    if level not in ("TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"):
        level = "INFO"

    logger.remove()
    _ensure_log_dir()

    logger.add(
        sys.stdout,
        level=level,
        format=_format_record,
        colorize=True,
    )

    logger.add(
        str(LOG_DIR / "app.log"),
        level=level,
        format=_format_record,
        rotation=LOG_FILE_SIZE,
        retention=None,
        compression=LOG_COMPRESSION,
        encoding="utf-8",
        backtrace=True,
        diagnose=settings.debug,
    )

    logger.add(
        str(LOG_DIR / "errors.log"),
        level="ERROR",
        format=_format_record,
        rotation=LOG_FILE_SIZE,
        retention=None,
        compression=LOG_COMPRESSION,
        encoding="utf-8",
        backtrace=True,
        diagnose=settings.debug,
    )

    _stdlib_to_loguru()
    _configured = True


def get_logger(name: str | None = None):
    """Опционально bind(module=…) для колонки в формате."""
    if name:
        return logger.bind(module=name)
    return logger


__all__ = ["logger", "setup_logging", "get_logger"]
