"""Пути и константы ядра (корень репозитория бэкенда — каталог с pyproject.toml)."""

from pathlib import Path

# backend/src/core/constants.py → parents[2] = корень backend
ROOT_DIR_PATH: Path = Path(__file__).resolve().parent.parent.parent

LOG_DIR: Path = ROOT_DIR_PATH / "logs"
LOG_FILE_SIZE: str = "10 MB"
LOG_COMPRESSION: str = "gz"
