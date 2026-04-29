import type { RevenueCatOfferingPackage } from "./nativeRevenueCat";

export type RevenueCatPlanKey = "monthly" | "annual";

function normalizePackageType(packageType: string | null | undefined) {
  return (packageType ?? "").trim().toLowerCase();
}

function getPlanAliases(plan: RevenueCatPlanKey) {
  if (plan === "annual") {
    return new Set(["annual", "$rc_annual", "yearly", "$rc_yearly"]);
  }
  return new Set(["monthly", "$rc_monthly", "month", "$rc_month"]);
}

export function getRevenueCatPackageForPlan(
  availablePackages: RevenueCatOfferingPackage[],
  plan: RevenueCatPlanKey
) {
  const aliases = getPlanAliases(plan);
  const byType = availablePackages.find((item) =>
    aliases.has(normalizePackageType(item.packageType))
  );
  if (byType) {
    return byType;
  }

  const byIdentifier = availablePackages.find((item) => {
    const haystack = `${item.identifier} ${item.productIdentifier} ${item.title}`.toLowerCase();
    return plan === "annual"
      ? haystack.includes("annual") || haystack.includes("year")
      : haystack.includes("monthly") || haystack.includes("month");
  });
  if (byIdentifier) {
    return byIdentifier;
  }

  return null;
}
