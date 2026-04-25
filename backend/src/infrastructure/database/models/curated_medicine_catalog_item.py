"""ORM-модель: curated-справочник препарата."""

from uuid import uuid4

from sqlalchemy import Boolean, Float, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.base import Base


class CuratedMedicineCatalogItemModel(Base):
    """Короткий каталог лекарств для пользовательского поиска."""

    __tablename__ = "curated_medicine_catalog_items"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="ru")
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    active_substance: Mapped[str | None] = mapped_column(String(255), nullable=True)
    form: Mapped[str] = mapped_column(String(64), nullable=False)
    strength: Mapped[str | None] = mapped_column(String(128), nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    dosage_summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    pediatric_dose_mg_per_kg_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    pediatric_dose_mg_per_kg_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    pediatric_dose_note: Mapped[str | None] = mapped_column(Text(), nullable=True)
    default_opened_shelf_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_otc: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_home_cabinet_relevant: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    search_rank: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index(
            "uq_curated_medicine_catalog_items_lang_name_form_strength_norm",
            "language",
            "display_name",
            "form",
            func.coalesce(strength, ""),
            unique=True,
        ),
        Index("ix_curated_medicine_catalog_items_language", "language"),
        Index("ix_curated_medicine_catalog_items_display_name", "display_name"),
        Index("ix_curated_medicine_catalog_items_active_substance", "active_substance"),
        Index(
            "ix_curated_medicine_catalog_items_home_relevant",
            "is_home_cabinet_relevant",
        ),
        Index("ix_curated_medicine_catalog_items_search_rank", "search_rank"),
    )
