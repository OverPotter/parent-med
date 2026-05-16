"""Pure subscription policy helpers shared across services."""

from dataclasses import dataclass
from datetime import UTC, datetime

from src.domain.entities.family import Family


@dataclass(frozen=True)
class FamilyPlanPolicy:
    """Resolved plan capabilities for a family."""

    premium_active: bool
    max_children: int | None
    max_adults: int | None
    max_pillbox_plans: int | None
    can_invite_members: bool
    can_manage_member_roles: bool
    can_use_live_activities: bool
    can_export_csv: bool


PREMIUM_PLAN_CODES = {"plus", "pro"}
ACTIVE_SUBSCRIPTION_STATUSES = {"trialing", "active", "grace"}
NON_BILLING_CONTEXT_STATUSES = {"inactive", "expired"}


def is_premium_active(family: Family) -> bool:
    if family.plan_code not in PREMIUM_PLAN_CODES:
        return False
    if family.subscription_status not in ACTIVE_SUBSCRIPTION_STATUSES:
        return False

    expires_at = family.subscription_expires_at
    if expires_at is None:
        return True
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    return expires_at > datetime.now(UTC)


def has_billing_ownership_context(family: Family) -> bool:
    return not (
        family.plan_code == "free" and family.subscription_status in NON_BILLING_CONTEXT_STATUSES
    )


def resolve_family_plan_policy(family: Family) -> FamilyPlanPolicy:
    premium_active = is_premium_active(family)
    if premium_active:
        return FamilyPlanPolicy(
            premium_active=True,
            max_children=None,
            max_adults=None,
            max_pillbox_plans=None,
            can_invite_members=True,
            can_manage_member_roles=True,
            can_use_live_activities=True,
            can_export_csv=True,
        )

    return FamilyPlanPolicy(
        premium_active=False,
        max_children=1,
        max_adults=1,
        max_pillbox_plans=1,
        can_invite_members=False,
        can_manage_member_roles=False,
        can_use_live_activities=False,
        can_export_csv=False,
    )
