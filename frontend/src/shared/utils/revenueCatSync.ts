import { syncBillingProviderSnapshot } from "@shared/api/billing";
import type { RevenueCatCustomerSnapshot } from "./nativeRevenueCat";
import { buildRevenueCatProviderSyncPayload } from "./revenueCatPayload";
import { getRevenueCatEntitlementCode } from "@shared/config/revenueCat";

export async function syncRevenueCatCustomerSnapshot(snapshot: RevenueCatCustomerSnapshot) {
  const payload = buildRevenueCatProviderSyncPayload(snapshot, getRevenueCatEntitlementCode());
  return syncBillingProviderSnapshot(payload);
}

export function dispatchRevenueCatRefresh() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event("billing:refresh"));
}
