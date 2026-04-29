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
  isPending?: boolean;
  errorMessage?: string | null;
};

export function TestPaywallDialogContainer({
  isOpen,
  language,
  onClose,
  onUpgrade,
  onRestorePurchases,
  isPending = false,
  errorMessage = null,
}: TestPaywallDialogContainerProps) {
  const handleUpgrade = async (plan: PaywallPlanKey) => {
    const { selectedPackage } = await resolveRevenueCatPlanPurchase(plan);
    const result = (await onUpgrade(
      selectedPackage.identifier
    )) as RevenueCatPurchaseResult | null;
    if (result?.outcome === "purchased") {
      onClose();
    }
  };

  return (
    <TestPaywallDialog
      isOpen={isOpen}
      language={language}
      onClose={onClose}
      onUpgrade={(plan) => {
        void handleUpgrade(plan);
      }}
      isPurchasePending={isPending}
      onRestorePurchases={() => {
        void onRestorePurchases();
      }}
      isRestorePending={isPending}
      errorMessage={errorMessage}
    />
  );
}
