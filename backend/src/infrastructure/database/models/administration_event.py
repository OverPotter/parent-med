"""ORM-модель: факт приёма лекарства."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class AdministrationEventModel(Base):
    """Таблица приёмов лекарств: когда, сколько, из какой упаковки."""

    __tablename__ = "administration_events"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    episode_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("illness_episodes.id", ondelete="CASCADE"), nullable=False
    )
    household_medicine_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("household_medicines.id", ondelete="RESTRICT"),
        nullable=False,
    )
    administered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    amount: Mapped[str] = mapped_column(String(64), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(256), nullable=True)

    episode: Mapped["IllnessEpisodeModel"] = relationship(
        "IllnessEpisodeModel", back_populates="administration_events"
    )
    household_medicine: Mapped["HouseholdMedicineModel"] = relationship(
        "HouseholdMedicineModel", back_populates="administration_events"
    )
