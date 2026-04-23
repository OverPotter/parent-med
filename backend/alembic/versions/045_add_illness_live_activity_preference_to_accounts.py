"""add illness live activity preference to accounts

Revision ID: 045
Revises: 044
Create Date: 2026-04-22
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "045"
down_revision: str | None = "044"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "live_activity_illness_enabled",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
    )
    op.alter_column("accounts", "live_activity_illness_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("accounts", "live_activity_illness_enabled")
