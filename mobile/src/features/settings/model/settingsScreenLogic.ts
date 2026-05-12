import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  fetchMyFamilyAccessSummary,
  fetchMyFamilySettingsSummary,
  fetchPushConfig,
  fetchPushPreferences,
  type MobileFamilyAccessSummary,
  type MobileFamilySettingsSummary,
  type MobilePushConfig,
  type MobilePushPreferences,
} from "../api/settingsApi";
import type { SettingsScreenContent } from "./settingsScreen";
import type { PasswordFormState } from "./settingsScreenHelpers";

export type SettingsBundle = {
  pushPreferences: MobilePushPreferences;
  pushConfig: MobilePushConfig;
  familySummary: MobileFamilySettingsSummary;
  familyAccess: MobileFamilyAccessSummary;
};

const settingsBundleCache = new Map<string, SettingsBundle>();

export function getCachedSettingsBundle(accessToken: string | null) {
  if (!accessToken) {
    return null;
  }

  return settingsBundleCache.get(accessToken) ?? null;
}

export function setCachedSettingsBundle(accessToken: string | null, bundle: SettingsBundle) {
  if (!accessToken) {
    return;
  }

  settingsBundleCache.set(accessToken, bundle);
}

export async function loadSettingsBundle(
  session: Pick<MobileAuthSession, "accessToken">,
): Promise<SettingsBundle> {
  const [pushPreferences, pushConfig, familySummary, familyAccess] =
    await Promise.all([
      fetchPushPreferences({ accessToken: session.accessToken }),
      fetchPushConfig({ accessToken: session.accessToken }),
      fetchMyFamilySettingsSummary({ accessToken: session.accessToken }),
      fetchMyFamilyAccessSummary({ accessToken: session.accessToken }),
    ]);

  const bundle = {
    pushPreferences,
    pushConfig,
    familySummary,
    familyAccess,
  };

  setCachedSettingsBundle(session.accessToken, bundle);

  return bundle;
}

export function getPasswordInlineHint(
  passwordForm: PasswordFormState,
  passwordsMismatchLabel: string,
  passwordSubmitError: string | null,
) {
  return passwordForm.confirmPassword.trim().length > 0 &&
    passwordForm.newPassword !== passwordForm.confirmPassword
    ? passwordsMismatchLabel
    : passwordSubmitError;
}

export function validatePasswordForm(
  passwordForm: PasswordFormState,
  content: Pick<
    SettingsScreenContent,
    "passwordRequired" | "passwordTooShort" | "passwordsMismatch"
  >,
) {
  if (!passwordForm.currentPassword.trim()) {
    return content.passwordRequired;
  }

  if (!passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
    return content.passwordRequired;
  }

  if (passwordForm.newPassword.trim().length < 8) {
    return content.passwordTooShort;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return content.passwordsMismatch;
  }

  return null;
}

export function buildOptimisticMasterPushPreferences(
  pushPreferences: MobilePushPreferences,
  enabled: boolean,
): MobilePushPreferences {
  return {
    ...pushPreferences,
    childrenEnabled: enabled,
    pillboxEnabled: enabled,
    cabinetNotify10Days: false,
    cabinetNotify7Days: enabled,
    cabinetNotify3Days: false,
  };
}

export function buildCabinetReminderPatch(days: 10 | 7 | 3) {
  return {
    cabinetNotify10Days: days === 10,
    cabinetNotify7Days: days === 7,
    cabinetNotify3Days: days === 3,
  } satisfies Pick<
    MobilePushPreferences,
    "cabinetNotify10Days" | "cabinetNotify7Days" | "cabinetNotify3Days"
  >;
}
