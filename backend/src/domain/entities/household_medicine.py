"""Сущность: конкретная упаковка препарата в домашней аптечке."""

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass
class HouseholdMedicine:
    """Упаковка препарата дома: срок годности, дата вскрытия, статус."""

    id: UUID
    family_id: UUID
    catalog_item_id: UUID
    expiry_date: date
    opened_at: datetime | None
    storage_place: str | None
    comment: str | None
