import Purchases, {
  type CustomerInfo,
  INTRO_ELIGIBILITY_STATUS,
  type IntroEligibility,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";

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

type EnsureRevenueCatConfiguredArgs = {
  apiKey: string;
  appUserId?: string | null;
};

let configuredApiKey: string | null = null;
let currentAppUserId: string | null = null;

function getPeriodStatus(customerInfo: CustomerInfo, entitlementCode: string | null) {
  const entitlement =
    (entitlementCode ? customerInfo.entitlements.all[entitlementCode] : null) ??
    Object.values(customerInfo.entitlements.active)[0] ??
    Object.values(customerInfo.entitlements.all)[0] ??
    null;

  if (!entitlement) {
    return {
      entitlement: null,
      status: "inactive" as RevenueCatSnapshotStatus,
    };
  }

  if (entitlement.isActive) {
    if (entitlement.billingIssueDetectedAt) {
      return { entitlement, status: "grace" as RevenueCatSnapshotStatus };
    }
    if (entitlement.unsubscribeDetectedAt) {
      return { entitlement, status: "canceled" as RevenueCatSnapshotStatus };
    }
    if (String(entitlement.periodType).toUpperCase() === "TRIAL") {
      return { entitlement, status: "trialing" as RevenueCatSnapshotStatus };
    }
    return { entitlement, status: "active" as RevenueCatSnapshotStatus };
  }

  if (entitlement.expirationDate) {
    return { entitlement, status: "expired" as RevenueCatSnapshotStatus };
  }

  return { entitlement, status: "inactive" as RevenueCatSnapshotStatus };
}

function customerInfoToSnapshot(
  customerInfo: CustomerInfo,
  entitlementCode: string | null,
): RevenueCatCustomerSnapshot {
  const { entitlement, status } = getPeriodStatus(customerInfo, entitlementCode);
  const productId = entitlement?.productIdentifier ?? customerInfo.activeSubscriptions[0] ?? null;
  const providerSubscriptionId =
    (productId
      ? customerInfo.subscriptionsByProductIdentifier[productId]?.storeTransactionId
      : null) ?? null;

  return {
    configured: true,
    appUserId: currentAppUserId,
    originalAppUserId: customerInfo.originalAppUserId ?? null,
    entitlementCode: entitlement?.identifier ?? entitlementCode,
    entitlementActive: Boolean(entitlement?.isActive),
    status,
    productId,
    latestPurchaseDate: entitlement?.latestPurchaseDate ?? null,
    originalPurchaseDate:
      entitlement?.originalPurchaseDate ?? customerInfo.originalPurchaseDate ?? null,
    expirationDate: entitlement?.expirationDate ?? customerInfo.latestExpirationDate ?? null,
    willRenew: Boolean(entitlement?.willRenew),
    isSandbox: Boolean(entitlement?.isSandbox),
    ownershipType: entitlement?.ownershipType ?? null,
    providerCustomerId: customerInfo.originalAppUserId ?? null,
    providerSubscriptionId,
    rawPayload: customerInfo as unknown as Record<string, unknown>,
  };
}

function isUserCancelledError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    userCancelled?: unknown;
    code?: unknown;
  };

  return candidate.userCancelled === true || candidate.code === "PURCHASE_CANCELLED";
}

export function isNativeRevenueCatSupported() {
  return Platform.OS === "ios";
}

export async function ensureRevenueCatConfigured({
  apiKey,
  appUserId,
}: EnsureRevenueCatConfiguredArgs) {
  if (!isNativeRevenueCatSupported()) {
    return false;
  }

  if (!configuredApiKey) {
    Purchases.configure({
      apiKey,
      appUserID: appUserId ?? undefined,
    });
    configuredApiKey = apiKey;
    currentAppUserId = appUserId ?? null;
    return true;
  }

  if (appUserId && currentAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    currentAppUserId = appUserId;
    return true;
  }

  if (!appUserId && currentAppUserId) {
    await Purchases.logOut();
    currentAppUserId = null;
    return true;
  }

  return true;
}

export async function getNativeRevenueCatCurrentOffering() {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }

  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function getNativeRevenueCatTrialEligibility(
  productIdentifiers: string[],
) {
  if (!isNativeRevenueCatSupported() || productIdentifiers.length === 0) {
    return {};
  }

  const uniqueIdentifiers = Array.from(
    new Set(productIdentifiers.map((item) => item.trim()).filter(Boolean)),
  );
  if (uniqueIdentifiers.length === 0) {
    return {};
  }

  const result =
    await Purchases.checkTrialOrIntroductoryPriceEligibility(uniqueIdentifiers);
  return result;
}

export function isRevenueCatIntroEligible(
  eligibility: IntroEligibility | null | undefined,
) {
  return (
    eligibility?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
  );
}

export async function getNativeRevenueCatCustomerSnapshot(
  entitlementCode?: string | null,
) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }

  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfoToSnapshot(customerInfo, entitlementCode ?? null);
}

export async function purchaseNativeRevenueCatPackage(args: {
  aPackage: PurchasesPackage;
  entitlementCode?: string | null;
}) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }

  try {
    const result = await Purchases.purchasePackage(args.aPackage);
    return {
      outcome: "purchased" as const,
      customerSnapshot: customerInfoToSnapshot(
        result.customerInfo,
        args.entitlementCode ?? null,
      ),
    };
  } catch (error) {
    if (isUserCancelledError(error)) {
      return {
        outcome: "cancelled" as const,
        customerSnapshot: null,
      };
    }
    throw error;
  }
}

export async function restoreNativeRevenueCatPurchases(
  entitlementCode?: string | null,
) {
  if (!isNativeRevenueCatSupported()) {
    return null;
  }

  const customerInfo = await Purchases.restorePurchases();
  return customerInfoToSnapshot(customerInfo, entitlementCode ?? null);
}

export async function showNativeManageSubscriptions() {
  if (!isNativeRevenueCatSupported()) {
    return false;
  }

  await Purchases.showManageSubscriptions();
  return true;
}

type RevenueCatPlanMatchCandidate = {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
  };
};

function normalizePackageLabel(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getPlanAliases(plan: "monthly" | "annual") {
  if (plan === "annual") {
    return new Set(["annual", "$rc_annual", "yearly", "$rc_yearly"]);
  }

  return new Set(["monthly", "$rc_monthly", "month", "$rc_month"]);
}

export function isRevenueCatPackageMatchingPlan(
  aPackage: RevenueCatPlanMatchCandidate,
  plan: "monthly" | "annual",
) {
  const aliases = getPlanAliases(plan);
  const normalizedType = normalizePackageLabel(String(aPackage.packageType));

  if (aliases.has(normalizedType)) {
    return true;
  }

  const haystack = normalizePackageLabel(
    `${aPackage.identifier} ${aPackage.product.identifier} ${aPackage.product.title}`,
  );

  return plan === "annual"
    ? haystack.includes("annual") || haystack.includes("year")
    : haystack.includes("monthly") || haystack.includes("month");
}

export function getRevenueCatPackageForPlan(
  offering: PurchasesOffering,
  plan: "monthly" | "annual",
) {
  if (plan === "annual") {
    return (
      offering.annual ??
      offering.availablePackages.find((item) =>
        isRevenueCatPackageMatchingPlan(item, "annual"),
      ) ??
      null
    );
  }

  return (
    offering.monthly ??
    offering.availablePackages.find((item) =>
      isRevenueCatPackageMatchingPlan(item, "monthly"),
    ) ??
    null
  );
}
