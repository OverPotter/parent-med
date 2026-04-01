"""add pillbox notification deliveries

Revision ID: 027
Revises: 026
Create Date: 2026-04-02
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "027"
down_revision = "026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pillbox_notification_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("medication_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notification_kind", sa.String(length=32), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["family_id"], ["families.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["medication_id"], ["pillbox_medications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["pillbox_plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pillbox_notification_deliveries")),
        sa.UniqueConstraint(
            "plan_id",
            "medication_id",
            "notification_kind",
            "scheduled_for",
            "account_id",
            name="uq_pillbox_notification_delivery",
        ),
    )
    op.create_index(
        op.f("ix_pillbox_notification_deliveries_plan_id"),
        "pillbox_notification_deliveries",
        ["plan_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_pillbox_notification_deliveries_plan_id"),
        table_name="pillbox_notification_deliveries",
    )
    op.drop_table("pillbox_notification_deliveries")
