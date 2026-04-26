"""DTOs for billing debug and subscription state."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase
from src.application.dto.family import FamilyResponseDto
from src.application.dto.subscription_access import SubscriptionAccessResponseDto


class BillingDebugActionDto(BaseModel):
    """Debug-only billing action payload."""

    plan_code: Literal["free", "plus", "pro"] = Field(
        default="plus",
        description="Plan to activate in local debug mode",
    )
    status: Literal["active", "grace", "canceled", "expired"] = Field(
        default="active",
        description="Subscription status to emulate",
    )
    expires_at: datetime | None = Field(
        default=None,
        description="Optional explicit expiration timestamp",
    )


class BillingProviderSyncDto(BaseModel):
    """Normalized provider subscription snapshot for a family."""

    provider: Literal["revenuecat", "apple"] = Field(
        description="Billing provider that produced the snapshot",
    )
    plan_code: Literal["free", "plus", "pro"] = Field(
        description="Commercial plan resolved from the provider entitlement/product",
    )
    status: Literal["inactive", "trialing", "active", "grace", "canceled", "expired"] = Field(
        description="Normalized subscription lifecycle status",
    )
    product_id: str | None = Field(
        default=None,
        description="Provider/App Store product identifier",
    )
    provider_customer_id: str | None = Field(
        default=None,
        description="Provider customer id when available",
    )
    provider_subscription_id: str | None = Field(
        default=None,
        description="Provider subscription id when available",
    )
    entitlement_code: str | None = Field(
        default=None,
        description="Resolved provider entitlement code, such as RevenueCat entitlement",
    )
    expires_at: datetime | None = Field(
        default=None,
        description="Subscription expiration time when available",
    )
    trial_ends_at: datetime | None = Field(
        default=None,
        description="Trial end time when available",
    )
    raw_payload: dict[str, object] = Field(
        default_factory=dict,
        description="Raw provider payload snapshot for auditing/debugging",
    )


class BillingDebugResponseDto(ResponseBase):
    """Response after local billing debug action."""

    family: FamilyResponseDto
    access: SubscriptionAccessResponseDto
