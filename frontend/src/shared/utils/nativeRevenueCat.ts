import { Capacitor, registerPlugin } from "@capacitor/core";

export type RevenueCatSnapshotStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "grace"
  | "canceled"
  | "expired";

export type RevenueCatCustomerSnapshot = {
  configured: boolean;
  appUserId: string | null;
  originalAppUserId: string | null;
  entitlementCode: string | null;
  entitlementActive: boolean;
  status: RevenueCatSnapshotStatus;
  productId: string | null;
  latestPurchaseDate: string | null;
  originalPurchaseDate: string | null;
  expirationDate: string | null;
  willRenew: boolean;
  isSandbox: boolean;
  ownershipType: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  rawPayload?: Record<string, unknown>;
};

export type RevenueCatOfferingPackage = {
  identifier: string;
  packageType: string;
  productIdentifier: string;
  title: string;
  priceString: string;
};

type NativeRevenueCatPlugin = {
  setLogLevel(args: { level: "debug" | "info" | "warn" | "error" }): Promise<void>;
  configure(args: {
    apiKey: string;
    appUserId?: string | null;
    entitlementCode?: string | null;
  }): Promise<void>;
  logIn(args: { appUserId: string }): Promise<{ customerSnapshot: RevenueCatCustomerSnapshot }>;
  logOut(): Promise<{ customerSnapshot: RevenueCatCustomerSnapshot }>;
  getCustomerSnapshot(args?: {
    entitlementCode?: string | null;
  }): Promise<{ customerSnapshot: RevenueCatCustomerSnapshot }>;
  getOfferings(): Promise<{
    currentOfferingIdentifier: string | null;
    availablePackages: RevenueCatOfferingPackage[];
  }>;
  purchasePackage(args: {
    packageIdentifier: string;
    offeringIdentifier?: string | null;
    entitlementCode?: string | null;
  }): Promise<{ customerSnapshot: RevenueCatCustomerSnapshot }>;
  restorePurchases(args?: {
    entitlementCode?: string | null;
  }): Promise<{ customerSnapshot: RevenueCatCustomerSnapshot }>;
};

const RevenueCat = registerPlugin<NativeRevenueCatPlugin>("RevenueCat");

function isPluginUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? error.code : undefined;
  return code === "UNIMPLEMENTED" || code === "UNAVAILABLE";
}

export function isNativeRevenueCatSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export async function setNativeRevenueCatLogLevel(level: "debug" | "info" | "warn" | "error") {
  if (!isNativeRevenueCatSupported()) {
    return;
  }
  try {
    await RevenueCat.setLogLevel({ level });
  } catch (error) {
    if (!isPluginUnavailableError(error)) {
      throw error;
    }
  }
}

export async function configureNativeRevenueCat(args: {
  apiKey: string;
  appUserId?: string | null;
  entitlementCode?: string | null;
}) {
  if (!isNativeRevenueCatSupported()) {
    return;
  }
  try {
    await RevenueCat.configure(args);
  } catch (error) {
    if (!isPluginUnavailableError(error)) {
      throw error;
    }
  }
}

export async function logInNativeRevenueCat(appUserId: string) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }
  try {
    const result = await RevenueCat.logIn({ appUserId });
    return result.customerSnapshot;
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function logOutNativeRevenueCat() {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }
  try {
    const result = await RevenueCat.logOut();
    return result.customerSnapshot;
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getNativeRevenueCatCustomerSnapshot(entitlementCode?: string | null) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }
  try {
    const result = await RevenueCat.getCustomerSnapshot(
      entitlementCode ? { entitlementCode } : undefined
    );
    return result.customerSnapshot;
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getNativeRevenueCatOfferings() {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }
  try {
    return await RevenueCat.getOfferings();
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function purchaseNativeRevenueCatPackage(args: {
  packageIdentifier: string;
  offeringIdentifier?: string | null;
  entitlementCode?: string | null;
}) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }
  try {
    const result = await RevenueCat.purchasePackage(args);
    return result.customerSnapshot;
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function restoreNativeRevenueCatPurchases(entitlementCode?: string | null) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }
  try {
    const result = await RevenueCat.restorePurchases(
      entitlementCode ? { entitlementCode } : undefined
    );
    return result.customerSnapshot;
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}
