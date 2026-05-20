"""add child gender

Revision ID: 074_add_child_gender
Revises: 073_add_child_avatar_key
Create Date: 2026-05-11 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "074_add_child_gender"
down_revision = "073_add_child_avatar_key"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "children",
        sa.Column("gender", sa.String(length=16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("children", "gender")
