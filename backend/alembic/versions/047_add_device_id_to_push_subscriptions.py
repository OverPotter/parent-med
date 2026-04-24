"""add device id to push subscriptions

Revision ID: 047
Revises: 046
Create Date: 2026-04-24
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "047"
down_revision: str | None = "046"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "push_subscriptions",
        sa.Column("device_id", sa.String(length=128), nullable=True),
    )
    op.create_unique_constraint(
        "uq_push_subscriptions_account_platform_device",
        "push_subscriptions",
        ["account_id", "platform", "device_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_push_subscriptions_account_platform_device",
        "push_subscriptions",
        type_="unique",
    )
    op.drop_column("push_subscriptions", "device_id")
