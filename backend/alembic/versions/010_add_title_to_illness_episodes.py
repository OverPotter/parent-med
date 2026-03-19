"""add_title_to_illness_episodes

Revision ID: 010
Revises: 009
Create Date: 2026-03-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("illness_episodes", sa.Column("title", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("illness_episodes", "title")
