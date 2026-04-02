"""allow optional account email and track pillbox scheduled slot

Revision ID: 028
Revises: 027
Create Date: 2026-04-02
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "028"
down_revision: str | None = "027"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("accounts", "email", existing_type=sa.String(length=255), nullable=True)
    op.add_column(
        "pillbox_dose_logs",
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pillbox_dose_logs", "scheduled_for")
    op.execute("UPDATE accounts SET email = CONCAT(login, '@example.local') WHERE email IS NULL")
    op.alter_column("accounts", "email", existing_type=sa.String(length=255), nullable=False)
