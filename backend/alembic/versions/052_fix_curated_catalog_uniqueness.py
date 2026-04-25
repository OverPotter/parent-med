"""fix curated catalog uniqueness for nullable strength

Revision ID: 052
Revises: 051
Create Date: 2026-04-25
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "052"
down_revision: str | None = "051"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_curated_medicine_catalog_items_lang_name_form_strength",
        "curated_medicine_catalog_items",
        type_="unique",
    )
    op.create_index(
        "uq_curated_medicine_catalog_items_lang_name_form_strength_norm",
        "curated_medicine_catalog_items",
        [
            "language",
            "display_name",
            "form",
            sa.text("coalesce(strength, '')"),
        ],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "uq_curated_medicine_catalog_items_lang_name_form_strength_norm",
        table_name="curated_medicine_catalog_items",
    )
    op.create_unique_constraint(
        "uq_curated_medicine_catalog_items_lang_name_form_strength",
        "curated_medicine_catalog_items",
        ["language", "display_name", "form", "strength"],
    )
