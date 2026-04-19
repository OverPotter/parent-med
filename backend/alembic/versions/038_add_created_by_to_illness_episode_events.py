"""add created_by fields to illness episode events

Revision ID: 038_created_by_events
Revises: 037_add_height_entries
Create Date: 2026-04-18
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "038_created_by_events"
down_revision: str | None = "037_add_height_entries"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "illness_episode_events",
        sa.Column("created_by_account_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "illness_episode_events",
        sa.Column("created_by_name_snapshot", sa.String(length=255), nullable=True),
    )
    op.create_foreign_key(
        "fk_illness_episode_events_created_by_account_id_accounts",
        "illness_episode_events",
        "accounts",
        ["created_by_account_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_illness_episode_events_created_by_account_id_accounts",
        "illness_episode_events",
        type_="foreignkey",
    )
    op.drop_column("illness_episode_events", "created_by_name_snapshot")
    op.drop_column("illness_episode_events", "created_by_account_id")
