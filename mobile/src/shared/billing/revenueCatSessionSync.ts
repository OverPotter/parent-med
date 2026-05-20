import type { MobileAuthSession } from "../../features/auth/api/authApi";
import {
  getRevenueCatEntitlementCode,
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
  if (!isNativeRevenueCatSupported()) {
    return null;
  }

  const apiKey = getRevenueCatIosApiKey();
  if (!apiKey) {
    return null;
  }

  await ensureRevenueCatConfigured({
    apiKey,
    appUserId: session?.account.id ?? null,
  });

  if (!session?.account.id || !session.accessToken || !isRevenueCatBackendSyncEnabled()) {
    return null;
  }

  const snapshot = await getNativeRevenueCatCustomerSnapshot(
    getRevenueCatEntitlementCode(),
  );
  if (!snapshot) {
    return null;
  }

  await syncRevenueCatCustomerSnapshot(session.accessToken, snapshot);
  return snapshot;
}
