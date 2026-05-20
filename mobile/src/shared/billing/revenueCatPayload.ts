import type { RevenueCatCustomerSnapshot } from "./nativeRevenueCat";

export type BillingProviderSyncPayload = {
  provider: "revenuecat";
  plan_code: "free" | "plus" | "pro";
  status: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";
  product_id?: string | null;
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  entitlement_code?: string | null;
  expires_at?: string | null;
  raw_payload?: Record<string, unknown>;
};

export function buildRevenueCatProviderSyncPayload(
  snapshot: RevenueCatCustomerSnapshot,
  fallbackEntitlementCode = "plus",
): BillingProviderSyncPayload {
  const entitlementCode = snapshot.entitlementCode || fallbackEntitlementCode;
  const activePlanCode = entitlementCode === "pro" ? "pro" : "plus";

  return {
    provider: "revenuecat",
    plan_code: snapshot.entitlementActive ? activePlanCode : "free",
    status: snapshot.entitlementActive ? snapshot.status : "inactive",
    product_id: snapshot.productId,
    provider_customer_id: snapshot.providerCustomerId,
    provider_subscription_id: snapshot.providerSubscriptionId,
    entitlement_code: entitlementCode,
    expires_at: snapshot.expirationDate,
    raw_payload: {
      app_user_id: snapshot.appUserId,
      original_app_user_id: snapshot.originalAppUserId,
      status: snapshot.status,
      entitlement_active: snapshot.entitlementActive,
      latest_purchase_date: snapshot.latestPurchaseDate,
      original_purchase_date: snapshot.originalPurchaseDate,
      will_renew: snapshot.willRenew,
      is_sandbox: snapshot.isSandbox,
      ownership_type: snapshot.ownershipType,
      customer_snapshot: snapshot.rawPayload ?? null,
    },
  };
}
