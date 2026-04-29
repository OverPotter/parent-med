import type { AppLanguage } from "@shared/i18n";

type SubscriptionStatus = "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";
type RestoreOutcome = "restored_active" | "restored_inactive" | null;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  "trialing",
  "active",
  "grace",
  "canceled",
]);

export function getRestorePurchasesMessage(
  language: AppLanguage,
  restoreOutcome: RestoreOutcome,
  subscriptionStatus: SubscriptionStatus | null | undefined
) {
  if (restoreOutcome === "restored_active") {
    return language === "ru"
      ? "Покупки восстановлены. Доступ Plus снова активен."
      : "Purchases restored. Plus access is active again.";
  }

  if (restoreOutcome !== "restored_inactive") {
    return null;
  }

  if (subscriptionStatus && ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)) {
    return null;
  }

  return language === "ru"
    ? "Покупки проверены, но активная подписка для этого аккаунта не найдена."
    : "Purchases were checked, but no active subscription was found for this account.";
}
