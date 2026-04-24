import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { Link } from "react-router-dom";
import { changePassword, deleteMyAccount, deleteMyFamily } from "@shared/api/auth";
import {
  deletePushSubscription,
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  sendTestPushNotification,
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
  getCachedNativePushSubscriptionPayload,
  getNativePushPermissionStatus,
  getNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  openNativeNotificationSettings,
  setNativePushOptOut,
} from "@shared/utils/nativePushNotifications";
import {
  resolveLiveActivityPreferences,
  syncLiveActivityPreferencesMirror,
} from "@shared/utils/liveActivityPreferences";
import { SettingsAppPreferencesSection } from "./settings/SettingsAppPreferencesSection";
import { tSettings } from "./settings/copy";
import { SettingsLiveActivitiesSection } from "./settings/SettingsLiveActivitiesSection";
import { SettingsNotificationsSection } from "./settings/SettingsNotificationsSection";
import { SettingsSecuritySection } from "./settings/SettingsSecuritySection";
import { stopDisabledLiveActivities } from "@shared/utils/liveActivities";

function getInitialPushStatus() {
  if (!isNativePushSupported()) {
    return "checking" as const;
  }
  if (isNativePushOptedOut()) {
    return "disabled" as const;
  }
  return getCachedNativePushSubscriptionPayload() ? ("enabled" as const) : ("disabled" as const);
}

