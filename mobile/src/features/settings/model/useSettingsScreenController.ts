import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  type MobileFamilyAccessSummary,
  type MobileFamilySettingsSummary,
  type MobilePushConfig,
  type MobilePushPreferences,
  sendTestPushNotification,
} from "../api/settingsApi";
import {
  executeSettingsDeletion,
  patchSettingsPushPreferences,
  saveMedicationIntervalUnitPreference,
  saveSettingsPassword,
  saveSettingsPreferredLanguage,
  saveSettingsRecoveryCode,
} from "./settingsScreenActions";
import {
  buildCabinetReminderPatch,
  buildOptimisticMasterPushPreferences,
  getCachedSettingsBundle,
  getPasswordInlineHint,
  loadSettingsBundle,
  patchCachedSettingsBundle,
  type SettingsBundle,
} from "./settingsScreenLogic";
import {
  defaultFamilyAccess,
  defaultFamilySummary,
  defaultPushConfig,
  defaultPushPreferences,
  emptyPasswordForm,
  formatSubscriptionExpiresAt,
  getSelectedCabinetDays,
  isPushMasterEnabled,
  type PasswordFormState,
} from "./settingsScreenHelpers";
import { resolveSettingsOwnershipPolicy } from "./settingsOwnershipPolicy";
import { openSystemSubscriptionManagement } from "./settingsSubscriptionActions";
import {
  openNativeNotificationSettings,
  type NativePushPermissionStatus,
} from "../../../shared/push/nativePushNotifications";
import { syncNativePushSubscription } from "../../../shared/push/nativePushSync";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MedicationIntervalUnit } from "../session/mobileSettingsPreferencesStorage";

type SettingsContent = ReturnType<
  typeof import("./settingsScreen").buildSettingsScreenContent
>;

type UseSettingsScreenControllerArgs = {
  visible: boolean;
  session: MobileAuthSession | null;
  locale: MobileLocale;
  content: SettingsContent;
  medicationIntervalUnit: MedicationIntervalUnit;
  setMedicationIntervalUnit: (nextUnit: MedicationIntervalUnit) => void;
  onSessionDeleted: () => Promise<void>;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
  onPushPreferencesChanged?: (preferences: MobilePushPreferences) => void;
  onFamilyAccessChanged?: (familyAccess: MobileFamilyAccessSummary) => void;
  onSettingsBundleChanged?: (bundle: SettingsBundle) => void;
};

