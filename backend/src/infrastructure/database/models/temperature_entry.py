"""ORM-модель: запись температуры в эпизоде болезни."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class TemperatureEntryModel(Base):
    """Таблица записей температуры."""

    __tablename__ = "temperature_entries"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    episode_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("illness_episodes.id", ondelete="CASCADE"), nullable=False
    )
    value_celsius: Mapped[float] = mapped_column(Float, nullable=False)
    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    method: Mapped[str | None] = mapped_column(String(64), nullable=True)
    comment: Mapped[str | None] = mapped_column(String(512), nullable=True)

    episode: Mapped["IllnessEpisodeModel"] = relationship(
        "IllnessEpisodeModel", back_populates="temperature_entries"
    )
