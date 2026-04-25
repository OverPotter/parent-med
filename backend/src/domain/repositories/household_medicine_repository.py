"""Интерфейс репозитория домашней аптечки."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.repositories.base import BaseRepository


class HouseholdMedicineRepository(BaseRepository[HouseholdMedicine]):
    """Репозиторий упаковок в аптечке семьи."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> HouseholdMedicine | None:
        """Получить упаковку по id."""
        ...

    @abstractmethod
    async def get_by_family_id(self, family_id: UUID) -> list[HouseholdMedicine]:
        """Все упаковки в аптечке семьи."""
        ...

    @abstractmethod
    async def find_by_snapshot(
        self,
        family_id: UUID,
        medicine_name: str,
        medicine_shape: str,
        medicine_concentration: str | None,
    ) -> HouseholdMedicine | None:
        """Найти упаковку по каноническому snapshot лекарства."""
        ...

    @abstractmethod
    async def add(self, entity: HouseholdMedicine) -> HouseholdMedicine:
        """Добавить упаковку."""
        ...

    @abstractmethod
    async def update(self, entity: HouseholdMedicine) -> HouseholdMedicine:
        """Обновить упаковку (например, дата вскрытия)."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить упаковку."""
        ...
