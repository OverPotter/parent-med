"""add_episode_medication_plans

Revision ID: 012
Revises: 011
Create Date: 2026-03-19

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "illness_episodes",
        sa.Column("medication_mode", sa.String(length=32), nullable=False, server_default="manual"),
    )
    op.execute("UPDATE illness_episodes SET medication_mode = 'manual' WHERE medication_mode IS NULL")
    op.alter_column("illness_episodes", "medication_mode", server_default=None)

    op.create_table(
        "episode_medication_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("episode_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("household_medicine_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dose_amount", sa.String(length=64), nullable=False),
        sa.Column("min_interval_hours", sa.Integer(), nullable=False),
        sa.Column("max_doses_per_day", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("dose_mg_per_kg", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["episode_id"], ["illness_episodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["household_medicine_id"], ["household_medicines.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "episode_id",
            "household_medicine_id",
            name="uq_episode_medication_plans_episode_medicine",
        ),
    )


def downgrade() -> None:
    op.drop_table("episode_medication_plans")
    op.drop_column("illness_episodes", "medication_mode")
