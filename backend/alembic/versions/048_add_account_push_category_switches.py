"""add account push category switches

Revision ID: 048
Revises: 047
Create Date: 2026-04-24
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "048"
down_revision: str | None = "047"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column("children_push_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "accounts",
        sa.Column("pillbox_push_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.execute(
        sa.text(
            """
            UPDATE accounts
            SET children_push_enabled = CASE
                WHEN push_before_reminder_minutes = 0 THEN false
                ELSE true
            END,
            pillbox_push_enabled = CASE
                WHEN pillbox_push_before_reminder_minutes = 0 THEN false
                ELSE true
            END
            """
        )
    )
    op.alter_column("accounts", "children_push_enabled", server_default=None)
    op.alter_column("accounts", "pillbox_push_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("accounts", "pillbox_push_enabled")
    op.drop_column("accounts", "children_push_enabled")
