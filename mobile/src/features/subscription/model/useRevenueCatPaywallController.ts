import { useEffect, useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  getRevenueCatEntitlementCode,
  getRevenueCatIosApiKey,
} from "../../../shared/config/mobileRuntimeConfig";
import {
  ensureRevenueCatConfigured,
  purchaseNativeRevenueCatPackage,
  restoreNativeRevenueCatPurchases,
  type RevenueCatCustomerSnapshot,
} from "../../../shared/billing/nativeRevenueCat";
import { syncRevenueCatCustomerSnapshot } from "../../../shared/billing/revenueCatSync";
import type { PurchasesPackage } from "react-native-purchases";
import {
  loadRevenueCatPaywallOffering,
  type RevenueCatPlanTrialDetails,
} from "./revenueCatPaywallOffering";

export type RevenueCatPaywallPlanKey = "annual" | "monthly";

type UseRevenueCatPaywallControllerArgs = {
  visible: boolean;
  session: MobileAuthSession | null;
  logPrefix: string;
  restoreSuccessMessage: string;
  restoreInactiveMessage: string;
  onClose?: () => void;
  onPurchased?: () => Promise<void> | void;
  onError?: (message: string) => void;
};

function describeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : "Unknown error";
}

export function useRevenueCatPaywallController({
  visible,
  session,
  logPrefix,
  restoreSuccessMessage,
  restoreInactiveMessage,
  onClose,
  onPurchased,
  onError,
}: UseRevenueCatPaywallControllerArgs) {
  const [selectedPlan, setSelectedPlan] =
    useState<RevenueCatPaywallPlanKey>("annual");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const [packagesByPlan, setPackagesByPlan] = useState<
    Record<RevenueCatPaywallPlanKey, PurchasesPackage | null>
  >({
    annual: null,
    monthly: null,
  });
  const [priceByPlan, setPriceByPlan] = useState<
    Record<RevenueCatPaywallPlanKey, string | null>
  >({
    annual: null,
    monthly: null,
  });
  const [trialDetailsByPlan, setTrialDetailsByPlan] = useState<
    Record<RevenueCatPaywallPlanKey, RevenueCatPlanTrialDetails>
  >({
    annual: {
      introPrice: null,
      eligibility: null,
      hasFreeTrial: false,
    },
    monthly: {
      introPrice: null,
      eligibility: null,
      hasFreeTrial: false,
    },
  });

  useEffect(() => {
    if (!visible || !session) {
      return;
    }

    const apiKey = getRevenueCatIosApiKey();
    if (!apiKey) {
      setInlineMessage("RevenueCat iOS API key is missing.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setInlineMessage(null);

    void ensureRevenueCatConfigured({
      apiKey,
      appUserId: session.account.id,
    })
      .then(async () => {
        console.log(`${logPrefix} configured`, {
          accountId: session.account.id,
          hasApiKey: Boolean(apiKey),
          apiKeyPrefix: apiKey.slice(0, 5),
          entitlementCode: getRevenueCatEntitlementCode(),
        });

        const offeringData = await loadRevenueCatPaywallOffering();
        if (!offeringData || cancelled) {
          console.warn(`${logPrefix} no current offering`);
          setInlineMessage("RevenueCat current offering is unavailable.");
          return;
        }

        if (cancelled) {
          return;
        }

        console.log(`${logPrefix} offering loaded`, offeringData.logDetails);
        setSelectedPlan(offeringData.selectedPlan);
        setPackagesByPlan(offeringData.packagesByPlan);
        setPriceByPlan(offeringData.priceByPlan);
        setTrialDetailsByPlan(offeringData.trialDetailsByPlan);
      })
      .catch((error) => {
        console.warn(`${logPrefix} offerings load failed`, error);
        if (!cancelled) {
          setInlineMessage(
            `RevenueCat offering load failed: ${describeUnknownError(error)}`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [logPrefix, session, visible]);

  const handleSnapshotSync = async (snapshot: RevenueCatCustomerSnapshot | null) => {
    if (!snapshot || !session?.accessToken) {
      return;
    }

    await syncRevenueCatCustomerSnapshot(session.accessToken, snapshot);
  };

  const handlePurchase = async () => {
    if (!session || isSubmitting) {
      return;
    }

    const selectedPackage = packagesByPlan[selectedPlan];
    if (!selectedPackage) {
      console.warn(`${logPrefix} selected package missing`, {
        selectedPlan,
        annual: packagesByPlan.annual?.product.identifier ?? null,
        monthly: packagesByPlan.monthly?.product.identifier ?? null,
      });
      setInlineMessage(`RevenueCat package for ${selectedPlan} is unavailable.`);
      return;
    }

    setIsSubmitting(true);
    setInlineMessage(null);

    try {
      const result = await purchaseNativeRevenueCatPackage({
        aPackage: selectedPackage,
        entitlementCode: getRevenueCatEntitlementCode(),
      });

      if (!result || result.outcome === "cancelled") {
        return;
      }

      if (!result.customerSnapshot?.entitlementActive) {
        const message =
          "Purchase completed, but Plus access did not activate. Please try Restore purchases.";
        setInlineMessage(message);
        onError?.(message);
        return;
      }

      await handleSnapshotSync(result.customerSnapshot);
      await onPurchased?.();
      onClose?.();
    } catch (error) {
      const message = `Purchase failed: ${describeUnknownError(error)}`;
      setInlineMessage(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!session || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setInlineMessage(null);

    try {
      const snapshot = await restoreNativeRevenueCatPurchases(
        getRevenueCatEntitlementCode(),
      );
      await handleSnapshotSync(snapshot);
      if (!snapshot?.entitlementActive) {
        setInlineMessage(restoreInactiveMessage);
        return;
      }
      await onPurchased?.();
      setInlineMessage(restoreSuccessMessage);
    } catch (error) {
      const message = `Restore failed: ${describeUnknownError(error)}`;
      setInlineMessage(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedPlan,
    setSelectedPlan,
    isLoading,
    isSubmitting,
    inlineMessage,
    setInlineMessage,
    packagesByPlan,
    priceByPlan,
    trialDetailsByPlan,
    canPurchase:
      !isLoading &&
      !isSubmitting &&
      Boolean(packagesByPlan[selectedPlan]),
    handlePurchase,
    handleRestore,
  };
}
