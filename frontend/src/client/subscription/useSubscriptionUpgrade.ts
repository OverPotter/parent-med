import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { applyBillingDebugAction } from "@shared/api/billing";
import {
  getRevenueCatDefaultPackageIdentifier,
  getRevenueCatEntitlementCode,
  getRevenueCatIosApiKey,
  isRevenueCatBackendSyncEnabled,
} from "@shared/config/revenueCat";
import {
  getNativeRevenueCatOfferings,
  isNativeRevenueCatSupported,
  purchaseNativeRevenueCatPackage,
  restoreNativeRevenueCatPurchases,
  type RevenueCatCustomerSnapshot,
  type RevenueCatPurchaseResult,
} from "@shared/utils/nativeRevenueCat";
import { syncRevenueCatCustomerSnapshot } from "@shared/utils/revenueCatSync";
import { clearRevenueCatSyncSuppressionForAccount } from "@shared/utils/revenueCatSyncSuppression";
import { invalidateSubscriptionQueries } from "./invalidateSubscriptionQueries";

function getMutationErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    (error as { code?: string }).code === "PURCHASE_CANCELED"
  ) {
    return null;
  }
  if (error instanceof Error && /purchase canceled|purchase cancelled/i.test(error.message)) {
    return null;
  }
  if (isAxiosError(error)) {
    const data =
      typeof error.response?.data === "object" && error.response?.data
        ? (error.response.data as { detail?: string })
        : null;
    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return null;
}

async function purchaseRevenueCatPlus(
  accountId: string | null,
  preferredPackageIdentifier?: string | null
) {
  const entitlementCode = getRevenueCatEntitlementCode();
  const shouldSyncBackend = isRevenueCatBackendSyncEnabled();
  clearRevenueCatSyncSuppressionForAccount(accountId);
  const offerings = await getNativeRevenueCatOfferings();
  if (!offerings || offerings.availablePackages.length === 0) {
    throw new Error("RevenueCat offerings are unavailable.");
  }

  const preferredPackageId =
    preferredPackageIdentifier?.trim() || getRevenueCatDefaultPackageIdentifier();
  const selectedPackage =
    (preferredPackageId
      ? offerings.availablePackages.find((item) => item.identifier === preferredPackageId)
      : null) ?? offerings.availablePackages[0];
  if (!selectedPackage) {
    throw new Error("RevenueCat package selection failed.");
  }

  const purchaseResult = await purchaseNativeRevenueCatPackage({
    packageIdentifier: selectedPackage.identifier,
    offeringIdentifier: offerings.currentOfferingIdentifier,
    entitlementCode,
  });
  if (!purchaseResult) {
    throw new Error("RevenueCat purchase is unavailable on this device.");
  }
  if (shouldSyncBackend && purchaseResult.customerSnapshot) {
    await syncRevenueCatCustomerSnapshot(purchaseResult.customerSnapshot);
  }
  return purchaseResult;
}

export function useSubscriptionUpgrade(
  accountId: string | null,
  currentFamilyId: string | null,
  canManageSubscription = false
) {
  const queryClient = useQueryClient();
  const isDebugUpgradeEnabled = import.meta.env.DEV || import.meta.env.MODE === "mobile-dev";
  const hasNativeRevenueCatConfig = Boolean(getRevenueCatIosApiKey());
  const canUseNativeRevenueCat = isNativeRevenueCatSupported() && hasNativeRevenueCatConfig;

  const invalidateAfterUpgrade = async () => {
    await invalidateSubscriptionQueries(queryClient, {
      accountId,
      currentFamilyId,
    });
  };

  const upgradeMutation = useMutation({
    mutationFn: async (preferredPackageIdentifier?: string | null) => {
      if (!canManageSubscription) {
        throw new Error("Only the billing owner can manage the family subscription.");
      }
      if (canUseNativeRevenueCat) {
        return purchaseRevenueCatPlus(accountId, preferredPackageIdentifier);
      }
      if (!isDebugUpgradeEnabled) {
        throw new Error("Subscription upgrade is not configured.");
      }
      await applyBillingDebugAction({ plan_code: "plus", status: "active" });
      return { outcome: "purchased", customerSnapshot: null } satisfies RevenueCatPurchaseResult;
    },
    onSuccess: invalidateAfterUpgrade,
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!canManageSubscription) {
        throw new Error("Only the billing owner can manage the family subscription.");
      }
      if (!canUseNativeRevenueCat) {
        return null;
      }
      clearRevenueCatSyncSuppressionForAccount(accountId);
      const snapshot = await restoreNativeRevenueCatPurchases(getRevenueCatEntitlementCode());
      if (!snapshot) {
        throw new Error("RevenueCat restore is unavailable on this device.");
      }
      if (isRevenueCatBackendSyncEnabled()) {
        await syncRevenueCatCustomerSnapshot(snapshot);
      }
      return snapshot;
    },
    onSuccess: invalidateAfterUpgrade,
  });

  const restoreSnapshot = restoreMutation.data as RevenueCatCustomerSnapshot | null | undefined;
  const restoreOutcome =
    restoreSnapshot === undefined
      ? null
      : restoreSnapshot === null
        ? null
        : restoreSnapshot.entitlementActive
        ? ("restored_active" as const)
        : ("restored_inactive" as const);

  return {
    canUseNativeRevenueCat,
    isDebugUpgradeEnabled,
    isUpgradePending: upgradeMutation.isPending || restoreMutation.isPending,
    restoreOutcome,
    upgradeErrorMessage:
      getMutationErrorMessage(upgradeMutation.error) ??
      getMutationErrorMessage(restoreMutation.error),
    clearUpgradeError: () => {
      upgradeMutation.reset();
      restoreMutation.reset();
    },
    upgradeToPlus: (preferredPackageIdentifier?: string | null) =>
      upgradeMutation.mutateAsync(preferredPackageIdentifier),
    restorePurchases: () => restoreMutation.mutateAsync(),
  };
}
