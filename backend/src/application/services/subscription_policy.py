"""Pure subscription policy helpers shared across services."""

from dataclasses import dataclass

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


def is_premium_active(family: Family) -> bool:
    return (
        family.plan_code in PREMIUM_PLAN_CODES
        and family.subscription_status in ACTIVE_SUBSCRIPTION_STATUSES
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
