"""Сущность: справочник препарата."""

from dataclasses import dataclass
from uuid import UUID


@dataclass
class MedicineCatalogItem:
    """Справочная запись препарата для ручного добавления в аптечку."""

    id: UUID
    name: str
    form: str  # tablet, syrup, drops, etc.
    concentration: str | None  # например "100 мг/5 мл"
    description: str | None
    dosage: str | None
    default_opened_shelf_days: int | None = None
    source: str = "manual"
    source_id: str | None = None
