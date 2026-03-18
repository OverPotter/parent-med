"""ORM-модель: ребёнок."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

from sqlalchemy import Date, ForeignKey, String
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

    family: Mapped["FamilyModel"] = relationship("FamilyModel", back_populates="children")
    weight_entries: Mapped[list] = relationship(
        "WeightEntryModel",
        back_populates="child",
        passive_deletes=True,
    )
    illness_episodes: Mapped[list] = relationship(
        "IllnessEpisodeModel",
        back_populates="child",
        passive_deletes=True,
    )
