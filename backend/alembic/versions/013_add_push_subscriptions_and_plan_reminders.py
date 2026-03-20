"""add push subscriptions and medication plan reminders

Revision ID: 013
Revises: 012
Create Date: 2026-03-19 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "013"
down_revision: str | None = "012"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "push_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh_key", sa.String(length=255), nullable=False),
        sa.Column("auth_key", sa.String(length=255), nullable=False),
        sa.Column("expiration_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("device_label", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("endpoint"),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("reminders_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("reminder_before_minutes", sa.Integer(), nullable=True, server_default="10"),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("notify_at_due", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("last_before_notification_for_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("last_due_notification_for_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.alter_column("episode_medication_plans", "reminders_enabled", server_default=None)
    op.alter_column("episode_medication_plans", "reminder_before_minutes", server_default=None)
    op.alter_column("episode_medication_plans", "notify_at_due", server_default=None)


def downgrade() -> None:
    op.drop_column("episode_medication_plans", "last_due_notification_for_at")
    op.drop_column("episode_medication_plans", "last_before_notification_for_at")
    op.drop_column("episode_medication_plans", "notify_at_due")
    op.drop_column("episode_medication_plans", "reminder_before_minutes")
    op.drop_column("episode_medication_plans", "reminders_enabled")
    op.drop_table("push_subscriptions")
