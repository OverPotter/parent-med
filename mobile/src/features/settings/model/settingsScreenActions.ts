import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  changePassword,
  deleteMyAccount,
  deleteMyFamily,
  type MobilePushPreferences,
  updatePushPreferences,
  updateRecoveryCode,
} from "../api/settingsApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { SettingsScreenContent } from "./settingsScreen";
import {
  emptyPasswordForm,
  resolvePasswordSaveError,
  type PasswordFormState,
} from "./settingsScreenHelpers";
import { validatePasswordForm } from "./settingsScreenLogic";
import {
  writeStoredMedicationIntervalUnit,
  type MedicationIntervalUnit,
} from "../session/mobileSettingsPreferencesStorage";
import { setMedicationIntervalUnitSnapshot } from "../session/medicationIntervalUnitStore";

export async function saveSettingsPassword(params: {
  session: Pick<MobileAuthSession, "accessToken"> | null;
  isSavingPassword: boolean;
  passwordForm: PasswordFormState;
  locale: MobileLocale;
  content: Pick<
    SettingsScreenContent,
    | "passwordRequired"
    | "passwordTooShort"
    | "passwordsMismatch"
    | "passwordUpdatedLabel"
    | "saveErrorLabel"
  >;
}) {
  if (!params.session || params.isSavingPassword) {
    return { blocked: true as const };
  }

  const validationError = validatePasswordForm(params.passwordForm, params.content);
  if (validationError) {
    return { blocked: false as const, validationError };
  }

  try {
    await changePassword({
      accessToken: params.session.accessToken,
      currentPassword: params.passwordForm.currentPassword,
      newPassword: params.passwordForm.newPassword,
    });

    return {
      blocked: false as const,
      nextPasswordForm: emptyPasswordForm,
      successMessage: params.content.passwordUpdatedLabel,
    };
  } catch (error) {
    return {
      blocked: false as const,
      submitError: resolvePasswordSaveError(
        error,
        params.locale,
        params.content.saveErrorLabel,
      ),
    };
  }
}

export async function saveSettingsRecoveryCode(params: {
  session: Pick<MobileAuthSession, "accessToken"> | null;
  isSavingRecoveryCode: boolean;
  recoveryCode: string;
  content: Pick<
    SettingsScreenContent,
    "recoveryCodeTooShort" | "recoveryCodeUpdatedLabel" | "saveErrorLabel"
  >;
}) {
  if (!params.session || params.isSavingRecoveryCode) {
    return { blocked: true as const };
  }

  if (params.recoveryCode.trim().length < 8) {
    return {
      blocked: false as const,
      validationError: params.content.recoveryCodeTooShort,
    };
  }

  try {
    await updateRecoveryCode({
      accessToken: params.session.accessToken,
      recoveryCode: params.recoveryCode.trim(),
    });

    return {
      blocked: false as const,
      nextRecoveryCode: "",
      hasRecoveryCode: true,
      successMessage: params.content.recoveryCodeUpdatedLabel,
    };
  } catch {
    return {
      blocked: false as const,
      submitError: params.content.saveErrorLabel,
    };
  }
}

export async function executeSettingsDeletion(params: {
  session: Pick<MobileAuthSession, "accessToken"> | null;
  usesFamilyDeleteEndpoint: boolean;
}) {
  if (!params.session) {
    return { blocked: true as const };
  }

  if (params.usesFamilyDeleteEndpoint) {
    await deleteMyFamily({ accessToken: params.session.accessToken });
  } else {
    await deleteMyAccount({ accessToken: params.session.accessToken });
  }

  return { blocked: false as const };
}

export async function saveSettingsPreferredLanguage(params: {
  isSavingLanguage: boolean;
  nextLocale: MobileLocale;
  currentLocale: MobileLocale | null | undefined;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
  saveErrorLabel: string;
}) {
  if (params.isSavingLanguage || params.nextLocale === params.currentLocale) {
    return { blocked: true as const };
  }

  try {
    await params.onUpdatePreferredLanguage(params.nextLocale);
    return { blocked: false as const, success: true as const };
  } catch {
    return {
      blocked: false as const,
      submitError: params.saveErrorLabel,
    };
  }
}

export async function saveMedicationIntervalUnitPreference(params: {
  nextUnit: MedicationIntervalUnit;
  currentUnit: MedicationIntervalUnit;
  saveErrorLabel: string;
}) {
  if (params.nextUnit === params.currentUnit) {
    return { blocked: true as const };
  }

  try {
    await writeStoredMedicationIntervalUnit(params.nextUnit);
    setMedicationIntervalUnitSnapshot(params.nextUnit);
    return { blocked: false as const, success: true as const };
  } catch {
    return {
      blocked: false as const,
      submitError: params.saveErrorLabel,
    };
  }
}

export async function patchSettingsPushPreferences(params: {
  session: Pick<MobileAuthSession, "accessToken"> | null;
  isSavingPush: boolean;
  patch: Partial<MobilePushPreferences>;
  previous: MobilePushPreferences;
  optimistic: MobilePushPreferences;
  saveErrorLabel: string;
}) {
  if (!params.session || params.isSavingPush) {
    return { blocked: true as const };
  }

  try {
    const nextPreferences = await updatePushPreferences({
      accessToken: params.session.accessToken,
      childrenEnabled: params.patch.childrenEnabled,
      beforeReminderMinutes: params.patch.beforeReminderMinutes,
      pillboxEnabled: params.patch.pillboxEnabled,
      pillboxBeforeReminderMinutes: params.patch.pillboxBeforeReminderMinutes,
      cabinetNotify10Days: params.patch.cabinetNotify10Days,
      cabinetNotify7Days: params.patch.cabinetNotify7Days,
      cabinetNotify3Days: params.patch.cabinetNotify3Days,
      liveActivitySleepEnabled: params.patch.liveActivitySleepEnabled,
      liveActivityFeedingEnabled: params.patch.liveActivityFeedingEnabled,
      liveActivityIllnessEnabled: params.patch.liveActivityIllnessEnabled,
    });

    return {
      blocked: false as const,
      nextPreferences,
    };
  } catch {
    return {
      blocked: false as const,
      revertPreferences: params.previous,
      submitError: params.saveErrorLabel,
    };
  }
}
