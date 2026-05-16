import Constants from "expo-constants";

const PROD_API_ORIGIN = "https://parent-med-production.up.railway.app";
const DEV_API_ORIGIN = "http://localhost:8000";
const APPLE_APP_STORE_URL_PREFIX = "https://apps.apple.com/app/id";

type MobileConfigKey =
  | "API_URL"
  | "APP_SITE_URL"
  | "PRIVACY_POLICY_URL"
  | "TERMS_OF_USE_URL"
  | "SUPPORT_URL"
  | "SUPPORT_EMAIL"
  | "MARKETING_SITE_URL"
  | "APP_STORE_URL"
  | "APP_STORE_ID"
  | "REVENUECAT_IOS_API_KEY"
  | "REVENUECAT_SYNC_BACKEND"
  | "REVENUECAT_ENTITLEMENT_CODE"
  | "REVENUECAT_DEFAULT_PACKAGE_ID";

type MobilePublicEnv = Partial<Record<MobileConfigKey, string>>;

let lastLoggedRevenueCatConfigSignature: string | null = null;

function readExtraPublicEnv(): MobilePublicEnv {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== "object" || !("publicEnv" in extra)) {
    return {};
  }

  const publicEnv = extra.publicEnv;
  return publicEnv && typeof publicEnv === "object"
    ? (publicEnv as MobilePublicEnv)
    : {};
}

function readAppEnvProfile() {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== "object" || !("appEnvProfile" in extra)) {
    return null;
  }

  const profile = extra.appEnvProfile;
  return typeof profile === "string" && profile.trim() ? profile.trim() : null;
}

function readProcessEnvValue(key: MobileConfigKey): string {
  const env = process.env as Record<string, string | undefined>;
  return env[`EXPO_PUBLIC_${key}`]?.trim() || env[`VITE_${key}`]?.trim() || "";
}

export function readMobileConfigValue(key: MobileConfigKey): string {
  const extraValue = readExtraPublicEnv()[key];
  if (typeof extraValue === "string" && extraValue.trim()) {
    return extraValue.trim();
  }

  return readProcessEnvValue(key);
}

export function normalizeMobileApiOrigin(raw: string | undefined) {
  const value = raw?.trim().replace(/\/+$/, "") ?? "";

  if (!value) {
    return __DEV__ ? DEV_API_ORIGIN : PROD_API_ORIGIN;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function getMobileApiBaseUrl() {
  return `${normalizeMobileApiOrigin(readMobileConfigValue("API_URL"))}/api/v1`;
}

function normalizeAppStoreId(rawId: string | null | undefined): string {
  const candidate = rawId?.trim() ?? "";
  return /^\d+$/.test(candidate) ? candidate : "";
}

export function buildMobileAppStoreUrlFromId(appStoreId: string | null | undefined): string {
  const normalizedId = normalizeAppStoreId(appStoreId);
  return normalizedId ? `${APPLE_APP_STORE_URL_PREFIX}${normalizedId}` : "";
}

export function getMobileAppStoreUrl() {
  const configured = readMobileConfigValue("APP_STORE_URL");
  if (/^https?:\/\//i.test(configured)) {
    return configured;
  }

  return buildMobileAppStoreUrlFromId(readMobileConfigValue("APP_STORE_ID"));
}

export function getMobilePrivacyPolicyUrl(): string | null {
  const value = readMobileConfigValue("PRIVACY_POLICY_URL");
  return /^https?:\/\//i.test(value) ? value : null;
}

export function getMobileTermsOfUseUrl(): string | null {
  const value = readMobileConfigValue("TERMS_OF_USE_URL");
  return /^https?:\/\//i.test(value) ? value : null;
}

export function getRevenueCatIosApiKey(): string | null {
  const value = readMobileConfigValue("REVENUECAT_IOS_API_KEY");
  const keyPrefix = value ? value.slice(0, 5) : null;
  const appEnvProfile = readAppEnvProfile();
  const entitlementCode =
    readMobileConfigValue("REVENUECAT_ENTITLEMENT_CODE") || "plus";
  const defaultPackageId =
    readMobileConfigValue("REVENUECAT_DEFAULT_PACKAGE_ID") || null;
  const signature = JSON.stringify({
    appEnvProfile,
    hasKey: Boolean(value),
    keyPrefix,
    entitlementCode,
    defaultPackageId,
  });

  if (__DEV__ && lastLoggedRevenueCatConfigSignature !== signature) {
    lastLoggedRevenueCatConfigSignature = signature;
    console.log("[mobile/config] RevenueCat key lookup", {
      appEnvProfile,
      hasKey: Boolean(value),
      keyPrefix,
      entitlementCode,
      defaultPackageId,
    });
  }

  return value || null;
}

export function isRevenueCatBackendSyncEnabled(): boolean {
  const value = readMobileConfigValue("REVENUECAT_SYNC_BACKEND").toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getRevenueCatEntitlementCode(): string {
  return readMobileConfigValue("REVENUECAT_ENTITLEMENT_CODE") || "plus";
}

export function getRevenueCatDefaultPackageIdentifier(): string | null {
  const value = readMobileConfigValue("REVENUECAT_DEFAULT_PACKAGE_ID");
  return value || null;
}
