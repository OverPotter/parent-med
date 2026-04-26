export function getRevenueCatIosApiKey(): string | null {
  const value = import.meta.env.VITE_REVENUECAT_IOS_API_KEY?.trim() || "";
  return value ? value : null;
}

export function isRevenueCatBackendSyncEnabled(): boolean {
  const value = import.meta.env.VITE_REVENUECAT_SYNC_BACKEND?.trim().toLowerCase() || "";
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getRevenueCatEntitlementCode(): string {
  return import.meta.env.VITE_REVENUECAT_ENTITLEMENT_CODE?.trim() || "plus";
}

export function getRevenueCatDefaultPackageIdentifier(): string | null {
  const value = import.meta.env.VITE_REVENUECAT_DEFAULT_PACKAGE_ID?.trim() || "";
  return value ? value : null;
}
