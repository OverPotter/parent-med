"""Интерфейс репозитория справочника препаратов."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.medicine_catalog_item import MedicineCatalogItem
from src.domain.repositories.base import BaseRepository


class MedicineCatalogRepository(BaseRepository[MedicineCatalogItem]):
    """Репозиторий справочника препаратов."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> MedicineCatalogItem | None:
        """Получить препарат по id."""
        ...

    @abstractmethod
    async def find_by_name(self, name: str, limit: int = 20) -> list[MedicineCatalogItem]:
        """Поиск по названию (для ручного выбора при добавлении в аптечку)."""
        ...

    @abstractmethod
    async def add(self, entity: MedicineCatalogItem) -> MedicineCatalogItem:
        """Добавить в справочник."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить из справочника."""
        ...
