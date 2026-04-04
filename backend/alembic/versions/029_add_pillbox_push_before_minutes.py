"""add pillbox push before reminder minutes

Revision ID: 030
Revises: 029
Create Date: 2026-04-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision: str = "030"
down_revision: str | None = "029"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("accounts")}
    if "pillbox_push_before_reminder_minutes" not in columns:
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
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("accounts")}
    if "pillbox_push_before_reminder_minutes" in columns:
        op.drop_column("accounts", "pillbox_push_before_reminder_minutes")
