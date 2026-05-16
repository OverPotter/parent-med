import {
  getMobileApiBaseUrl,
  getRevenueCatEntitlementCode,
  isRevenueCatBackendSyncEnabled,
} from "../config/mobileRuntimeConfig";
import { buildRevenueCatProviderSyncPayload } from "./revenueCatPayload";
import type { RevenueCatCustomerSnapshot } from "./nativeRevenueCat";

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

  return response.json().catch(() => null);
}
