"""Billing routes for local debug and provider sync."""

from fastapi import APIRouter, Depends

from src.api.deps import get_billing_service, get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.billing import (
    BillingDebugActionDto,
    BillingDebugResponseDto,
    BillingProviderSyncDto,
)
from src.application.services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/debug/apply", response_model=BillingDebugResponseDto)
async def apply_billing_debug_action(
    dto: BillingDebugActionDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: BillingService = Depends(get_billing_service),
) -> BillingDebugResponseDto:
    """Apply a local-only billing subscription state for the current family."""
    return await service.apply_debug_subscription_action(account, dto)


@router.post("/debug/reset-free", response_model=BillingDebugResponseDto)
async def reset_billing_debug_to_free(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: BillingService = Depends(get_billing_service),
) -> BillingDebugResponseDto:
    """Reset current family to free plan in local development."""
    return await service.reset_debug_subscription_to_free(account)


@router.post("/provider-sync", response_model=BillingDebugResponseDto)
async def sync_billing_provider_snapshot(
    dto: BillingProviderSyncDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: BillingService = Depends(get_billing_service),
) -> BillingDebugResponseDto:
    """Apply a normalized provider snapshot to current family billing state."""
    return await service.sync_provider_subscription(account, dto)
