import type { AppLanguage } from "@shared/i18n";
import type { RevenueCatPlanKey } from "@shared/utils/revenueCatOfferingSelection";
import {
  PostRegistrationOfferDialog,
} from "./PostRegistrationOfferDialog";
import { useResolvedPlanUpgrade } from "./useResolvedPlanUpgrade";

type PostRegistrationOfferDialogContainerProps = {
  isOpen: boolean;
  language: AppLanguage;
  isPending?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onClose: () => void;
  onUpgrade: (preferredPackageIdentifier?: string | null) => Promise<unknown> | void;
  onRestorePurchases: () => Promise<unknown> | void;
};

export function PostRegistrationOfferDialogContainer({
  isOpen,
  language,
  isPending = false,
  errorMessage = null,
  successMessage = null,
  onClose,
  onUpgrade,
  onRestorePurchases,
}: PostRegistrationOfferDialogContainerProps) {
  const { isLocalPurchasePending, handlePlanUpgrade } = useResolvedPlanUpgrade({
    onUpgrade,
    onPurchased: onClose,
  });

  return (
    <PostRegistrationOfferDialog
      isOpen={isOpen}
      language={language}
      isPending={isPending || isLocalPurchasePending}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onClose={onClose}
      onUpgrade={(plan) => {
        void handlePlanUpgrade(plan as RevenueCatPlanKey);
      }}
      onRestorePurchases={() => {
        void onRestorePurchases();
      }}
    />
  );
}
