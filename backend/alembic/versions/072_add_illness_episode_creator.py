"""Add illness episode creator account."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "072_add_episode_creator"
down_revision = "071_illness_notification_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "illness_episodes",
        sa.Column(
            "created_by_account_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_illness_episodes_created_by_account_id",
        "illness_episodes",
        "accounts",
        ["created_by_account_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_illness_episodes_created_by_account_id",
        "illness_episodes",
        type_="foreignkey",
    )
    op.drop_column("illness_episodes", "created_by_account_id")
