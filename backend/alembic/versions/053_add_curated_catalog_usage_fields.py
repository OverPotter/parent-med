"""add dosage and opened-shelf fields to curated catalog

Revision ID: 053
Revises: 052
Create Date: 2026-04-25
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "053"
down_revision: str | None = "052"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "curated_medicine_catalog_items",
        sa.Column("dosage_summary", sa.Text(), nullable=True),
    )
    op.add_column(
        "curated_medicine_catalog_items",
        sa.Column("default_opened_shelf_days", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("curated_medicine_catalog_items", "default_opened_shelf_days")
    op.drop_column("curated_medicine_catalog_items", "dosage_summary")
