"""Настройка логирования."""

import logging
import sys


def setup_logging(debug: bool = False) -> None:
    """Настраивает уровень и формат логов."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
