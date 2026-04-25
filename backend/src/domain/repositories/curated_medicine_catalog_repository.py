"""Интерфейс репозитория curated-справочника препаратов."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.curated_medicine_catalog_item import CuratedMedicineCatalogItem
from src.domain.repositories.base import BaseRepository


class CuratedMedicineCatalogRepository(BaseRepository[CuratedMedicineCatalogItem]):
    """Репозиторий пользовательского каталога препаратов."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> CuratedMedicineCatalogItem | None:
        """Получить препарат по id."""
        ...

    @abstractmethod
    async def find_by_name(
        self,
        query: str | None,
        language: str,
        limit: int = 20,
    ) -> list[CuratedMedicineCatalogItem]:
        """Найти препараты по короткому имени или действующему веществу."""
        ...

    @abstractmethod
    async def add(self, entity: CuratedMedicineCatalogItem) -> CuratedMedicineCatalogItem:
        """Добавить запись в curated-каталог."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить запись из curated-каталога."""
        ...
