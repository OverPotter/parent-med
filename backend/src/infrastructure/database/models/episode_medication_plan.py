"""ORM-модель: план приёма лекарства в эпизоде болезни."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class EpisodeMedicationPlanModel(Base):
    """Таблица guided-планов лекарства внутри эпизода."""

    __tablename__ = "episode_medication_plans"
    __table_args__ = (
        UniqueConstraint(
            "episode_id",
            "household_medicine_id",
            name="uq_episode_medication_plans_episode_medicine",
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    episode_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("illness_episodes.id", ondelete="CASCADE"), nullable=False
    )
    household_medicine_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("household_medicines.id", ondelete="RESTRICT"),
        nullable=False,
    )
    dose_amount: Mapped[str] = mapped_column(String(64), nullable=False)
    min_interval_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    max_doses_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    dose_mg_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    reminders_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_before_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True, default=10)
    notify_at_due: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_before_notification_for_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_due_notification_for_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    episode: Mapped["IllnessEpisodeModel"] = relationship(
        "IllnessEpisodeModel", back_populates="medication_plans"
    )
    household_medicine: Mapped["HouseholdMedicineModel"] = relationship(
        "HouseholdMedicineModel", back_populates="medication_plans"
    )
