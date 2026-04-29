import type { AppLanguage } from "@shared/i18n";
import type { UpgradeEntryPoint } from "./upgradeDialogCopy";
import { UpgradeDialog } from "./UpgradeDialog";

type SubscriptionStatus = "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";

export function SubscriptionUpgradeDialog({
  isOpen,
  setIsOpen,
  language,
  entryPoint,
  canManageSubscription,
  subscriptionStatus,
  isUpgradePending,
  upgradeErrorMessage,
  restoreSuccessMessage,
  clearUpgradeError,
  upgradeToPlus,
  restorePurchases,
  onManageSubscription,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  language: AppLanguage;
  entryPoint: UpgradeEntryPoint;
  canManageSubscription: boolean;
  subscriptionStatus: SubscriptionStatus | null | undefined;
  isUpgradePending: boolean;
  upgradeErrorMessage: string | null;
  restoreSuccessMessage: string | null;
  clearUpgradeError: () => void;
  upgradeToPlus: (preferredPackageIdentifier?: string | null) => Promise<unknown> | void;
  restorePurchases: () => Promise<unknown> | void;
  onManageSubscription?: () => void;
}) {
  return (
    <UpgradeDialog
      isOpen={isOpen}
      language={language}
      entryPoint={entryPoint}
      onRequestOpen={() => {
        setIsOpen(true);
      }}
      isPending={isUpgradePending}
      canUpgrade={canManageSubscription}
      subscriptionStatus={subscriptionStatus ?? "inactive"}
      errorMessage={upgradeErrorMessage}
      successMessage={restoreSuccessMessage}
      onClose={() => {
        clearUpgradeError();
        setIsOpen(false);
      }}
      onManageSubscription={onManageSubscription}
      onUpgrade={(preferredPackageIdentifier) => upgradeToPlus(preferredPackageIdentifier)}
      onRestorePurchases={() => {
        void restorePurchases();
      }}
    />
  );
}
