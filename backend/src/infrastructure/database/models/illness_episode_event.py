"""ORM-модель: универсальное событие внутри эпизода болезни."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class IllnessEpisodeEventModel(Base):
    """Единый журнал событий эпизода: температура и приёмы лекарств."""

    __tablename__ = "illness_episode_events"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    episode_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("illness_episodes.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    value_celsius: Mapped[float | None] = mapped_column(Float, nullable=True)
    method: Mapped[str | None] = mapped_column(String(64), nullable=True)
    comment: Mapped[str | None] = mapped_column(String(512), nullable=True)
    household_medicine_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("household_medicines.id", ondelete="RESTRICT"),
        nullable=True,
    )
    amount: Mapped[str | None] = mapped_column(String(64), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(256), nullable=True)

    episode: Mapped["IllnessEpisodeModel"] = relationship("IllnessEpisodeModel")
