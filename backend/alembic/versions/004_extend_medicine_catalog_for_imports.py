"""extend_medicine_catalog_for_imports

Revision ID: 004
Revises: 003
Create Date: 2026-03-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("medicine_catalog_items", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("medicine_catalog_items", sa.Column("dosage", sa.Text(), nullable=True))
    op.add_column(
        "medicine_catalog_items",
        sa.Column("source", sa.String(length=32), server_default="manual", nullable=False),
    )
    op.add_column("medicine_catalog_items", sa.Column("source_id", sa.String(length=128), nullable=True))
    op.create_unique_constraint(
        "uq_medicine_catalog_items_source_source_id",
        "medicine_catalog_items",
        ["source", "source_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_medicine_catalog_items_source_source_id",
        "medicine_catalog_items",
        type_="unique",
    )
    op.drop_column("medicine_catalog_items", "source_id")
    op.drop_column("medicine_catalog_items", "source")
    op.drop_column("medicine_catalog_items", "dosage")
    op.drop_column("medicine_catalog_items", "description")
