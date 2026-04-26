"""add billing foundation tables

Revision ID: 062
Revises: 061
Create Date: 2026-04-25 18:30:00.000000
"""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "062"
down_revision: str | None = "061"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("apple_product_id", sa.String(length=255), nullable=True),
        sa.Column("revenuecat_entitlement_code", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("code", name="uq_plans_code"),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_customer_id", sa.String(length=255), nullable=True),
        sa.Column("provider_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "raw_payload_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["family_id"], ["families.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="RESTRICT"),
    )
    op.create_index(
        "ix_subscriptions_family_id_updated_at",
        "subscriptions",
        ["family_id", "updated_at"],
        unique=False,
    )

    op.create_table(
        "billing_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("external_event_id", sa.String(length=255), nullable=False),
        sa.Column(
            "payload_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["family_id"], ["families.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("external_event_id", name="uq_billing_events_external_event_id"),
    )

    plan_rows = [
        {
            "id": uuid4(),
            "code": "free",
            "name": "Free",
            "is_active": True,
            "apple_product_id": None,
            "revenuecat_entitlement_code": None,
            "sort_order": 0,
        },
        {
            "id": uuid4(),
            "code": "plus",
            "name": "Plus",
            "is_active": True,
            "apple_product_id": "pillpath_plus_monthly",
            "revenuecat_entitlement_code": "plus",
            "sort_order": 1,
        },
        {
            "id": uuid4(),
            "code": "pro",
            "name": "Pro",
            "is_active": True,
            "apple_product_id": "pillpath_pro_monthly",
            "revenuecat_entitlement_code": "pro",
            "sort_order": 2,
        },
    ]
    plans_table = sa.table(
        "plans",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("code", sa.String(length=32)),
        sa.column("name", sa.String(length=255)),
        sa.column("is_active", sa.Boolean()),
        sa.column("apple_product_id", sa.String(length=255)),
        sa.column("revenuecat_entitlement_code", sa.String(length=255)),
        sa.column("sort_order", sa.Integer()),
    )
    op.bulk_insert(plans_table, plan_rows)

    op.alter_column("plans", "is_active", server_default=None)
    op.alter_column("plans", "sort_order", server_default=None)
    op.alter_column("subscriptions", "raw_payload_json", server_default=None)
    op.alter_column("billing_events", "payload_json", server_default=None)


def downgrade() -> None:
    op.drop_table("billing_events")
    op.drop_index("ix_subscriptions_family_id_updated_at", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_table("plans")
