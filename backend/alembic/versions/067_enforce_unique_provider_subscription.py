"""enforce unique provider subscription identity

Revision ID: 067_provider_sub_unique
Revises: 066
Create Date: 2026-04-27 15:10:00
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "067_provider_sub_unique"
down_revision = "066"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "uq_subscriptions_provider_subscription_id",
        "subscriptions",
        ["provider", "provider_subscription_id"],
        unique=True,
        postgresql_where=sa.text("provider_subscription_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_subscriptions_provider_subscription_id", table_name="subscriptions")
