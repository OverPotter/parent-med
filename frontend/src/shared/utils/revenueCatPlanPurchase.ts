import {
  getNativeRevenueCatOfferings,
  type RevenueCatOfferingPackage,
} from "./nativeRevenueCat";
import {
  getRevenueCatPackageForPlan,
  type RevenueCatPlanKey,
} from "./revenueCatOfferingSelection";

export type RevenueCatPlanPurchaseSelection = {
  offeringIdentifier: string | null;
  selectedPackage: RevenueCatOfferingPackage;
};

export async function resolveRevenueCatPlanPurchase(
  plan: RevenueCatPlanKey
): Promise<RevenueCatPlanPurchaseSelection> {
  const offerings = await getNativeRevenueCatOfferings();
  if (!offerings || offerings.availablePackages.length === 0) {
    throw new Error("RevenueCat offerings are unavailable.");
  }

  const selectedPackage = getRevenueCatPackageForPlan(offerings.availablePackages, plan);
  if (!selectedPackage) {
    throw new Error(`RevenueCat ${plan} package is unavailable in the current offering.`);
  }

  return {
    offeringIdentifier: offerings.currentOfferingIdentifier,
    selectedPackage,
  };
}
