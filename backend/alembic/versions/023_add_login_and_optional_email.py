"""Add login column to accounts.

Revision ID: 023
Revises: 022
Create Date: 2026-03-20
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "023"
down_revision: str | None = "022"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("accounts", sa.Column("login", sa.String(length=255), nullable=True))
    op.execute("UPDATE accounts SET login = email WHERE login IS NULL")
    op.alter_column("accounts", "login", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("accounts", "email", existing_type=sa.String(length=255), nullable=True)
    op.create_unique_constraint("uq_accounts_login", "accounts", ["login"])


def downgrade() -> None:
    op.drop_constraint("uq_accounts_login", "accounts", type_="unique")
    op.execute(
        "UPDATE accounts SET email = CONCAT(login, '@example.local') WHERE email IS NULL"
    )
    op.alter_column("accounts", "email", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("accounts", "login")