export function SettingsPage() {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const medicationIntervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const setMedicationIntervalUnit = useAppStore((s) => s.setMedicationIntervalUnit);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">(
    getInitialPushStatus
  );
  const [pushError, setPushError] = useState<string | null>(null);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);
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
    resolveLiveActivityPreferences()
  );
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const isDevTestPushVisible =
    import.meta.env.DEV || import.meta.env.MODE === "mobile-dev";
  const pushSupportIssue = getPushSupportIssue();
  const isPushEnabled = pushStatus === "enabled";

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
  });

  const { data: pushPreferences, isLoading: isPushPreferencesLoading } = useQuery({
    queryKey: ["push", "preferences", "account"],
    queryFn: fetchPushNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });
  const childrenPushEnabled = pushPreferences?.childrenEnabled ?? true;
  const pillboxPushEnabled = pushPreferences?.pillboxEnabled ?? true;
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
      children_enabled?: boolean;
      before_reminder_minutes?: number;
      pillbox_enabled?: boolean;
      pillbox_before_reminder_minutes?: number;
      cabinet_notify_10_days?: boolean;
      cabinet_notify_7_days?: boolean;
      cabinet_notify_3_days?: boolean;
      live_activity_sleep_enabled?: boolean;
      live_activity_feeding_enabled?: boolean;
      live_activity_illness_enabled?: boolean;
    }) => updatePushNotificationPreferences(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["push", "preferences", "account"] });
      const previousPreferences = queryClient.getQueryData(["push", "preferences", "account"]);
      const previousLiveActivitySettings = liveActivitySettings;

      queryClient.setQueryData(
        ["push", "preferences", "account"],
        (current: typeof pushPreferences | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            childrenEnabled: payload.children_enabled ?? current.childrenEnabled,
            beforeReminderMinutes:
              payload.before_reminder_minutes ?? current.beforeReminderMinutes,
            pillboxEnabled: payload.pillbox_enabled ?? current.pillboxEnabled,
            pillboxBeforeReminderMinutes:
              payload.pillbox_before_reminder_minutes ?? current.pillboxBeforeReminderMinutes,
            cabinetNotify10Days: payload.cabinet_notify_10_days ?? current.cabinetNotify10Days,
            cabinetNotify7Days: payload.cabinet_notify_7_days ?? current.cabinetNotify7Days,
            cabinetNotify3Days: payload.cabinet_notify_3_days ?? current.cabinetNotify3Days,
            liveActivitySleepEnabled:
              payload.live_activity_sleep_enabled ?? current.liveActivitySleepEnabled,
            liveActivityFeedingEnabled:
              payload.live_activity_feeding_enabled ?? current.liveActivityFeedingEnabled,
            liveActivityIllnessEnabled:
              payload.live_activity_illness_enabled ?? current.liveActivityIllnessEnabled,
          };
        }
      );

      return { previousPreferences, previousLiveActivitySettings };
    },
    onSuccess: (nextPreferences) => {
      setSelectedReminderMinutes(String(nextPreferences.beforeReminderMinutes));
      setSelectedPillboxReminderMinutes(String(nextPreferences.pillboxBeforeReminderMinutes));
      const nextLiveActivitySettings = resolveLiveActivityPreferences(nextPreferences);
      setLiveActivitySettings(nextLiveActivitySettings);
      syncLiveActivityPreferencesMirror(nextLiveActivitySettings);
      queryClient.setQueryData(["push", "preferences", "account"], nextPreferences);
    },
    onError: (error, _payload, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(["push", "preferences", "account"], context.previousPreferences);
      }
      if (context?.previousLiveActivitySettings) {
        setLiveActivitySettings(context.previousLiveActivitySettings);
        syncLiveActivityPreferencesMirror(context.previousLiveActivitySettings);
      }
      setPushError(
        error instanceof Error ? error.message : tSettings(language, "reminderSaveFailed")
      );
    },
  });

  const sendTestPushMutation = useMutation({
    mutationFn: sendTestPushNotification,
    onMutate: () => {
      setPushError(null);
      setTestPushStatus(language === "ru" ? "Отправляем тестовый push..." : "Sending test push...");
    },
    onSuccess: (result) => {
      if (result.sent) {
        setTestPushStatus(
          language === "ru"
            ? `Тестовый push отправлен. Подписок: ${result.subscriptionCount}.`
            : `Test push sent. Subscriptions: ${result.subscriptionCount}.`
        );
        return;
      }
      setTestPushStatus(
        language === "ru"
          ? "У аккаунта нет активных push-подписок."
          : "This account has no active push subscriptions."
      );
    },
    onError: (error) => {
      setTestPushStatus(null);
      setPushError(
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Тестовый push не отправлен"
            : "Test push failed"
      );
    },
  });

  useEffect(() => {
    if (pushPreferences) {
      setSelectedReminderMinutes(String(pushPreferences.beforeReminderMinutes));
      setSelectedPillboxReminderMinutes(String(pushPreferences.pillboxBeforeReminderMinutes));
      const nextLiveActivitySettings = resolveLiveActivityPreferences(pushPreferences);
      setLiveActivitySettings(nextLiveActivitySettings);
      syncLiveActivityPreferencesMirror(nextLiveActivitySettings);
    }
  }, [pushPreferences]);

  useEffect(() => {
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
          const cachedPayload = getCachedNativePushSubscriptionPayload();
          if (!isCancelled && cachedPayload) {
            setPushStatus("enabled");
            setIsNativePushBlocked(false);
            setIsNativePushSettingsDialogOpen(false);
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
          if (cachedPayload) {
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
  }, [language]);

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

  const resetPasswordDialogState = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleEnablePush = async () => {
    setTestPushStatus(null);
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
    setTestPushStatus(null);
    setIsPushPending(true);
    try {
      if (isNativePushSupported()) {
        const payload =
          (await getNativePushSubscriptionPayload({ promptIfNeeded: false })) ??
          getCachedNativePushSubscriptionPayload();
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

  const handleSendTestPush = () => {
    sendTestPushMutation.mutate();
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
    setPushError(null);
    updatePushPreferencesMutation.mutate({
      children_enabled: enabled,
      before_reminder_minutes:
        enabled && selectedReminderMinutes === "0" ? 10 : undefined,
    });
  };

  const handlePillboxEarlyReminderToggle = (enabled: boolean) => {
    setPushError(null);
    updatePushPreferencesMutation.mutate({
      pillbox_enabled: enabled,
      pillbox_before_reminder_minutes:
        enabled && selectedPillboxReminderMinutes === "0" ? 10 : undefined,
    });
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
    setLiveActivitySettings((current) => {
      const next = { ...current, sleepEnabled: enabled };
      syncLiveActivityPreferencesMirror(next);
      void stopDisabledLiveActivities(next);
      updatePushPreferencesMutation.mutate({ live_activity_sleep_enabled: enabled });
      return next;
    });
  };

  const handleLiveActivityFeedingToggle = (enabled: boolean) => {
    setPushError(null);
    setLiveActivitySettings((current) => {
      const next = { ...current, feedingEnabled: enabled };
      syncLiveActivityPreferencesMirror(next);
      void stopDisabledLiveActivities(next);
      updatePushPreferencesMutation.mutate({ live_activity_feeding_enabled: enabled });
      return next;
    });
  };

  const handleLiveActivityIllnessToggle = (enabled: boolean) => {
    setPushError(null);
    setLiveActivitySettings((current) => {
      const next = { ...current, illnessEnabled: enabled };
      syncLiveActivityPreferencesMirror(next);
      void stopDisabledLiveActivities(next);
      updatePushPreferencesMutation.mutate({ live_activity_illness_enabled: enabled });
      return next;
    });
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
        illnessEnabled={liveActivitySettings.illnessEnabled}
        disabled={!isNativeIos}
        onSleepToggle={handleLiveActivitySleepToggle}
        onFeedingToggle={handleLiveActivityFeedingToggle}
        onIllnessToggle={handleLiveActivityIllnessToggle}
      />
      <SettingsNotificationsSection
        language={language}
        isPushEnabled={isPushEnabled}
        pushError={pushError}
        showTestPushAction={isDevTestPushVisible}
        testPushStatus={testPushStatus}
        isTestPushPending={sendTestPushMutation.isPending}
        isNativePushBlocked={isNativePushBlocked}
        isPushConfigLoading={isPushConfigLoading}
        pushConfigEnabled={pushConfig?.enabled}
        isGlobalPushSwitchDisabled={isGlobalPushSwitchDisabled}
        onGlobalPushSwitchToggle={handleGlobalPushSwitchToggle}
        onSendTestPush={handleSendTestPush}
        onOpenSystemSettingsDialog={() => setIsNativePushSettingsDialogOpen(true)}
        childrenEarlyReminderEnabled={childrenPushEnabled}
        pillboxEarlyReminderEnabled={pillboxPushEnabled}
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
          resetPasswordDialogState();
          setIsPasswordDialogOpen(true);
        }}
        onClosePasswordDialog={() => {
          setIsPasswordDialogOpen(false);
          resetPasswordDialogState();
        }}
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
