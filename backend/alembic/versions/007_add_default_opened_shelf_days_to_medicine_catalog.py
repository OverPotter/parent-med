"""add_default_opened_shelf_days_to_medicine_catalog

Revision ID: 007
Revises: 006
Create Date: 2026-03-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "medicine_catalog_items",
        sa.Column("default_opened_shelf_days", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("medicine_catalog_items", "default_opened_shelf_days")
