"""add sleep sessions

Revision ID: 034
Revises: 033
Create Date: 2026-04-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sleep_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_by_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sleep_sessions_child_id", "sleep_sessions", ["child_id"], unique=False)
    op.create_index("ix_sleep_sessions_status", "sleep_sessions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_sleep_sessions_status", table_name="sleep_sessions")
    op.drop_index("ix_sleep_sessions_child_id", table_name="sleep_sessions")
    op.drop_table("sleep_sessions")