export function useSettingsScreenController({
  visible,
  session,
  locale,
  content,
  medicationIntervalUnit,
  setMedicationIntervalUnit,
  onSessionDeleted,
  onUpdatePreferredLanguage,
  onPushPreferencesChanged,
  onFamilyAccessChanged,
  onSettingsBundleChanged,
}: UseSettingsScreenControllerArgs) {
  const manageSubscriptionPendingRef = useRef(false);

  const [pushPreferences, setPushPreferences] = useState<MobilePushPreferences>(
    defaultPushPreferences,
  );
  const [pushConfig, setPushConfig] =
    useState<MobilePushConfig>(defaultPushConfig);
  const [familySummary, setFamilySummary] =
    useState<MobileFamilySettingsSummary>(defaultFamilySummary);
  const [familyAccess, setFamilyAccess] =
    useState<MobileFamilyAccessSummary>(defaultFamilyAccess);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPush, setIsSavingPush] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingRecoveryCode, setIsSavingRecoveryCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [devicePushPermissionStatus, setDevicePushPermissionStatus] =
    useState<NativePushPermissionStatus>("undetermined");
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [recoveryCodeExpanded, setRecoveryCodeExpanded] = useState(false);
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [medicationIntervalExpanded, setMedicationIntervalExpanded] =
    useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(
    null,
  );
  const [recoveryCode, setRecoveryCode] = useState("");
  const [hasRecoveryCode, setHasRecoveryCode] = useState(
    Boolean(session?.account.hasRecoveryCode),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const applySettingsBundle = useCallback(
    (bundle: SettingsBundle) => {
      setPushPreferences(bundle.pushPreferences);
      setPushConfig(bundle.pushConfig);
      setFamilySummary(bundle.familySummary);
      setFamilyAccess(bundle.familyAccess);
      onPushPreferencesChanged?.(bundle.pushPreferences);
      onFamilyAccessChanged?.(bundle.familyAccess);
      onSettingsBundleChanged?.(bundle);
    },
    [onFamilyAccessChanged, onPushPreferencesChanged, onSettingsBundleChanged],
  );

  useEffect(() => {
    setHasRecoveryCode(Boolean(session?.account.hasRecoveryCode));
  }, [session?.account.hasRecoveryCode]);

  useEffect(() => {
    if (visible) {
      return;
    }

    manageSubscriptionPendingRef.current = false;
    setPaywallVisible(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || !session) {
      return;
    }

    const activeSession = session;
    const cachedBundle = getCachedSettingsBundle(activeSession.accessToken);
    let cancelled = false;

    if (cachedBundle) {
      applySettingsBundle(cachedBundle);
      setIsLoading(false);
    }

    async function loadSettings() {
      setIsLoading(!cachedBundle);
      setError(null);

      try {
        const nextBundle = await loadSettingsBundle(activeSession);

        if (cancelled) {
          return;
        }

        applySettingsBundle(nextBundle);
      } catch {
        if (!cancelled && !cachedBundle) {
          setError(content.saveErrorLabel);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [
    applySettingsBundle,
    content.saveErrorLabel,
    session,
    visible,
  ]);

  useEffect(() => {
    if (!visible || !session) {
      return;
    }

    let cancelled = false;

    void syncNativePushSubscription({
      accessToken: session.accessToken,
      promptIfNeeded: false,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        if ("permissionStatus" in result) {
          setDevicePushPermissionStatus(result.permissionStatus);
          return;
        }

        setDevicePushPermissionStatus("undetermined");
      })
      .catch(() => {
        if (!cancelled) {
          setDevicePushPermissionStatus("undetermined");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, visible]);

  const ownershipPolicy = resolveSettingsOwnershipPolicy({
    content,
    session,
    familySummary,
    familyAccess,
  });
  const pushMasterEnabled = isPushMasterEnabled(pushPreferences);
  const notificationsPermissionHint =
    pushConfig.enabled && devicePushPermissionStatus === "denied"
      ? content.notificationsPermissionDeniedHint
      : null;

  const selectedCabinetDays = useMemo(
    () => getSelectedCabinetDays(pushPreferences),
    [
      pushPreferences.cabinetNotify10Days,
      pushPreferences.cabinetNotify3Days,
      pushPreferences.cabinetNotify7Days,
    ],
  );

  const resetTransientMessages = () => {
    setError(null);
    setSuccess(null);
    setPasswordSubmitError(null);
  };

  const passwordInlineHint = getPasswordInlineHint(
    passwordForm,
    content.passwordsMismatch,
    passwordSubmitError,
  );

  const handleMedicationIntervalUnitSelect = async (
    nextUnit: MedicationIntervalUnit,
  ) => {
    const result = await saveMedicationIntervalUnitPreference({
      nextUnit,
      currentUnit: medicationIntervalUnit,
      saveErrorLabel: content.saveErrorLabel,
    });

    if (result.blocked) {
      setMedicationIntervalExpanded(false);
      return;
    }

    setMedicationIntervalUnit(nextUnit);
    setMedicationIntervalExpanded(false);
    resetTransientMessages();

    if (result.submitError) {
      setError(result.submitError);
    }
  };

  const handleLanguageSelect = async (nextLocale: MobileLocale) => {
    const result = await saveSettingsPreferredLanguage({
      isSavingLanguage,
      nextLocale,
      currentLocale: locale,
      onUpdatePreferredLanguage,
      saveErrorLabel: content.saveErrorLabel,
    });

    if (result.blocked) {
      setLanguageExpanded(false);
      return;
    }

    setIsSavingLanguage(true);
    resetTransientMessages();

    if (result.success) {
      setLanguageExpanded(false);
      setIsSavingLanguage(false);
      return;
    }

    setError(result.submitError ?? content.saveErrorLabel);
    setIsSavingLanguage(false);
  };

  const patchPushPreferences = async (
    patch: Partial<MobilePushPreferences>,
    optimistic?: MobilePushPreferences,
  ) => {
    const previous = pushPreferences;
    const nextOptimistic = optimistic ?? {
      ...pushPreferences,
      ...patch,
    };

    const result = await patchSettingsPushPreferences({
      session,
      isSavingPush,
      patch,
      previous,
      optimistic: nextOptimistic,
      saveErrorLabel: content.saveErrorLabel,
    });

    if (result.blocked) {
      return;
    }

    setPushPreferences(nextOptimistic);
    setIsSavingPush(true);
    resetTransientMessages();

    if (result.nextPreferences) {
      setPushPreferences(result.nextPreferences);
      patchCachedSettingsBundle(session?.accessToken ?? null, {
        pushPreferences: result.nextPreferences,
      });
      onPushPreferencesChanged?.(result.nextPreferences);
      setIsSavingPush(false);
      return;
    }

    setPushPreferences(result.revertPreferences ?? previous);
    setError(result.submitError ?? content.saveErrorLabel);
    setIsSavingPush(false);
  };

  const handleMasterPushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!session?.accessToken) {
        return;
      }

      setIsSavingPush(true);
      resetTransientMessages();

      try {
        const syncResult = await syncNativePushSubscription({
          accessToken: session.accessToken,
          promptIfNeeded: true,
        });

        if (syncResult.status !== "enabled") {
          if ("permissionStatus" in syncResult) {
            setDevicePushPermissionStatus(syncResult.permissionStatus);
          }

          if (
            syncResult.status === "permission_denied" &&
            syncResult.permissionStatus === "denied"
          ) {
            Alert.alert(
              content.notificationsPermissionPromptTitle,
              content.notificationsPermissionPromptBody,
              [
                { text: content.cancelActionLabel, style: "cancel" },
                {
                  text: content.notificationsOpenSettingsLabel,
                  onPress: () => {
                    void openNativeNotificationSettings();
                  },
                },
              ],
            );
          }

          setError(content.saveErrorLabel);
          setIsSavingPush(false);
          return;
        }

        setDevicePushPermissionStatus(syncResult.permissionStatus);
      } catch {
        setError(content.saveErrorLabel);
        setIsSavingPush(false);
        return;
      }

      setIsSavingPush(false);
    }

    const optimistic = buildOptimisticMasterPushPreferences(
      pushPreferences,
      enabled,
    );

    await patchPushPreferences(
      {
        childrenEnabled: enabled,
        pillboxEnabled: enabled,
        cabinetNotify10Days: optimistic.cabinetNotify10Days,
        cabinetNotify7Days: optimistic.cabinetNotify7Days,
        cabinetNotify3Days: optimistic.cabinetNotify3Days,
      },
      optimistic,
    );
  };

  const handleCabinetReminderDaysSelect = async (days: 10 | 7 | 3) => {
    await patchPushPreferences(buildCabinetReminderPatch(days));
  };

  const handleSavePassword = async () => {
    const result = await saveSettingsPassword({
      session,
      isSavingPassword,
      passwordForm,
      locale,
      content,
    });

    if (result.blocked) {
      return;
    }

    if (result.validationError) {
      setError(result.validationError);
      return;
    }

    setIsSavingPassword(true);
    resetTransientMessages();

    if (result.nextPasswordForm) {
      setPasswordForm(result.nextPasswordForm);
      setPasswordExpanded(false);
      setSuccess(result.successMessage ?? null);
      setIsSavingPassword(false);
      return;
    }

    setPasswordSubmitError(result.submitError ?? content.saveErrorLabel);
    setIsSavingPassword(false);
  };

  const handleSaveRecoveryCode = async () => {
    const result = await saveSettingsRecoveryCode({
      session,
      isSavingRecoveryCode,
      recoveryCode,
      content,
    });

    if (result.blocked) {
      return;
    }

    if (result.validationError) {
      setError(result.validationError);
      return;
    }

    setIsSavingRecoveryCode(true);
    resetTransientMessages();

    if (typeof result.nextRecoveryCode === "string") {
      setRecoveryCode(result.nextRecoveryCode);
      setRecoveryCodeExpanded(false);
      setHasRecoveryCode(Boolean(result.hasRecoveryCode));
      setSuccess(result.successMessage ?? null);
      setIsSavingRecoveryCode(false);
      return;
    }

    setError(result.submitError ?? content.saveErrorLabel);
    setIsSavingRecoveryCode(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    resetTransientMessages();

    try {
      await executeSettingsDeletion({
        session,
        usesFamilyDeleteEndpoint: ownershipPolicy.usesFamilyDeleteEndpoint,
      });
      await onSessionDeleted();
    } catch {
      setError(content.saveErrorLabel);
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!session || isDeleting) {
      return;
    }

    if (ownershipPolicy.deletionBlocked) {
      Alert.alert(
        ownershipPolicy.blockedDeleteTitle,
        ownershipPolicy.blockedDeleteMessage,
        [{ text: content.cancelActionLabel, style: "cancel" }],
      );
      return;
    }

    Alert.alert(
      ownershipPolicy.confirmDeleteTitle,
      ownershipPolicy.confirmDeleteMessage,
      [
        { text: content.cancelActionLabel, style: "cancel" },
        {
          text: content.confirmDeleteAction,
          style: "destructive",
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
  };

  const subscriptionExpiresAtLabel = formatSubscriptionExpiresAt(
    locale,
    familySummary.subscriptionExpiresAt,
  );
  const shouldOpenPurchasePaywall =
    familyAccess.subscriptionStatus === "inactive" ||
    familyAccess.subscriptionStatus === "expired" ||
    !familyAccess.premiumActive;

  const refreshSettingsAfterBilling = async () => {
    if (!session) {
      return;
    }

    try {
      const nextBundle = await loadSettingsBundle(session);
      applySettingsBundle(nextBundle);
    } catch {
      setError(content.saveErrorLabel);
    }
  };

  const handleManageSubscription = async () => {
    if (shouldOpenPurchasePaywall) {
      setPaywallVisible(true);
      return;
    }

    if (manageSubscriptionPendingRef.current) {
      return;
    }

    manageSubscriptionPendingRef.current = true;
    try {
      await openSystemSubscriptionManagement();
    } catch {
      setError(content.saveErrorLabel);
    } finally {
      manageSubscriptionPendingRef.current = false;
    }
  };

  const handleSendTestPush = async () => {
    if (!session || isSendingTestPush) {
      return;
    }

    setIsSendingTestPush(true);
    setError(null);
    setSuccess(content.debugTestPushSending);

    try {
      console.log("[PushTest] starting", {
        accountId: session.account.id,
        hasAccessToken: Boolean(session.accessToken),
      });

      const pushSyncResult = await syncNativePushSubscription({
        accessToken: session.accessToken,
        promptIfNeeded: true,
      });

      console.log("[PushTest] sync result", pushSyncResult);

      setDevicePushPermissionStatus(
        "permissionStatus" in pushSyncResult
          ? pushSyncResult.permissionStatus
          : "undetermined",
      );

      if (pushSyncResult.status === "permission_denied") {
        setError(content.notificationsPermissionDeniedHint);
        setSuccess(null);
        Alert.alert(
          content.debugTestPushLabel,
          content.notificationsPermissionDeniedHint,
        );
        return;
      }

      if (
        pushSyncResult.status === "unsupported" ||
        pushSyncResult.status === "disabled" ||
        pushSyncResult.status === "token_missing"
      ) {
        setError(content.debugTestPushFailed);
        setSuccess(null);
        Alert.alert(
          content.debugTestPushLabel,
          `${content.debugTestPushFailed} (${pushSyncResult.status})`,
        );
        return;
      }

      const result = await sendTestPushNotification({
        accessToken: session.accessToken,
      });

      console.log("[PushTest] backend result", result);

      if (!result.sent && result.subscriptionCount === 0) {
        setSuccess(content.debugTestPushNoSubscriptions);
        Alert.alert(
          content.debugTestPushLabel,
          content.debugTestPushNoSubscriptions,
        );
        return;
      }

      if (!result.sent) {
        setError(content.debugTestPushFailed);
        setSuccess(null);
        Alert.alert(content.debugTestPushLabel, content.debugTestPushFailed);
        return;
      }

      const successMessage = `${content.debugTestPushSent} (${result.subscriptionCount})`;
      setSuccess(successMessage);
      Alert.alert(content.debugTestPushLabel, successMessage);
    } catch (error) {
      console.warn("[PushTest] failed", error);
      setError(content.debugTestPushFailed);
      setSuccess(null);
      Alert.alert(content.debugTestPushLabel, content.debugTestPushFailed);
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return {
    error,
    familyAccess,
    hasRecoveryCode,
    isDeleting,
    isLoading,
    isSavingPush,
    languageExpanded,
    medicationIntervalExpanded,
    notificationsPermissionHint,
    ownershipPolicy,
    passwordExpanded,
    passwordForm,
    passwordInlineHint,
    paywallVisible,
    pushConfig,
    pushMasterEnabled,
    pushPreferences,
    recoveryCode,
    recoveryCodeExpanded,
    selectedCabinetDays,
    subscriptionExpanded,
    subscriptionExpiresAtLabel,
    success,
    confirmDelete,
    handleCabinetReminderDaysSelect,
    handleLanguageSelect,
    handleManageSubscription,
    handleMasterPushToggle,
    handleMedicationIntervalUnitSelect,
    handleSavePassword,
    handleSaveRecoveryCode,
    handleSendTestPush,
    patchPushPreferences,
    refreshSettingsAfterBilling,
    resetTransientMessages,
    setError,
    setLanguageExpanded,
    setMedicationIntervalExpanded,
    setPasswordExpanded,
    setPasswordForm,
    setPaywallVisible,
    setRecoveryCode,
    setRecoveryCodeExpanded,
    setSubscriptionExpanded,
  };
}
