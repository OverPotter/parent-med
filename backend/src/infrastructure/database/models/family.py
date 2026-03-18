"""ORM-модель: семья."""

from uuid import uuid4

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class FamilyModel(Base):
    """Таблица семей."""

    __tablename__ = "families"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    account: Mapped["AccountModel | None"] = relationship("AccountModel", back_populates="family")
    parents: Mapped[list] = relationship("ParentModel", back_populates="family")
    children: Mapped[list] = relationship("ChildModel", back_populates="family")
    household_medicines: Mapped[list] = relationship(
        "HouseholdMedicineModel", back_populates="family"
    )
