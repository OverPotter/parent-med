import { useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  resetBillingDebugToFree,
  type MobileBillingDebugResult,
} from "../api/settingsApi";
import {
  getRevenueCatEntitlementCode,
  getRevenueCatIosApiKey,
  isRevenueCatBackendSyncEnabled,
} from "../../../shared/config/mobileRuntimeConfig";
import {
  ensureRevenueCatConfigured,
  getNativeRevenueCatCurrentOffering,
  getNativeRevenueCatCustomerSnapshot,
  getRevenueCatPackageForPlan,
  purchaseNativeRevenueCatPackage,
  restoreNativeRevenueCatPurchases,
  type RevenueCatCustomerSnapshot,
} from "../../../shared/billing/nativeRevenueCat";
import { syncRevenueCatCustomerSnapshot } from "../../../shared/billing/revenueCatSync";

type RevenueCatDebugCopy = {
  apiKeyMissing: string;
  accountMissing: string;
  packageMissing: string;
};

export type RevenueCatDebugResult = {
  label: string;
  details:
    | RevenueCatCustomerSnapshot
    | MobileBillingDebugResult
    | Record<string, unknown>;
};

type UseRevenueCatDebugControllerArgs = {
  session: MobileAuthSession | null;
  copy: RevenueCatDebugCopy;
  onBillingChanged?: () => Promise<void> | void;
};

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown RevenueCat error";
}

export function serializeRevenueCatDebugResult(
  result: RevenueCatDebugResult | null,
) {
  if (!result) {
    return "";
  }

  return JSON.stringify(result, null, 2);
}

export function useRevenueCatDebugController({
  session,
  copy,
  onBillingChanged,
}: UseRevenueCatDebugControllerArgs) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<RevenueCatDebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = getRevenueCatIosApiKey();
  const entitlementCode = getRevenueCatEntitlementCode();
  const backendSyncEnabled = isRevenueCatBackendSyncEnabled();

  const ensureConfigured = async () => {
    if (!apiKey) {
      throw new Error(copy.apiKeyMissing);
    }
    if (!session?.account.id) {
      throw new Error(copy.accountMissing);
    }

    await ensureRevenueCatConfigured({
      apiKey,
      appUserId: session.account.id,
    });
  };

  const refreshBillingState = async (
    snapshot: RevenueCatCustomerSnapshot | null,
  ) => {
    if (snapshot && session?.accessToken && backendSyncEnabled) {
      await syncRevenueCatCustomerSnapshot(session.accessToken, snapshot);
    }

    await onBillingChanged?.();
  };

  const runAction = async (
    label: string,
    action: () => Promise<
      RevenueCatCustomerSnapshot | MobileBillingDebugResult | Record<string, unknown>
    >,
  ) => {
    setIsPending(true);
    setError(null);

    try {
      const details = await action();
      setResult({
        label,
        details,
      });
    } catch (nextError) {
      setError(formatError(nextError));
    } finally {
      setIsPending(false);
    }
  };

  const purchasePlan = async (plan: "monthly" | "annual") => {
    await ensureConfigured();
    const offering = await getNativeRevenueCatCurrentOffering();
    if (!offering) {
      throw new Error("RevenueCat current offering is unavailable.");
    }

    const selectedPackage = getRevenueCatPackageForPlan(offering, plan);
    if (!selectedPackage) {
      throw new Error(copy.packageMissing);
    }

    const purchaseResult = await purchaseNativeRevenueCatPackage({
      aPackage: selectedPackage,
      entitlementCode,
    });

    if (!purchaseResult || purchaseResult.outcome === "cancelled") {
      return {
        outcome: "cancelled",
        plan,
        packageIdentifier: selectedPackage.identifier,
      };
    }

    await refreshBillingState(purchaseResult.customerSnapshot);

    return {
      outcome: purchaseResult.outcome,
      plan,
      packageIdentifier: selectedPackage.identifier,
      productIdentifier: selectedPackage.product.identifier,
      customerSnapshot: purchaseResult.customerSnapshot,
    };
  };

  return {
    apiKey,
    entitlementCode,
    backendSyncEnabled,
    error,
    isPending,
    result,
    runAction,
    ensureConfigured,
    refreshBillingState,
    purchasePlan,
    resetToFree: async () => {
      if (!session?.accessToken) {
        throw new Error(copy.accountMissing);
      }
      const response = await resetBillingDebugToFree({
        accessToken: session.accessToken,
      });
      await onBillingChanged?.();
      return response;
    },
    loadOfferings: async () => {
      await ensureConfigured();
      const offering = await getNativeRevenueCatCurrentOffering();
      return {
        currentOfferingIdentifier: offering?.identifier ?? null,
        availablePackages:
          offering?.availablePackages.map((item) => ({
            identifier: item.identifier,
            packageType: String(item.packageType),
            productIdentifier: item.product.identifier,
            price: item.product.priceString,
            pricePerMonth: item.product.pricePerMonthString ?? null,
          })) ?? [],
      };
    },
    restore: async () => {
      await ensureConfigured();
      const snapshot = await restoreNativeRevenueCatPurchases(entitlementCode);
      await refreshBillingState(snapshot);
      if (!snapshot?.entitlementActive) {
        throw new Error("No active purchases were found to restore.");
      }
      return snapshot;
    },
    snapshot: async () => {
      await ensureConfigured();
      return (
        (await getNativeRevenueCatCustomerSnapshot(entitlementCode)) ?? {
          configured: false,
        }
      );
    },
  };
}
