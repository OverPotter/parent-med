"""ORM-модель: ребёнок."""

from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class ChildModel(Base):
    """Таблица детей."""

    __tablename__ = "children"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    baby_mode_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    institution_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    institution_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    doctor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    doctor_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    family: Mapped["FamilyModel"] = relationship(
        "FamilyModel",
        back_populates="children",
        foreign_keys=[family_id],
    )
    weight_entries: Mapped[list] = relationship(
        "WeightEntryModel",
        back_populates="child",
        passive_deletes=True,
    )
    height_entries: Mapped[list] = relationship(
        "HeightEntryModel",
        back_populates="child",
        passive_deletes=True,
    )
    sleep_sessions: Mapped[list] = relationship(
        "SleepSessionModel",
        back_populates="child",
        passive_deletes=True,
    )
    feeding_records: Mapped[list] = relationship(
        "FeedingRecordModel",
        back_populates="child",
        passive_deletes=True,
    )
    illness_episodes: Mapped[list] = relationship(
        "IllnessEpisodeModel",
        back_populates="child",
        passive_deletes=True,
    )
