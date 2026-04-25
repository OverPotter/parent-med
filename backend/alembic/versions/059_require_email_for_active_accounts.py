"""Require email for non-deleted accounts."""

from alembic import op

# revision identifiers, used by Alembic.
revision = "059"
down_revision = "058_remove_account_login"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE accounts
        ADD CONSTRAINT ck_accounts_active_email_required
        CHECK (family_role = 'deleted' OR email IS NOT NULL) NOT VALID
        """
    )


def downgrade() -> None:
    op.drop_constraint("ck_accounts_active_email_required", "accounts", type_="check")
