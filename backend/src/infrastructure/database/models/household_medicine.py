"""ORM-модель: упаковка препарата в домашней аптечке."""

from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class HouseholdMedicineModel(Base):
    """Таблица упаковок в аптечке: срок годности, дата вскрытия."""

    __tablename__ = "household_medicines"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    catalog_item_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("medicine_catalog_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    medicine_form: Mapped[str] = mapped_column(String(64), nullable=False)
    medicine_concentration: Mapped[str | None] = mapped_column(String(128), nullable=True)
    medicine_description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    medicine_dosage: Mapped[str | None] = mapped_column(Text(), nullable=True)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    opened_shelf_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_place: Mapped[str | None] = mapped_column(String(255), nullable=True)
    comment: Mapped[str | None] = mapped_column(String(512), nullable=True)

    family: Mapped["FamilyModel"] = relationship(
        "FamilyModel", back_populates="household_medicines"
    )
    catalog_item: Mapped["MedicineCatalogItemModel | None"] = relationship(
        "MedicineCatalogItemModel", back_populates="household_medicines"
    )
    administration_events: Mapped[list] = relationship(
        "AdministrationEventModel", back_populates="household_medicine"
    )
    medication_plans: Mapped[list] = relationship(
        "EpisodeMedicationPlanModel", back_populates="household_medicine"
    )
