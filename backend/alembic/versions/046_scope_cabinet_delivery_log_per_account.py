"""scope cabinet delivery log per account

Revision ID: 046
Revises: 045
Create Date: 2026-04-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "046"
down_revision = "045"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "household_medicine_notification_deliveries",
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute("DELETE FROM household_medicine_notification_deliveries")
    op.alter_column(
        "household_medicine_notification_deliveries",
        "account_id",
        nullable=False,
    )
    op.create_foreign_key(
        "fk_household_medicine_notification_deliveries_account_id",
        "household_medicine_notification_deliveries",
        "accounts",
        ["account_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint(
        "uq_household_medicine_notification_delivery",
        "household_medicine_notification_deliveries",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_household_medicine_notification_delivery",
        "household_medicine_notification_deliveries",
        [
            "household_medicine_id",
            "notification_kind",
            "target_date",
            "days_before",
            "account_id",
        ],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_household_medicine_notification_delivery",
        "household_medicine_notification_deliveries",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_household_medicine_notification_delivery",
        "household_medicine_notification_deliveries",
        [
            "household_medicine_id",
            "notification_kind",
            "target_date",
            "days_before",
        ],
    )
    op.drop_constraint(
        "fk_household_medicine_notification_deliveries_account_id",
        "household_medicine_notification_deliveries",
        type_="foreignkey",
    )
    op.drop_column("household_medicine_notification_deliveries", "account_id")
