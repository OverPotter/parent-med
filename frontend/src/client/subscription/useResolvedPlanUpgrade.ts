import { useState } from "react";
import { resolveRevenueCatPlanPurchase } from "@shared/utils/revenueCatPlanPurchase";
import type { RevenueCatPurchaseResult } from "@shared/utils/nativeRevenueCat";
import type { RevenueCatPlanKey } from "@shared/utils/revenueCatOfferingSelection";

export function useResolvedPlanUpgrade({
  onUpgrade,
  onPurchased,
}: {
  onUpgrade: (preferredPackageIdentifier?: string | null) => Promise<unknown> | void;
  onPurchased?: () => void;
}) {
  const [isLocalPurchasePending, setIsLocalPurchasePending] = useState(false);

  const handlePlanUpgrade = async (plan: RevenueCatPlanKey) => {
    setIsLocalPurchasePending(true);
    try {
      const { selectedPackage } = await resolveRevenueCatPlanPurchase(plan);
      const result = (await onUpgrade(
        selectedPackage.identifier
      )) as RevenueCatPurchaseResult | null;
      if (result?.outcome === "purchased") {
        onPurchased?.();
      }
    } finally {
      setIsLocalPurchasePending(false);
    }
  };

  return {
    isLocalPurchasePending,
    handlePlanUpgrade,
  };
}
