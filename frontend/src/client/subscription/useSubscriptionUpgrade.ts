import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@shared/utils/nativeRevenueCat";
import {
  dispatchRevenueCatRefresh,
  syncRevenueCatCustomerSnapshot,
} from "@shared/utils/revenueCatSync";

async function purchaseRevenueCatPlus() {
  const entitlementCode = getRevenueCatEntitlementCode();
  const shouldSyncBackend = isRevenueCatBackendSyncEnabled();
  const offerings = await getNativeRevenueCatOfferings();
  if (!offerings || offerings.availablePackages.length === 0) {
    throw new Error("RevenueCat offerings are unavailable.");
  }

  const preferredPackageId = getRevenueCatDefaultPackageIdentifier();
  const selectedPackage =
    (preferredPackageId
      ? offerings.availablePackages.find((item) => item.identifier === preferredPackageId)
      : null) ?? offerings.availablePackages[0];
  if (!selectedPackage) {
    throw new Error("RevenueCat package selection failed.");
  }

  const snapshot = await purchaseNativeRevenueCatPackage({
    packageIdentifier: selectedPackage.identifier,
    offeringIdentifier: offerings.currentOfferingIdentifier,
    entitlementCode,
  });
  if (!snapshot) {
    throw new Error("RevenueCat purchase is unavailable on this device.");
  }
  if (shouldSyncBackend) {
    await syncRevenueCatCustomerSnapshot(snapshot);
    dispatchRevenueCatRefresh();
  }
  return snapshot;
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
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["families", accountId] }),
      queryClient.invalidateQueries({ queryKey: ["families", "me", "access", accountId] }),
      queryClient.invalidateQueries({ queryKey: ["families", "me", "access", currentFamilyId] }),
      queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
    ]);
  };

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!canManageSubscription) {
        throw new Error("Only the billing owner can manage the family subscription.");
      }
      if (canUseNativeRevenueCat) {
        return purchaseRevenueCatPlus();
      }
      if (!isDebugUpgradeEnabled) {
        throw new Error("Subscription upgrade is not configured.");
      }
      return applyBillingDebugAction({ plan_code: "plus", status: "active" });
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
      const snapshot = await restoreNativeRevenueCatPurchases(getRevenueCatEntitlementCode());
      if (!snapshot) {
        throw new Error("RevenueCat restore is unavailable on this device.");
      }
      if (isRevenueCatBackendSyncEnabled()) {
        await syncRevenueCatCustomerSnapshot(snapshot);
        dispatchRevenueCatRefresh();
      }
      return snapshot;
    },
    onSuccess: invalidateAfterUpgrade,
  });

  return {
    canUseNativeRevenueCat,
    isDebugUpgradeEnabled,
    isUpgradePending: upgradeMutation.isPending || restoreMutation.isPending,
    upgradeToPlus: () => upgradeMutation.mutateAsync(),
    restorePurchases: () => restoreMutation.mutateAsync(),
  };
}
