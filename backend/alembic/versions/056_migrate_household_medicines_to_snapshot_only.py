"""migrate household medicines to snapshot-only architecture

Revision ID: 056_household_snapshot_only
Revises: 055_structured_pediatric_dose
Create Date: 2026-04-25 16:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "056_household_snapshot_only"
down_revision: str | None = "055_structured_pediatric_dose"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("household_medicines", sa.Column("medicine_category", sa.String(length=64), nullable=True))

    with op.batch_alter_table("household_medicines") as batch_op:
        batch_op.drop_constraint(
            "fk_household_medicines_catalog_item_id_medicine_catalog_items",
            type_="foreignkey",
        )
        batch_op.drop_column("catalog_item_id")

    op.drop_table("medicine_catalog_items")


def downgrade() -> None:
    op.create_table(
        "medicine_catalog_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("form", sa.String(length=64), nullable=False),
        sa.Column("concentration", sa.String(length=128), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("dosage", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("source_id", sa.String(length=128), nullable=True),
        sa.Column("default_opened_shelf_days", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_medicine_catalog_items")),
        sa.UniqueConstraint(
            "source",
            "source_id",
            name="uq_medicine_catalog_items_source_source_id",
        ),
    )

    with op.batch_alter_table("household_medicines") as batch_op:
        batch_op.add_column(sa.Column("catalog_item_id", sa.UUID(), nullable=True))
        batch_op.create_foreign_key(
            op.f("fk_household_medicines_catalog_item_id_medicine_catalog_items"),
            "medicine_catalog_items",
            ["catalog_item_id"],
            ["id"],
            ondelete="SET NULL",
        )

    op.drop_column("household_medicines", "medicine_category")
