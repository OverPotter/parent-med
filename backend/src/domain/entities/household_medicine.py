"""Сущность: конкретная упаковка препарата в домашней аптечке."""

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass
class HouseholdMedicine:
    """Упаковка препарата дома: срок годности, дата вскрытия, статус."""

    id: UUID
    family_id: UUID
    catalog_item_id: UUID | None
    medicine_name: str
    medicine_form: str
    medicine_concentration: str | None
    medicine_description: str | None
    medicine_dosage: str | None
    expiry_date: date
    opened_at: datetime | None
    opened_shelf_days: int | None
    comment: str | None
