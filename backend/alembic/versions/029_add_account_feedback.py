"""add account_feedback table

Revision ID: 029
Revises: 028
Create Date: 2026-04-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "029"
down_revision: str | None = "028"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "account_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("client_request_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "account_id",
            "client_request_id",
            name="uq_account_feedback_account_client_request",
        ),
    )
    op.create_index(
        "ix_account_feedback_account_created",
        "account_feedback",
        ["account_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_account_feedback_account_created", table_name="account_feedback")
    op.drop_table("account_feedback")
