import {
  getRevenueCatDefaultPackageIdentifier,
} from "../../../shared/config/mobileRuntimeConfig";
import {
  getNativeRevenueCatCurrentOffering,
  getNativeRevenueCatTrialEligibility,
  getRevenueCatPackageForPlan,
  isRevenueCatIntroEligible,
  isRevenueCatPackageMatchingPlan,
} from "../../../shared/billing/nativeRevenueCat";
import type {
  IntroEligibility,
  PurchasesIntroPrice,
  PurchasesPackage,
} from "react-native-purchases";
import type { RevenueCatPaywallPlanKey } from "./useRevenueCatPaywallController";

export type RevenueCatPlanTrialDetails = {
  introPrice: PurchasesIntroPrice | null;
  eligibility: IntroEligibility | null;
  hasFreeTrial: boolean;
};

export type RevenueCatPaywallOfferingData = {
  selectedPlan: RevenueCatPaywallPlanKey;
  packagesByPlan: Record<RevenueCatPaywallPlanKey, PurchasesPackage | null>;
  priceByPlan: Record<RevenueCatPaywallPlanKey, string | null>;
  trialDetailsByPlan: Record<RevenueCatPaywallPlanKey, RevenueCatPlanTrialDetails>;
  logDetails: {
    offeringIdentifier: string;
    packageIds: string[];
    annualProductId: string | null;
    monthlyProductId: string | null;
  };
};

function buildTrialDetails(
  aPackage: PurchasesPackage | null,
  eligibilities: Record<string, IntroEligibility>,
): RevenueCatPlanTrialDetails {
  const eligibility =
    (aPackage ? eligibilities[aPackage.product.identifier] : null) ?? null;
  const introPrice = aPackage?.product.introPrice ?? null;

  return {
    introPrice,
    eligibility,
    hasFreeTrial:
      Boolean(introPrice) &&
      introPrice?.price === 0 &&
      isRevenueCatIntroEligible(eligibility),
  };
}

export async function loadRevenueCatPaywallOffering(): Promise<RevenueCatPaywallOfferingData | null> {
  const offering = await getNativeRevenueCatCurrentOffering();
  if (!offering) {
    return null;
  }

  const preferredPackageIdentifier =
    getRevenueCatDefaultPackageIdentifier()?.trim() || null;
  const preferredPackage =
    offering.availablePackages.find(
      (item) => item.identifier === preferredPackageIdentifier,
    ) ?? null;
  const annualPackage = getRevenueCatPackageForPlan(offering, "annual");
  const monthlyPackage = getRevenueCatPackageForPlan(offering, "monthly");
  const eligibilities = await getNativeRevenueCatTrialEligibility(
    [annualPackage?.product.identifier, monthlyPackage?.product.identifier].filter(
      (item): item is string => Boolean(item),
    ),
  );

  const preferredPlan =
    preferredPackage &&
    isRevenueCatPackageMatchingPlan(preferredPackage, "monthly")
      ? "monthly"
      : preferredPackage &&
          isRevenueCatPackageMatchingPlan(preferredPackage, "annual")
        ? "annual"
        : null;
  const selectedPlan =
    preferredPlan === "monthly" && monthlyPackage
      ? "monthly"
      : annualPackage
        ? "annual"
        : monthlyPackage
          ? "monthly"
          : "annual";

  return {
    selectedPlan,
    packagesByPlan: {
      annual: annualPackage,
      monthly: monthlyPackage,
    },
    priceByPlan: {
      annual: annualPackage?.product.priceString ?? null,
      monthly: monthlyPackage?.product.priceString ?? null,
    },
    trialDetailsByPlan: {
      annual: buildTrialDetails(annualPackage, eligibilities),
      monthly: buildTrialDetails(monthlyPackage, eligibilities),
    },
    logDetails: {
      offeringIdentifier: offering.identifier,
      packageIds: offering.availablePackages.map((item) => item.identifier),
      annualProductId: annualPackage?.product.identifier ?? null,
      monthlyProductId: monthlyPackage?.product.identifier ?? null,
    },
  };
}
