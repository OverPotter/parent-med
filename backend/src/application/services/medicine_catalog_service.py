"""Сервис справочника препаратов."""

from uuid import UUID, uuid4

from src.application.dto.medicine_catalog import (
    MedicineCatalogCreateDto,
    MedicineCatalogResponseDto,
)
from src.core.exceptions import NotFoundError
from src.domain.entities.medicine_catalog_item import MedicineCatalogItem
from src.domain.repositories.medicine_catalog_repository import MedicineCatalogRepository


class MedicineCatalogService:
    """Сервис справочника препаратов (ручное добавление, поиск)."""

    def __init__(self, catalog_repo: MedicineCatalogRepository) -> None:
        self._repo = catalog_repo

    def _to_response(self, entity: MedicineCatalogItem) -> MedicineCatalogResponseDto:
        return MedicineCatalogResponseDto(
            id=entity.id,
            name=entity.name,
            form=entity.form,
            concentration=entity.concentration,
        )

    async def get_by_id(self, id: UUID) -> MedicineCatalogResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Препарат не найден", resource="medicine_catalog")
        return self._to_response(entity)

    async def find_by_name(self, name: str, limit: int = 20) -> list[MedicineCatalogResponseDto]:
        entities = await self._repo.find_by_name(name, limit=limit)
        return [self._to_response(e) for e in entities]

    async def create(self, dto: MedicineCatalogCreateDto) -> MedicineCatalogResponseDto:
        entity = MedicineCatalogItem(
            id=uuid4(),
            name=dto.name,
            form=dto.form,
            concentration=dto.concentration,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Препарат не найден", resource="medicine_catalog")
        await self._repo.delete(id)
