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
  restoreSuccessMessage: string;
  restoreInactiveMessage: string;
  unavailableMessage: string;
  purchaseUnavailableMessage: string;
  purchaseFailedMessage: string;
  restoreFailedMessage: string;
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
  restoreSuccessMessage,
  restoreInactiveMessage,
  unavailableMessage,
  purchaseUnavailableMessage,
  purchaseFailedMessage,
  restoreFailedMessage,
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
      if (__DEV__) {
        console.warn("[paywall] RevenueCat iOS API key is missing.");
      }
      setInlineMessage(unavailableMessage);
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
        const offeringData = await loadRevenueCatPaywallOffering();
        if (!offeringData || cancelled) {
          if (!cancelled && __DEV__) {
            console.warn("[paywall] RevenueCat current offering is unavailable.");
          }
          setInlineMessage(unavailableMessage);
          return;
        }

        if (cancelled) {
          return;
        }

        setSelectedPlan(offeringData.selectedPlan);
        setPackagesByPlan(offeringData.packagesByPlan);
        setPriceByPlan(offeringData.priceByPlan);
        setTrialDetailsByPlan(offeringData.trialDetailsByPlan);
      })
      .catch((error) => {
        if (!cancelled) {
          if (__DEV__) {
            console.warn(
              `[paywall] RevenueCat offering load failed: ${describeUnknownError(error)}`,
            );
          }
          setInlineMessage(unavailableMessage);
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
  }, [session, visible]);

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
      if (__DEV__) {
        console.warn(
          `[paywall] RevenueCat package for ${selectedPlan} is unavailable.`,
        );
      }
      setInlineMessage(purchaseUnavailableMessage);
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
      if (__DEV__) {
        console.warn(
          `[paywall] Purchase failed: ${describeUnknownError(error)}`,
        );
      }
      const message = purchaseFailedMessage;
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
        await onPurchased?.();
        setInlineMessage(restoreInactiveMessage);
        return;
      }
      await onPurchased?.();
      setInlineMessage(restoreSuccessMessage);
    } catch (error) {
      if (__DEV__) {
        console.warn(
          `[paywall] Restore failed: ${describeUnknownError(error)}`,
        );
      }
      const message = restoreFailedMessage;
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
