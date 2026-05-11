"""Add child avatar preset key."""

from alembic import op
import sqlalchemy as sa


revision = "073_add_child_avatar_key"
down_revision = "072_add_episode_creator"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "children",
        sa.Column("avatar_key", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("children", "avatar_key")
