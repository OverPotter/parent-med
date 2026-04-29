import type { AppLanguage } from "@shared/i18n";
import { getRestorePurchasesMessage } from "./restoreOutcomeCopy";
import { useSubscriptionUpgrade } from "./useSubscriptionUpgrade";

type SubscriptionStatus = "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";

export function useSubscriptionUpgradeDialogState({
  language,
  accountId,
  currentFamilyId,
  canManageSubscription,
  subscriptionStatus,
}: {
  language: AppLanguage;
  accountId: string | null;
  currentFamilyId: string | null;
  canManageSubscription: boolean;
  subscriptionStatus: SubscriptionStatus | null | undefined;
}) {
  const upgradeState = useSubscriptionUpgrade(accountId, currentFamilyId, canManageSubscription);

  return {
    ...upgradeState,
    restoreSuccessMessage: getRestorePurchasesMessage(
      language,
      upgradeState.restoreOutcome,
      subscriptionStatus
    ),
  };
}
