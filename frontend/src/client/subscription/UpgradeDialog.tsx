import type { AppLanguage } from "@shared/i18n";
import { blurActiveField } from "@shared/utils/focus";
import { openExternalUrl } from "@shared/utils/openExternalUrl";
import { Capacitor } from "@capacitor/core";
import { useLayoutEffect } from "react";
import { getUpgradeDialogCopy, type UpgradeEntryPoint } from "./upgradeDialogCopy";
import { TestPaywallDialogContainer } from "./TestPaywallDialogContainer";
import { consumeUpgradeDialogReopenPending } from "./upgradeDialogReopen";

type SubscriptionStatus = "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";

type UpgradeDialogProps = {
  isOpen: boolean;
  language: AppLanguage;
  entryPoint: UpgradeEntryPoint;
  isPending?: boolean;
  canUpgrade?: boolean;
  subscriptionStatus?: SubscriptionStatus | null;
  errorMessage?: string | null;
  successMessage?: string | null;
  onClose: () => void;
  onRequestOpen?: () => void;
  onManageSubscription?: () => void;
  onUpgrade: (preferredPackageIdentifier?: string | null) => Promise<unknown> | void;
  onRestorePurchases?: () => Promise<unknown> | void;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  "trialing",
  "active",
  "grace",
  "canceled",
]);

function getActiveStateCopy(language: AppLanguage, subscriptionStatus: SubscriptionStatus) {
  const autoRenewOff = subscriptionStatus === "canceled";
  if (language === "ru") {
    return {
      title: "Plus уже активна",
      description: autoRenewOff
        ? "Автопродление уже выключено, но семейный доступ Plus ещё действует до конца оплаченного периода."
        : "У семьи уже есть доступ Plus. Покупать подписку повторно не нужно.",
      highlights: [
        "Все возможности Plus уже открыты для этой семьи",
        autoRenewOff
          ? "При необходимости можно проверить срок доступа и дождаться окончания периода"
          : "Автопродление и отмена управляются в системных подписках Apple",
        "Если покупка не подтянулась на этом устройстве, используйте восстановление покупок",
      ],
    };
  }
  return {
    title: "Plus is already active",
    description: autoRenewOff
      ? "Auto-renew is already off, but Plus access is still active for this family until the paid period ends."
      : "This family already has Plus access. There is no need to purchase it again.",
    highlights: [
      "All Plus features are already unlocked for this family",
      autoRenewOff
        ? "You can check the access period and wait until it ends if needed"
        : "Auto-renew and cancellation are managed in Apple system subscriptions",
      "If this device did not pick up the purchase yet, use Restore Purchases",
    ],
  };
}

export function UpgradeDialog({
  isOpen,
  language,
  entryPoint,
  isPending = false,
  canUpgrade = true,
  subscriptionStatus = null,
  errorMessage = null,
  successMessage = null,
  onClose,
  onRequestOpen,
  onManageSubscription,
  onUpgrade,
  onRestorePurchases,
}: UpgradeDialogProps) {
  useLayoutEffect(() => {
    if (isOpen || !onRequestOpen) {
      return;
    }
    if (consumeUpgradeDialogReopenPending()) {
      onRequestOpen();
      blurActiveField();
    }
  }, [isOpen, onRequestOpen]);

  if (!isOpen) {
    return null;
  }

  const effectiveSubscriptionStatus = subscriptionStatus ?? "inactive";
  const isSubscriptionActive = ACTIVE_SUBSCRIPTION_STATUSES.has(effectiveSubscriptionStatus);
  const purchaseCopy = getUpgradeDialogCopy(language, entryPoint);
  const activeCopy = getActiveStateCopy(language, effectiveSubscriptionStatus);

  const variant = isSubscriptionActive
    ? "active"
    : canUpgrade
      ? "purchase"
      : "owner_required";

  const infoTitle =
    variant === "active"
      ? activeCopy.title
      : variant === "owner_required"
        ? purchaseCopy.title
        : null;
  const infoDescription =
    variant === "active"
      ? activeCopy.description
      : variant === "owner_required"
        ? purchaseCopy.description
        : null;
  const infoHighlights =
    variant === "active"
      ? activeCopy.highlights
      : variant === "owner_required"
        ? purchaseCopy.highlights
        : null;

  const handleManageSubscriptionAction = () => {
    blurActiveField();
    if (onManageSubscription) {
      onManageSubscription();
      return;
    }
    void openExternalUrl(
      Capacitor.isNativePlatform()
        ? "itms-apps://apps.apple.com/account/subscriptions"
        : "https://apps.apple.com/account/subscriptions"
    );
  };

  return (
    <TestPaywallDialogContainer
      isOpen={isOpen}
      language={language}
      onClose={() => {
        blurActiveField();
        onClose();
      }}
      onUpgrade={onUpgrade}
      onRestorePurchases={
        onRestorePurchases
          ? () => {
              blurActiveField();
              return onRestorePurchases();
            }
          : async () => undefined
      }
      onManageSubscription={handleManageSubscriptionAction}
      canManageSubscription={canUpgrade}
      subscriptionStatus={effectiveSubscriptionStatus}
      isPending={isPending}
      errorMessage={errorMessage}
      successMessage={successMessage}
      variant={variant}
      infoTitle={infoTitle}
      infoDescription={infoDescription}
      infoHighlights={infoHighlights}
      ownerNote={
        !canUpgrade
          ? language === "ru"
            ? "Plus для семьи оформляет владелец семейного аккаунта. Попросите его подключить или восстановить подписку."
            : "The family owner manages Plus for everyone. Ask them to purchase or restore the subscription."
          : null
      }
    />
  );
}
