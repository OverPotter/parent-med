"""ORM-модель: эпизод болезни ребёнка."""

from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class IllnessEpisodeModel(Base):
    """Таблица эпизодов болезни: дата начала, статус, заметка."""

    __tablename__ = "illness_episodes"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    child_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    medication_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    note: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    member_account_ids: Mapped[list[UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=False,
        default=list,
        server_default="{}",
    )
    created_by_account_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    child: Mapped["ChildModel"] = relationship("ChildModel", back_populates="illness_episodes")
    temperature_entries: Mapped[list] = relationship(
        "TemperatureEntryModel", back_populates="episode"
    )
    administration_events: Mapped[list] = relationship(
        "AdministrationEventModel", back_populates="episode"
    )
    medication_plans: Mapped[list] = relationship(
        "EpisodeMedicationPlanModel", back_populates="episode"
    )
