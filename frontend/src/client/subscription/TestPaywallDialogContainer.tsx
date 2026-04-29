import { useState } from "react";
import type { AppLanguage } from "@shared/i18n";
import { resolveRevenueCatPlanPurchase } from "@shared/utils/revenueCatPlanPurchase";
import { TestPaywallDialog } from "./TestPaywallDialog";
import type { PaywallPlanKey } from "./testPaywallCopy";
import type { RevenueCatPurchaseResult } from "@shared/utils/nativeRevenueCat";

type TestPaywallDialogContainerProps = {
  isOpen: boolean;
  language: AppLanguage;
  onClose: () => void;
  onUpgrade: (preferredPackageIdentifier?: string | null) => Promise<unknown> | void;
  onRestorePurchases: () => Promise<unknown> | void;
  onManageSubscription?: () => void;
  canManageSubscription?: boolean;
  subscriptionStatus?: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";
  isPending?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  variant?: "purchase" | "active" | "owner_required";
  infoTitle?: string | null;
  infoDescription?: string | null;
  infoHighlights?: string[] | null;
  ownerNote?: string | null;
};

export function TestPaywallDialogContainer({
  isOpen,
  language,
  onClose,
  onUpgrade,
  onRestorePurchases,
  onManageSubscription,
  canManageSubscription = true,
  subscriptionStatus = "inactive",
  isPending = false,
  errorMessage = null,
  successMessage = null,
  variant = "purchase",
  infoTitle = null,
  infoDescription = null,
  infoHighlights = null,
  ownerNote = null,
}: TestPaywallDialogContainerProps) {
  const [isLocalPurchasePending, setIsLocalPurchasePending] = useState(false);

  const handleUpgrade = async (plan: PaywallPlanKey) => {
    setIsLocalPurchasePending(true);
    try {
      const { selectedPackage } = await resolveRevenueCatPlanPurchase(plan);
      const result = (await onUpgrade(
        selectedPackage.identifier
      )) as RevenueCatPurchaseResult | null;
      if (result?.outcome === "purchased") {
        onClose();
      }
    } finally {
      setIsLocalPurchasePending(false);
    }
  };

  return (
    <TestPaywallDialog
      isOpen={isOpen}
      language={language}
      onClose={onClose}
      onManageSubscription={onManageSubscription}
      canManageSubscription={canManageSubscription}
      subscriptionStatus={subscriptionStatus}
      onUpgrade={(plan) => {
        void handleUpgrade(plan);
      }}
      isPurchasePending={isPending || isLocalPurchasePending}
      onRestorePurchases={() => {
        void onRestorePurchases();
      }}
      isRestorePending={isPending || isLocalPurchasePending}
      errorMessage={errorMessage}
      successMessage={successMessage}
      variant={variant}
      infoTitle={infoTitle}
      infoDescription={infoDescription}
      infoHighlights={infoHighlights}
      ownerNote={ownerNote}
    />
  );
}
