import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { Link } from "react-router-dom";
import { changePassword, deleteMyAccount, deleteMyFamily } from "@shared/api/auth";
import {
  deletePushSubscription,
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  updatePushNotificationPreferences,
  upsertPushSubscription,
} from "@shared/api/pushNotifications";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getPushSupportIssue,
  getExistingPushSubscription,
  isPushSupported,
  subscribeToPushNotifications,
  toPushSubscriptionPayload,
  unsubscribeFromPushNotifications,
  withTimeout,
} from "@shared/utils/pushNotifications";
import {
  getNativePushPermissionStatus,
  getNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  openNativeNotificationSettings,
  setNativePushOptOut,
} from "@shared/utils/nativePushNotifications";
import { getLiveActivityPreferencesCache } from "@shared/utils/liveActivityPreferences";
import { SettingsAppPreferencesSection } from "./settings/SettingsAppPreferencesSection";
import { tSettings } from "./settings/copy";
import { SettingsLiveActivitiesSection } from "./settings/SettingsLiveActivitiesSection";
import { SettingsNotificationsSection } from "./settings/SettingsNotificationsSection";
import { SettingsSecuritySection } from "./settings/SettingsSecuritySection";
import { stopDisabledLiveActivities } from "@shared/utils/liveActivities";

export function SettingsPage() {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const medicationIntervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const setMedicationIntervalUnit = useAppStore((s) => s.setMedicationIntervalUnit);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [pushError, setPushError] = useState<string | null>(null);
  const [isPushPending, setIsPushPending] = useState(false);
  const [isDisablePushConfirmOpen, setIsDisablePushConfirmOpen] = useState(false);
  const [isNativePushBlocked, setIsNativePushBlocked] = useState(false);
  const [isNativePushSettingsDialogOpen, setIsNativePushSettingsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [isDeleteFamilyConfirmOpen, setIsDeleteFamilyConfirmOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deleteFamilyError, setDeleteFamilyError] = useState<string | null>(null);
  const [selectedReminderMinutes, setSelectedReminderMinutes] = useState("10");
  const [selectedPillboxReminderMinutes, setSelectedPillboxReminderMinutes] = useState("10");
  const [liveActivitySettings, setLiveActivitySettings] = useState(() =>
    getLiveActivityPreferencesCache()
  );
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const [isPushRuntimeReady, setIsPushRuntimeReady] = useState(!isNativeIos);
  const childrenEarlyReminderEnabled = Number(selectedReminderMinutes) > 0;
  const pillboxEarlyReminderEnabled = Number(selectedPillboxReminderMinutes) > 0;
  const pushSupportIssue = getPushSupportIssue();
  const isPushEnabled = pushStatus === "enabled";

  useEffect(() => {
    if (!isNativeIos) {
      setIsPushRuntimeReady(true);
      return;
    }

    setIsPushRuntimeReady(false);
    const timeoutId = window.setTimeout(() => {
      setIsPushRuntimeReady(true);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isNativeIos]);

  const { data: pushConfig, isLoading: isPushConfigLoading } = useQuery({
    queryKey: ["push", "config", "account"],
    queryFn: () =>
      withTimeout(
        fetchPushNotificationConfig(),
        5000,
        tSettings(language, "pushConfigCheckFailed")
      ),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isPushRuntimeReady,
  });

  const { data: pushPreferences, isLoading: isPushPreferencesLoading } = useQuery({
    queryKey: ["push", "preferences", "account"],
    queryFn: fetchPushNotificationPreferences,
    staleTime: 5 * 60 * 1000,
    enabled: isPushRuntimeReady,
  });
  const cabinetEarlyReminderEnabled =
    (pushPreferences?.cabinetNotify10Days ?? false) ||
    (pushPreferences?.cabinetNotify7Days ?? false) ||
    (pushPreferences?.cabinetNotify3Days ?? false);
  const selectedCabinetReminderDays = pushPreferences?.cabinetNotify10Days
    ? 10
    : pushPreferences?.cabinetNotify7Days
      ? 7
      : pushPreferences?.cabinetNotify3Days
        ? 3
        : null;

  const updatePushPreferencesMutation = useMutation({
    mutationFn: (payload: {
      before_reminder_minutes?: number;
      pillbox_before_reminder_minutes?: number;
      cabinet_notify_10_days?: boolean;
      cabinet_notify_7_days?: boolean;
      cabinet_notify_3_days?: boolean;
      live_activity_sleep_enabled?: boolean;
      live_activity_feeding_enabled?: boolean;
    }) => updatePushNotificationPreferences(payload),
    onSuccess: (nextPreferences) => {
      setSelectedReminderMinutes(String(nextPreferences.beforeReminderMinutes));
      setSelectedPillboxReminderMinutes(String(nextPreferences.pillboxBeforeReminderMinutes));
      queryClient.setQueryData(["push", "preferences", "account"], nextPreferences);
    },
    onError: (error) => {
      setPushError(
        error instanceof Error ? error.message : tSettings(language, "reminderSaveFailed")
      );
    },
  });

  useEffect(() => {
    if (pushPreferences) {
      setSelectedReminderMinutes(String(pushPreferences.beforeReminderMinutes));
      setSelectedPillboxReminderMinutes(String(pushPreferences.pillboxBeforeReminderMinutes));
      setLiveActivitySettings({
        sleepEnabled: pushPreferences.liveActivitySleepEnabled,
        feedingEnabled: pushPreferences.liveActivityFeedingEnabled,
      });
    }
  }, [pushPreferences]);

  useEffect(() => {
    if (!isPushRuntimeReady) {
      setPushStatus("checking");
      setIsNativePushBlocked(false);
      setIsNativePushSettingsDialogOpen(false);
      return;
    }

    if (!isPushSupported() && !isNativePushSupported()) {
      setPushStatus("disabled");
      setIsNativePushBlocked(false);
      setIsNativePushSettingsDialogOpen(false);
      return;
    }
    setPushStatus("checking");
    let isCancelled = false;
    const loadSubscription = async () => {
      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            if (!isCancelled) {
              setPushStatus("disabled");
              setIsNativePushBlocked(false);
              setIsNativePushSettingsDialogOpen(false);
            }
            return;
          }
          const permission = await getNativePushPermissionStatus();
          if (permission === "denied") {
            if (!isCancelled) {
              setPushStatus("disabled");
              setIsNativePushBlocked(true);
              setIsNativePushSettingsDialogOpen(true);
            }
            return;
          }
          const payload = await withTimeout(
            getNativePushSubscriptionPayload({ promptIfNeeded: false }),
            5000,
            tSettings(language, "devicePushCheckFailed")
          );
          if (!isCancelled) {
            setPushStatus(payload ? "enabled" : "disabled");
            setIsNativePushBlocked(false);
            setIsNativePushSettingsDialogOpen(false);
          }
          return;
        }

        const subscription = await withTimeout(
          getExistingPushSubscription(),
          5000,
          tSettings(language, "devicePushCheckFailed")
        );
        if (!isCancelled) {
          setPushStatus(subscription ? "enabled" : "disabled");
        }
      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
          setIsNativePushBlocked(false);
          setIsNativePushSettingsDialogOpen(false);
        }
      }
    };
    void loadSubscription();

    const refreshSubscription = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadSubscription();
    };

    window.addEventListener("push:subscription-changed", refreshSubscription);
    window.addEventListener("focus", refreshSubscription);
    window.addEventListener("pageshow", refreshSubscription);
    document.addEventListener("visibilitychange", refreshSubscription);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", refreshSubscription);
      window.removeEventListener("focus", refreshSubscription);
      window.removeEventListener("pageshow", refreshSubscription);
      document.removeEventListener("visibilitychange", refreshSubscription);
    };
  }, [isPushRuntimeReady, language]);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      changePassword(payload),
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setPasswordSuccess(tSettings(language, "passwordUpdated"));
    },
    onError: (error) => {
      setPasswordSuccess(null);
      setPasswordError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tSettings(language, "passwordChangeFailed"))
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      queryClient.clear();
      window.dispatchEvent(new CustomEvent("auth:logout"));
    },
    onError: (error) => {
      setDeleteAccountError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tSettings(language, "deleteAccountFailed"))
      );
    },
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: deleteMyFamily,
    onSuccess: () => {
      queryClient.clear();
      window.dispatchEvent(new CustomEvent("auth:logout"));
    },
    onError: (error) => {
      setDeleteFamilyError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tSettings(language, "deleteFamilyFailed"))
      );
    },
  });

  const handleEnablePush = async () => {
    if (isNativePushSupported()) {
      setPushError(null);
      setIsPushPending(true);
      try {
        setNativePushOptOut(false);
        const payload = await withTimeout(
          getNativePushSubscriptionPayload({ promptIfNeeded: true }),
          10000,
          tSettings(language, "subscribeTimeout")
        );
        if (!payload) {
          const permission = await getNativePushPermissionStatus();
          if (permission === "denied") {
            setIsNativePushBlocked(true);
            setIsNativePushSettingsDialogOpen(true);
            setPushError(null);
          } else {
            setPushError(tSettings(language, "permissionDenied"));
          }
          return;
        }
        await withTimeout(
          upsertPushSubscription(payload),
          8000,
          tSettings(language, "serverAcceptFailed")
        );
        setPushStatus("enabled");
        setIsNativePushBlocked(false);
        setIsNativePushSettingsDialogOpen(false);
        window.dispatchEvent(new Event("push:subscription-changed"));
      } catch (error) {
        setPushError(
          error instanceof Error ? error.message : tSettings(language, "enablePushFailed")
        );
      } finally {
        setIsPushPending(false);
      }
      return;
    }

    if (pushSupportIssue) {
      setPushError(pushSupportIssue);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushError(tSettings(language, "pushServerNotReady"));
      return;
    }
    if (!isPushSupported() && !isNativePushSupported()) {
      setPushError(tSettings(language, "pushUnsupported"));
      return;
    }
    setPushError(null);
    setIsPushPending(true);
    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        tSettings(language, "permissionTimeout")
      );
      if (permission !== "granted") {
        setPushError(tSettings(language, "permissionDenied"));
        return;
      }
      const subscription = await withTimeout(
        subscribeToPushNotifications(pushConfig.vapidPublicKey),
        10000,
        tSettings(language, "subscribeTimeout")
      );
      await withTimeout(
        upsertPushSubscription(toPushSubscriptionPayload(subscription)),
        8000,
        tSettings(language, "serverAcceptFailed")
      );
      setPushStatus("enabled");
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch (error) {
      setPushError(
        error instanceof Error ? error.message : tSettings(language, "enablePushFailed")
      );
    } finally {
      setIsPushPending(false);
    }
  };

  const handleDisablePush = async (): Promise<boolean> => {
    setPushError(null);
    setIsPushPending(true);
    try {
      if (isNativePushSupported()) {
        const payload = await getNativePushSubscriptionPayload({ promptIfNeeded: false });
        if (payload) {
          await deletePushSubscription({ endpoint: payload.endpoint });
        }
        setNativePushOptOut(true);
        setIsNativePushBlocked(false);
        setIsNativePushSettingsDialogOpen(false);
        setPushStatus("disabled");
        window.dispatchEvent(new Event("push:subscription-changed"));
        return true;
      }

      const subscription = await getExistingPushSubscription();
      if (subscription) {
        await deletePushSubscription({ endpoint: subscription.endpoint });
      }
      await unsubscribeFromPushNotifications();
      const remainingSubscription = await getExistingPushSubscription();
      setPushStatus(remainingSubscription ? "enabled" : "disabled");
      window.dispatchEvent(new Event("push:subscription-changed"));
      return true;
    } catch {
      setPushError(tSettings(language, "disablePushFailed"));
      return false;
    } finally {
      setIsPushPending(false);
    }
  };

  const isGlobalPushSwitchDisabled =
    isPushPending ||
    isPushConfigLoading ||
    pushStatus === "checking" ||
    (!isPushEnabled && (!pushConfig?.enabled || (!isPushSupported() && !isNativePushSupported())));

  const handleGlobalPushSwitchToggle = () => {
    if (isGlobalPushSwitchDisabled) return;
    if (isPushEnabled) {
      setIsDisablePushConfirmOpen(true);
      return;
    }
    void handleEnablePush();
  };

  const handleReminderMinutesChange = (value: string) => {
    setSelectedReminderMinutes(value);
    setPushError(null);
    updatePushPreferencesMutation.mutate({ before_reminder_minutes: parseInt(value, 10) });
  };

  const handlePillboxReminderMinutesChange = (value: string) => {
    setSelectedPillboxReminderMinutes(value);
    setPushError(null);
    updatePushPreferencesMutation.mutate({ pillbox_before_reminder_minutes: parseInt(value, 10) });
  };

  const handleChildrenEarlyReminderToggle = (enabled: boolean) => {
    if (enabled) {
      handleReminderMinutesChange(selectedReminderMinutes === "0" ? "10" : selectedReminderMinutes);
      return;
    }
    handleReminderMinutesChange("0");
  };

  const handlePillboxEarlyReminderToggle = (enabled: boolean) => {
    if (enabled) {
      handlePillboxReminderMinutesChange(
        selectedPillboxReminderMinutes === "0" ? "10" : selectedPillboxReminderMinutes
      );
      return;
    }
    handlePillboxReminderMinutesChange("0");
  };

  const handleCabinetReminderSelect = (days: 10 | 7 | 3) => {
    setPushError(null);
    updatePushPreferencesMutation.mutate({
      cabinet_notify_10_days: days === 10,
      cabinet_notify_7_days: days === 7,
      cabinet_notify_3_days: days === 3,
    });
  };

  const handleCabinetEarlyReminderToggle = (enabled: boolean) => {
    setPushError(null);
    if (enabled) {
      handleCabinetReminderSelect((selectedCabinetReminderDays ?? 10) as 10 | 7 | 3);
      return;
    }
    updatePushPreferencesMutation.mutate({
      cabinet_notify_10_days: false,
      cabinet_notify_7_days: false,
      cabinet_notify_3_days: false,
    });
  };

  const handleLiveActivitySleepToggle = (enabled: boolean) => {
    setPushError(null);
    const previous = liveActivitySettings;
    setLiveActivitySettings((current) => ({ ...current, sleepEnabled: enabled }));
    updatePushPreferencesMutation.mutate(
      { live_activity_sleep_enabled: enabled },
      {
        onSuccess: (nextPreferences) => {
          void stopDisabledLiveActivities({
            sleepEnabled: nextPreferences.liveActivitySleepEnabled,
            feedingEnabled: nextPreferences.liveActivityFeedingEnabled,
          });
        },
        onError: () => {
          setLiveActivitySettings(previous);
        },
      }
    );
  };

  const handleLiveActivityFeedingToggle = (enabled: boolean) => {
    setPushError(null);
    const previous = liveActivitySettings;
    setLiveActivitySettings((current) => ({ ...current, feedingEnabled: enabled }));
    updatePushPreferencesMutation.mutate(
      { live_activity_feeding_enabled: enabled },
      {
        onSuccess: (nextPreferences) => {
          void stopDisabledLiveActivities({
            sleepEnabled: nextPreferences.liveActivitySleepEnabled,
            feedingEnabled: nextPreferences.liveActivityFeedingEnabled,
          });
        },
        onError: () => {
          setLiveActivitySettings(previous);
        },
      }
    );
  };

  const handleSubmitPasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError(tSettings(language, "fillAllPasswordFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError(tSettings(language, "passwordsMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordSuccess(null);
      setPasswordError(tSettings(language, "passwordTooShort"));
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(null);
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={tSettings(language, "title")}
        subtitle={tSettings(language, "subtitle")}
        action={
          <Link
            to="/more"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />
      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/more"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
          </Link>
          <h1 className="app-mobile-section-intro__title">{tSettings(language, "title")}</h1>
          <p className="app-mobile-section-intro__hint">{tSettings(language, "mobileHint")}</p>
        </div>
      </div>
      <SettingsAppPreferencesSection
        language={language}
        theme={theme}
        setTheme={setTheme}
        medicationIntervalUnit={medicationIntervalUnit}
        setMedicationIntervalUnit={setMedicationIntervalUnit}
      />
      <SettingsLiveActivitiesSection
        language={language}
        isIos={isNativeIos}
        sleepEnabled={liveActivitySettings.sleepEnabled}
        feedingEnabled={liveActivitySettings.feedingEnabled}
        disabled={!isPushRuntimeReady || isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
        onSleepToggle={handleLiveActivitySleepToggle}
        onFeedingToggle={handleLiveActivityFeedingToggle}
      />
      <SettingsNotificationsSection
        language={language}
        isPushEnabled={isPushEnabled}
        pushError={pushError}
        isNativePushBlocked={isNativePushBlocked}
        isPushConfigLoading={isPushConfigLoading}
        pushConfigEnabled={pushConfig?.enabled}
        isGlobalPushSwitchDisabled={isGlobalPushSwitchDisabled}
        onGlobalPushSwitchToggle={handleGlobalPushSwitchToggle}
        onOpenSystemSettingsDialog={() => setIsNativePushSettingsDialogOpen(true)}
        childrenEarlyReminderEnabled={childrenEarlyReminderEnabled}
        pillboxEarlyReminderEnabled={pillboxEarlyReminderEnabled}
        cabinetEarlyReminderEnabled={cabinetEarlyReminderEnabled}
        selectedReminderMinutes={selectedReminderMinutes}
        selectedPillboxReminderMinutes={selectedPillboxReminderMinutes}
        selectedCabinetReminderDays={selectedCabinetReminderDays}
        isPushPreferencesLoading={isPushPreferencesLoading}
        isUpdatePending={updatePushPreferencesMutation.isPending}
        onChildrenToggle={handleChildrenEarlyReminderToggle}
        onPillboxToggle={handlePillboxEarlyReminderToggle}
        onCabinetToggle={handleCabinetEarlyReminderToggle}
        onChildrenMinutesChange={handleReminderMinutesChange}
        onPillboxMinutesChange={handlePillboxReminderMinutesChange}
        onCabinetReminderSelect={handleCabinetReminderSelect}
      />
      <SettingsSecuritySection
        language={language}
        isPasswordDialogOpen={isPasswordDialogOpen}
        onOpenPasswordDialog={() => {
          setPasswordError(null);
          setPasswordSuccess(null);
          setIsPasswordDialogOpen(true);
        }}
        onClosePasswordDialog={() => setIsPasswordDialogOpen(false)}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={(value) => {
          setCurrentPassword(value);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        onNewPasswordChange={(value) => {
          setNewPassword(value);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        onConfirmPasswordChange={(value) => {
          setConfirmPassword(value);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        onSubmitPasswordChange={handleSubmitPasswordChange}
        isPasswordPending={changePasswordMutation.isPending}
        passwordSuccess={passwordSuccess}
        passwordError={passwordError}
        accountFamilyRole={accountFamilyRole}
        deleteAccountError={deleteAccountError}
        deleteFamilyError={deleteFamilyError}
        onDeleteAccount={() => {
          setDeleteAccountError(null);
          setIsDeleteAccountConfirmOpen(true);
        }}
        onDeleteFamily={() => {
          setDeleteFamilyError(null);
          setIsDeleteFamilyConfirmOpen(true);
        }}
      />
      <ConfirmDialog
        isOpen={isDisablePushConfirmOpen}
        title={tSettings(language, "disableNotifications")}
        description={tSettings(language, "confirmDisableNotifications")}
        confirmLabel={tSettings(language, "confirmDisable")}
        cancelLabel={tSettings(language, "cancel")}
        confirmTone="danger"
        isPending={isPushPending}
        onCancel={() => setIsDisablePushConfirmOpen(false)}
        onConfirm={() => {
          void (async () => {
            const didDisable = await handleDisablePush();
            if (didDisable) {
              setIsDisablePushConfirmOpen(false);
            }
          })();
        }}
      />
      <ConfirmDialog
        isOpen={isNativePushSettingsDialogOpen}
        title={tSettings(language, "nativePermissionBlockedTitle")}
        description={`${tSettings(language, "nativePermissionBlockedDescription")} ${tSettings(
          language,
          "nativePermissionManualHint"
        )}`}
        confirmLabel={tSettings(language, "openSystemSettings")}
        cancelLabel={tSettings(language, "cancel")}
        onCancel={() => setIsNativePushSettingsDialogOpen(false)}
        onConfirm={() => {
          openNativeNotificationSettings();
          setIsNativePushSettingsDialogOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteAccountConfirmOpen}
        title={tSettings(language, "deleteAccountConfirmTitle")}
        description={tSettings(language, "deleteAccountConfirmDescription")}
        confirmLabel={
          deleteAccountMutation.isPending
            ? tSettings(language, "saving")
            : tSettings(language, "deleteAccountConfirmAction")
        }
        cancelLabel={tSettings(language, "cancel")}
        confirmTone="danger"
        isPending={deleteAccountMutation.isPending}
        onCancel={() => setIsDeleteAccountConfirmOpen(false)}
        onConfirm={() => deleteAccountMutation.mutate()}
      />
      <ConfirmDialog
        isOpen={isDeleteFamilyConfirmOpen}
        title={tSettings(language, "deleteFamilyConfirmTitle")}
        description={tSettings(language, "deleteFamilyConfirmDescription")}
        confirmLabel={
          deleteFamilyMutation.isPending
            ? tSettings(language, "saving")
            : tSettings(language, "deleteFamilyConfirmAction")
        }
        cancelLabel={tSettings(language, "cancel")}
        confirmTone="danger"
        isPending={deleteFamilyMutation.isPending}
        onCancel={() => setIsDeleteFamilyConfirmOpen(false)}
        onConfirm={() => deleteFamilyMutation.mutate()}
      />
    </div>
  );
}
