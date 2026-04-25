"""remove account login column

Revision ID: 058_remove_account_login
Revises: 057_clear_medicine_data
Create Date: 2026-04-25 18:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "058_remove_account_login"
down_revision: str | None = "057_clear_medicine_data"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("accounts", "login")


def downgrade() -> None:
    op.add_column("accounts", sa.Column("login", sa.String(length=255), nullable=True))
    op.execute("UPDATE accounts SET login = email WHERE email IS NOT NULL")
    op.execute("UPDATE accounts SET login = 'restored-' || replace(id::text, '-', '') WHERE login IS NULL")
    op.alter_column("accounts", "login", nullable=False)
    op.create_unique_constraint(op.f("uq_accounts_login"), "accounts", ["login"])
