"""add curated medicine catalog

Revision ID: 051
Revises: 050
Create Date: 2026-04-25
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "051"
down_revision: str | None = "050"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "curated_medicine_catalog_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("active_substance", sa.String(length=255), nullable=True),
        sa.Column("form", sa.String(length=64), nullable=False),
        sa.Column("strength", sa.String(length=128), nullable=True),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("is_otc", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "is_home_cabinet_relevant",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column("search_rank", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_curated_medicine_catalog_items")),
        sa.UniqueConstraint(
            "language",
            "display_name",
            "form",
            "strength",
            name="uq_curated_medicine_catalog_items_lang_name_form_strength",
        ),
    )
    op.create_index(
        "ix_curated_medicine_catalog_items_language",
        "curated_medicine_catalog_items",
        ["language"],
        unique=False,
    )
    op.create_index(
        "ix_curated_medicine_catalog_items_display_name",
        "curated_medicine_catalog_items",
        ["display_name"],
        unique=False,
    )
    op.create_index(
        "ix_curated_medicine_catalog_items_active_substance",
        "curated_medicine_catalog_items",
        ["active_substance"],
        unique=False,
    )
    op.create_index(
        "ix_curated_medicine_catalog_items_home_relevant",
        "curated_medicine_catalog_items",
        ["is_home_cabinet_relevant"],
        unique=False,
    )
    op.create_index(
        "ix_curated_medicine_catalog_items_search_rank",
        "curated_medicine_catalog_items",
        ["search_rank"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_curated_medicine_catalog_items_search_rank",
        table_name="curated_medicine_catalog_items",
    )
    op.drop_index(
        "ix_curated_medicine_catalog_items_home_relevant",
        table_name="curated_medicine_catalog_items",
    )
    op.drop_index(
        "ix_curated_medicine_catalog_items_active_substance",
        table_name="curated_medicine_catalog_items",
    )
    op.drop_index(
        "ix_curated_medicine_catalog_items_display_name",
        table_name="curated_medicine_catalog_items",
    )
    op.drop_index(
        "ix_curated_medicine_catalog_items_language",
        table_name="curated_medicine_catalog_items",
    )
    op.drop_table("curated_medicine_catalog_items")
