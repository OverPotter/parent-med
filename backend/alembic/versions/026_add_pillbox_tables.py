"""add pillbox tables

Revision ID: 026
Revises: 025
Create Date: 2026-04-02
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pillbox_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column(
            "member_account_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("created_by_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["created_by_account_id"], ["accounts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["family_id"], ["families.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pillbox_plans")),
    )
    op.create_table(
        "pillbox_medications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("household_medicine_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("custom_medicine_name", sa.String(length=255), nullable=True),
        sa.Column("dose_amount", sa.String(length=64), nullable=False),
        sa.Column("meal_rule", sa.String(length=32), nullable=False),
        sa.Column(
            "repeat_days", postgresql.ARRAY(sa.Integer()), nullable=False, server_default="{}"
        ),
        sa.Column("times", postgresql.ARRAY(sa.Time()), nullable=False),
        sa.Column("course_mode", sa.String(length=32), nullable=False),
        sa.Column("course_start_date", sa.Date(), nullable=True),
        sa.Column("course_end_date", sa.Date(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(
            ["household_medicine_id"], ["household_medicines.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["plan_id"], ["pillbox_plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pillbox_medications")),
    )
    op.create_table(
        "pillbox_dose_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("medication_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("taken_by_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("taken_by_name_snapshot", sa.String(length=255), nullable=True),
        sa.Column("amount_snapshot", sa.String(length=64), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="manual"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["family_id"], ["families.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["medication_id"], ["pillbox_medications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["pillbox_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["taken_by_account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pillbox_dose_logs")),
    )
    op.create_index(
        op.f("ix_pillbox_plans_family_id"), "pillbox_plans", ["family_id"], unique=False
    )
    op.create_index(
        op.f("ix_pillbox_medications_plan_id"), "pillbox_medications", ["plan_id"], unique=False
    )
    op.create_index(
        op.f("ix_pillbox_dose_logs_plan_id"), "pillbox_dose_logs", ["plan_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_pillbox_dose_logs_plan_id"), table_name="pillbox_dose_logs")
    op.drop_index(op.f("ix_pillbox_medications_plan_id"), table_name="pillbox_medications")
    op.drop_index(op.f("ix_pillbox_plans_family_id"), table_name="pillbox_plans")
    op.drop_table("pillbox_dose_logs")
    op.drop_table("pillbox_medications")
    op.drop_table("pillbox_plans")
