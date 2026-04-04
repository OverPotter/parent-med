"""add pillbox push before reminder minutes

Revision ID: 029
Revises: 028
Create Date: 2026-04-04
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "029"
down_revision: str | None = "028"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "pillbox_push_before_reminder_minutes",
            sa.Integer(),
            nullable=False,
            server_default="10",
        ),
    )


def downgrade() -> None:
    op.drop_column("accounts", "pillbox_push_before_reminder_minutes")
