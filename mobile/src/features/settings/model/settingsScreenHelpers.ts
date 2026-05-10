import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  MobileSettingsApiError,
  type MobileFamilyAccessSummary,
  type MobileFamilySettingsSummary,
  type MobilePushConfig,
  type MobilePushPreferences,
} from "../api/settingsApi";

export type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const defaultPushPreferences: MobilePushPreferences = {
  childrenEnabled: true,
  beforeReminderMinutes: 10,
  pillboxEnabled: true,
  pillboxBeforeReminderMinutes: 10,
  cabinetNotify10Days: false,
  cabinetNotify7Days: true,
  cabinetNotify3Days: false,
  liveActivitySleepEnabled: false,
  liveActivityFeedingEnabled: false,
  liveActivityIllnessEnabled: false,
};

export const defaultFamilySummary: MobileFamilySettingsSummary = {
  id: "",
  name: "",
  ownerAccountId: null,
  planCode: "free",
  subscriptionStatus: "inactive",
  subscriptionExpiresAt: null,
  premiumActive: false,
};

export const defaultFamilyAccess: MobileFamilyAccessSummary = {
  planCode: "free",
  subscriptionStatus: "inactive",
  premiumActive: false,
  canManageSubscription: false,
  canUseLiveActivities: false,
  currentChildrenCount: 0,
  currentAdultsCount: 0,
  currentPillboxPlanCount: 0,
};

export const defaultPushConfig: MobilePushConfig = {
  enabled: true,
};

export const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function resolvePasswordSaveError(
  error: unknown,
  locale: MobileLocale,
  fallback: string,
) {
  if (!(error instanceof MobileSettingsApiError)) {
    return fallback;
  }

  if (locale === "ru" && error.detail) {
    return error.detail;
  }

  const knownCodes: Record<string, string> = {
    INVALID_CURRENT_PASSWORD: "Current password is incorrect.",
  };

  const knownDetails: Record<string, string> = {
    "Текущий пароль неверный": "Current password is incorrect.",
    "Current password is incorrect": "Current password is incorrect.",
    "Incorrect current password": "Current password is incorrect.",
  };

  if (error.code && knownCodes[error.code]) {
    return knownCodes[error.code];
  }

  if (error.detail && knownDetails[error.detail]) {
    return knownDetails[error.detail];
  }

  return error.detail ?? fallback;
}

export function formatSubscriptionExpiresAt(
  locale: MobileLocale,
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dateLocale =
    locale === "ru" ? "ru-RU" : locale === "pl" ? "pl-PL" : "en-US";

  return new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isPushMasterEnabled(pushPreferences: MobilePushPreferences) {
  return (
    pushPreferences.childrenEnabled ||
    pushPreferences.pillboxEnabled ||
    pushPreferences.cabinetNotify10Days ||
    pushPreferences.cabinetNotify7Days ||
    pushPreferences.cabinetNotify3Days
  );
}

export function getSelectedCabinetDays(
  pushPreferences: MobilePushPreferences,
): 10 | 7 | 3 {
  if (pushPreferences.cabinetNotify10Days) {
    return 10;
  }

  if (pushPreferences.cabinetNotify7Days) {
    return 7;
  }

  return 3;
}
