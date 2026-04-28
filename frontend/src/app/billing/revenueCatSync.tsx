import { useEffect, useRef } from "react";
import { useAppStore } from "@shared/store/useAppStore";
import { appLog } from "@shared/utils/appLog";
import {
  getRevenueCatEntitlementCode,
  getRevenueCatIosApiKey,
  isRevenueCatBackendSyncEnabled,
} from "@shared/config/revenueCat";
import {
  configureNativeRevenueCat,
  getNativeRevenueCatCustomerSnapshot,
  isNativeRevenueCatSupported,
  logInNativeRevenueCat,
  logOutNativeRevenueCat,
  setNativeRevenueCatLogLevel,
} from "@shared/utils/nativeRevenueCat";
import { syncRevenueCatCustomerSnapshot } from "@shared/utils/revenueCatSync";
import { isRevenueCatSyncSuppressedForAccount } from "@shared/utils/revenueCatSyncSuppression";

export function RevenueCatSync() {
  const accountId = useAppStore((s) => s.accountId);
  const configuredRef = useRef(false);
  const lastLoggedInAccountRef = useRef<string | null>(null);
  const shouldSyncBackend = isRevenueCatBackendSyncEnabled();

  useEffect(() => {
    if (!isNativeRevenueCatSupported()) {
      return;
    }

    const apiKey = getRevenueCatIosApiKey();
    if (!apiKey) {
      return;
    }

    const entitlementCode = getRevenueCatEntitlementCode();
    let cancelled = false;

    const syncCurrentSnapshot = async () => {
      if (!accountId) {
        return;
      }
      if (isRevenueCatSyncSuppressedForAccount(accountId)) {
        return;
      }
      const snapshot = await getNativeRevenueCatCustomerSnapshot(entitlementCode);
      if (!snapshot || cancelled) {
        return;
      }
      if (!shouldSyncBackend) {
        return;
      }
      await syncRevenueCatCustomerSnapshot(snapshot);
    };

    const bootstrap = async () => {
      try {
        if (import.meta.env.DEV) {
          await setNativeRevenueCatLogLevel("debug");
        }

        if (!configuredRef.current) {
          await configureNativeRevenueCat({
            apiKey,
            appUserId: accountId,
            entitlementCode,
          });
          configuredRef.current = true;
          lastLoggedInAccountRef.current = accountId;
          await syncCurrentSnapshot();
          return;
        }

        if (accountId && lastLoggedInAccountRef.current !== accountId) {
          if (isRevenueCatSyncSuppressedForAccount(accountId)) {
            lastLoggedInAccountRef.current = accountId;
            return;
          }
          const snapshot = await logInNativeRevenueCat(accountId);
          lastLoggedInAccountRef.current = accountId;
          if (snapshot && !cancelled && shouldSyncBackend) {
            await syncRevenueCatCustomerSnapshot(snapshot);
          }
          return;
        }

        if (!accountId && lastLoggedInAccountRef.current) {
          await logOutNativeRevenueCat();
          lastLoggedInAccountRef.current = null;
          return;
        }

        await syncCurrentSnapshot();
      } catch (error) {
        appLog.warn("RevenueCat sync bootstrap failed", error);
      }
    };

    void bootstrap();

    const handleRefresh = () => {
      void syncCurrentSnapshot().catch((error) => {
        appLog.warn("RevenueCat refresh sync failed", error);
      });
    };

    window.addEventListener("billing:refresh", handleRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("billing:refresh", handleRefresh);
    };
  }, [accountId, shouldSyncBackend]);

  return null;
}
