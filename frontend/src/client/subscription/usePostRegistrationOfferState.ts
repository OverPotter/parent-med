import { useState } from "react";
import type { AppLanguage } from "@shared/i18n";
import { useSubscriptionUpgradeDialogState } from "./useSubscriptionUpgradeDialogState";

export function usePostRegistrationOfferState({
  language,
  accountId,
  currentFamilyId,
  seenKey,
  canManageSubscription,
  canShowOffer,
}: {
  language: AppLanguage;
  accountId: string | null;
  currentFamilyId: string | null;
  seenKey: string | null;
  canManageSubscription: boolean;
  canShowOffer: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const upgradeState = useSubscriptionUpgradeDialogState({
    language,
    accountId,
    currentFamilyId,
    canManageSubscription,
    subscriptionStatus: "inactive",
  });

  const open = () => {
    if (!accountId || !canShowOffer || typeof window === "undefined") {
      return;
    }
    if (seenKey && window.localStorage.getItem(seenKey) === "1") {
      return;
    }
    setIsOpen(true);
  };

  const closePermanently = () => {
    if (accountId && seenKey && typeof window !== "undefined") {
      window.localStorage.setItem(seenKey, "1");
    }
    setIsOpen(false);
  };

  return {
    isOpen,
    open,
    closePermanently,
    ...upgradeState,
  };
}
