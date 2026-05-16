import type { MobileAuthSession } from "../../features/auth/api/authApi";
import {
  getRevenueCatIosApiKey,
  isRevenueCatBackendSyncEnabled,
} from "../config/mobileRuntimeConfig";
import {
  ensureRevenueCatConfigured,
  getNativeRevenueCatCustomerSnapshot,
  isNativeRevenueCatSupported,
} from "./nativeRevenueCat";
import { syncRevenueCatCustomerSnapshot } from "./revenueCatSync";

export async function syncRevenueCatSessionState(
  session: Pick<MobileAuthSession, "accessToken" | "account"> | null,
) {
  console.log("[RevenueCatSync] sync start", {
    hasSession: Boolean(session),
    accountId: session?.account.id ?? null,
    hasAccessToken: Boolean(session?.accessToken),
  });

  if (!isNativeRevenueCatSupported()) {
    console.log("[RevenueCatSync] unsupported platform");
    return null;
  }

  const apiKey = getRevenueCatIosApiKey();
  if (!apiKey) {
    console.warn("[RevenueCatSync] missing api key");
    return null;
  }

  await ensureRevenueCatConfigured({
    apiKey,
    appUserId: session?.account.id ?? null,
  });

  if (!session?.account.id || !session.accessToken || !isRevenueCatBackendSyncEnabled()) {
    console.log("[RevenueCatSync] skip backend sync", {
      hasAccountId: Boolean(session?.account.id),
      hasAccessToken: Boolean(session?.accessToken),
      backendSyncEnabled: isRevenueCatBackendSyncEnabled(),
    });
    return null;
  }

  const snapshot = await getNativeRevenueCatCustomerSnapshot();
  if (!snapshot) {
    console.warn("[RevenueCatSync] snapshot unavailable");
    return null;
  }

  console.log("[RevenueCatSync] snapshot ready", {
    entitlementCode: snapshot.entitlementCode,
    entitlementActive: snapshot.entitlementActive,
    status: snapshot.status,
    productId: snapshot.productId,
    expirationDate: snapshot.expirationDate,
  });

  await syncRevenueCatCustomerSnapshot(session.accessToken, snapshot);
  console.log("[RevenueCatSync] backend sync complete");
  return snapshot;
}
