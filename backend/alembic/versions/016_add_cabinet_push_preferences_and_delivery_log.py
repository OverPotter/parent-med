"""add cabinet push preferences and delivery log

Revision ID: 016
Revises: 015
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column("cabinet_notify_30_days", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "accounts",
        sa.Column("cabinet_notify_15_days", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "accounts",
        sa.Column("cabinet_notify_7_days", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "accounts",
        sa.Column("cabinet_notify_1_day", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "household_medicine_notification_deliveries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "household_medicine_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("notification_kind", sa.String(length=32), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=False),
        sa.Column("days_before", sa.Integer(), nullable=False),
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["household_medicine_id"],
            ["household_medicines.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "household_medicine_id",
            "notification_kind",
            "target_date",
            "days_before",
            name="uq_household_medicine_notification_delivery",
        ),
    )


def downgrade() -> None:
    op.drop_table("household_medicine_notification_deliveries")
    op.drop_column("accounts", "cabinet_notify_1_day")
    op.drop_column("accounts", "cabinet_notify_7_days")
    op.drop_column("accounts", "cabinet_notify_15_days")
    op.drop_column("accounts", "cabinet_notify_30_days")
