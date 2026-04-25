"""DTO for effective family subscription access."""

from typing import Literal

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase

PlanCode = Literal["free", "plus", "pro"]
SubscriptionStatus = Literal["inactive", "trialing", "active", "grace", "canceled", "expired"]


class SubscriptionAccessResponseDto(ResponseBase):
    """Effective access flags and limits for the current account."""

    plan_code: PlanCode = "free"
    subscription_status: SubscriptionStatus = "inactive"
    premium_active: bool = False
    has_plus_access: bool = False
    is_billing_owner: bool = False
    can_manage_subscription: bool = False
    can_invite_members: bool = False
    can_manage_member_roles: bool = False
    can_use_live_activities: bool = False
    can_export_csv: bool = False
    max_children: int | None = Field(default=1)
    max_adults: int | None = Field(default=1)
    max_pillbox_plans: int | None = Field(default=1)
    current_children_count: int = 0
    current_adults_count: int = 0
    current_pillbox_plan_count: int = 0
