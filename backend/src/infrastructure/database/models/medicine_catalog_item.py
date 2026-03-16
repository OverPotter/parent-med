"""ORM-модель: справочник препарата."""

from uuid import uuid4

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class MedicineCatalogItemModel(Base):
    """Таблица справочника препаратов."""

    __tablename__ = "medicine_catalog_items"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    form: Mapped[str] = mapped_column(String(64), nullable=False)  # tablet, syrup, drops
    concentration: Mapped[str | None] = mapped_column(String(128), nullable=True)

    household_medicines: Mapped[list] = relationship(
        "HouseholdMedicineModel", back_populates="catalog_item"
    )
