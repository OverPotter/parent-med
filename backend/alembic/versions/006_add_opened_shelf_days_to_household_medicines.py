"""add_opened_shelf_days_to_household_medicines

Revision ID: 006
Revises: 005
Create Date: 2026-03-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("household_medicines", sa.Column("opened_shelf_days", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("household_medicines", "opened_shelf_days")
