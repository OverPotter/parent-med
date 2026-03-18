"""snapshot_household_medicines

Revision ID: 008
Revises: 007
Create Date: 2026-03-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("household_medicines", sa.Column("medicine_name", sa.String(length=255), nullable=True))
    op.add_column("household_medicines", sa.Column("medicine_form", sa.String(length=64), nullable=True))
    op.add_column(
        "household_medicines", sa.Column("medicine_concentration", sa.String(length=128), nullable=True)
    )
    op.add_column("household_medicines", sa.Column("medicine_description", sa.Text(), nullable=True))
    op.add_column("household_medicines", sa.Column("medicine_dosage", sa.Text(), nullable=True))

    op.execute(
        """
        UPDATE household_medicines hm
        SET
            medicine_name = mci.name,
            medicine_form = mci.form,
            medicine_concentration = mci.concentration,
            medicine_description = mci.description,
            medicine_dosage = mci.dosage
        FROM medicine_catalog_items mci
        WHERE hm.catalog_item_id = mci.id
        """
    )

    op.alter_column("household_medicines", "medicine_name", nullable=False)
    op.alter_column("household_medicines", "medicine_form", nullable=False)
    op.alter_column("household_medicines", "catalog_item_id", nullable=True)


def downgrade() -> None:
    op.alter_column("household_medicines", "catalog_item_id", nullable=False)
    op.drop_column("household_medicines", "medicine_dosage")
    op.drop_column("household_medicines", "medicine_description")
    op.drop_column("household_medicines", "medicine_concentration")
    op.drop_column("household_medicines", "medicine_form")
    op.drop_column("household_medicines", "medicine_name")
