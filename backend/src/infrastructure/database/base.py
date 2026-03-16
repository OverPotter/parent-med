"""Общая метаданные и база для моделей SQLAlchemy (избегаем зарезервированного имени metadata)."""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Именованная метаданные, чтобы не использовать зарезервированное имя metadata
db_metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)


def get_db_metadata() -> MetaData:
    """Возвращает метаданные для Alembic и миграций."""
    return db_metadata


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""

    metadata = db_metadata
