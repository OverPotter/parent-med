"""ORM-модель: запись кормления ребёнка."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class FeedingRecordModel(Base):
    """Таблица записей кормления."""

    __tablename__ = "feeding_records"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    child_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False
    )
    feeding_type: Mapped[str] = mapped_column(String(32), nullable=False)
    breast_side: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_expressed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    formula_volume_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="completed")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_account_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )

    child: Mapped["ChildModel"] = relationship("ChildModel", back_populates="feeding_records")
