"""add live activity preferences to accounts

Revision ID: 039
Revises: 038_created_by_events
Create Date: 2026-04-20
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "039"
down_revision: str | None = "038_created_by_events"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column("live_activity_sleep_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "accounts",
        sa.Column(
            "live_activity_feeding_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.alter_column("accounts", "live_activity_sleep_enabled", server_default=None)
    op.alter_column("accounts", "live_activity_feeding_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("accounts", "live_activity_feeding_enabled")
    op.drop_column("accounts", "live_activity_sleep_enabled")
