import {
  getMobileApiBaseUrl,
  getRevenueCatEntitlementCode,
  isRevenueCatBackendSyncEnabled,
} from "../config/mobileRuntimeConfig";
import {
  patchCachedSettingsBundle,
  type SettingsBundle,
} from "../../features/settings/model/settingsScreenLogic";
import { buildRevenueCatProviderSyncPayload } from "./revenueCatPayload";
import type { RevenueCatCustomerSnapshot } from "./nativeRevenueCat";

type RevenueCatProviderSyncResponse = {
  family?: {
    id: string;
    name: string;
    owner_account_id?: string | null;
    plan_code?: "free" | "plus" | "pro" | null;
    subscription_status?:
      | "inactive"
      | "trialing"
      | "active"
      | "grace"
      | "canceled"
      | "expired"
      | null;
    subscription_expires_at?: string | null;
    premium_active?: boolean | null;
  } | null;
  access?: {
    plan_code?: "free" | "plus" | "pro" | null;
    subscription_status?:
      | "inactive"
      | "trialing"
      | "active"
      | "grace"
      | "canceled"
      | "expired"
      | null;
    premium_active?: boolean | null;
    can_manage_subscription?: boolean | null;
    can_use_live_activities?: boolean | null;
    current_children_count?: number | null;
    current_adults_count?: number | null;
    current_pillbox_plan_count?: number | null;
  } | null;
};

function patchSettingsCacheFromProviderSync(
  accessToken: string | null,
  payload: RevenueCatProviderSyncResponse | null,
) {
  if (!accessToken || !payload?.family || !payload.access) {
    return;
  }

  patchCachedSettingsBundle(accessToken, {
    familySummary: {
      id: payload.family.id,
      name: payload.family.name,
      ownerAccountId: payload.family.owner_account_id ?? null,
      planCode: payload.family.plan_code ?? "free",
      subscriptionStatus: payload.family.subscription_status ?? "inactive",
      subscriptionExpiresAt: payload.family.subscription_expires_at ?? null,
      premiumActive: Boolean(payload.family.premium_active),
    },
    familyAccess: {
      planCode: payload.access.plan_code ?? "free",
      subscriptionStatus: payload.access.subscription_status ?? "inactive",
      premiumActive: Boolean(payload.access.premium_active),
      canManageSubscription: Boolean(payload.access.can_manage_subscription),
      canUseLiveActivities: Boolean(payload.access.can_use_live_activities),
      currentChildrenCount: payload.access.current_children_count ?? 0,
      currentAdultsCount: payload.access.current_adults_count ?? 0,
      currentPillboxPlanCount: payload.access.current_pillbox_plan_count ?? 0,
    },
  } satisfies Partial<SettingsBundle>);
}

export async function syncRevenueCatCustomerSnapshot(
  accessToken: string | null,
  snapshot: RevenueCatCustomerSnapshot,
) {
  if (!accessToken || !isRevenueCatBackendSyncEnabled()) {
    return null;
  }

  const response = await fetch(`${getMobileApiBaseUrl()}/billing/provider-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(
      buildRevenueCatProviderSyncPayload(
        snapshot,
        getRevenueCatEntitlementCode(),
      ),
    ),
  });

  if (!response.ok) {
    throw new Error("RevenueCat backend sync failed.");
  }

  const payload = (await response.json().catch(() => null)) as
    | RevenueCatProviderSyncResponse
    | null;
  patchSettingsCacheFromProviderSync(accessToken, payload);
  return payload;
}
