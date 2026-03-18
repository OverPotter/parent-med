"""ORM-модель: аккаунт пользователя."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class AccountModel(Base):
    """Таблица аккаунтов с привязкой к семье."""

    __tablename__ = "accounts"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("families.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    family: Mapped["FamilyModel"] = relationship("FamilyModel", back_populates="account")
    sessions: Mapped[list] = relationship("AccountSessionModel", back_populates="account")
