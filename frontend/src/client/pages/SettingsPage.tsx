import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, deleteMyAccount, deleteMyFamily } from "@shared/api/auth";
import {
  deletePushSubscription,
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  updatePushNotificationPreferences,
  upsertPushSubscription,
} from "@shared/api/pushNotifications";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { DisclosureHeader } from "@shared/components/DisclosureHeader";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { AppLanguage } from "@shared/i18n";
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

const settingsCopy = {
  ru: {
    title: "Настройки",
    subtitle: "Язык, тема, уведомления и безопасность.",
    pushConfigCheckFailed: "Не удалось быстро проверить настройки push на сервере.",
    reminderSaveFailed: "Не удалось сохранить время дополнительного напоминания.",
    devicePushCheckFailed: "Не удалось быстро проверить push на этом устройстве.",
    passwordUpdated: "Пароль обновлён.",
    passwordChangeFailed: "Не удалось сменить пароль.",
    pushServerNotReady: "Push-уведомления ещё не настроены на сервере.",
    pushUnsupported: "На этом устройстве push-уведомления недоступны.",
    permissionTimeout: "Браузер не завершил запрос разрешения на уведомления.",
    permissionDenied: "Браузер не дал разрешение на уведомления.",
    nativePermissionBlockedTitle: "Уведомления выключены в iOS",
    nativePermissionBlockedDescription:
      "PillPath больше не может показать системный запрос. Откройте настройки iPhone и включите уведомления для приложения.",
    openSystemSettings: "Открыть настройки",
    nativePermissionManualHint:
      "Если настройки не открылись автоматически: iPhone → Настройки → PillPath → Уведомления.",
    subscribeTimeout: "Не удалось завершить подписку устройства на push.",
    serverAcceptFailed: "Сервер не принял подписку устройства.",
    enablePushFailed: "Не удалось включить уведомления на этом устройстве.",
    disablePushFailed: "Не удалось отключить уведомления.",
    fillAllPasswordFields: "Заполните все поля пароля.",
    passwordsMismatch: "Новый пароль и подтверждение не совпадают.",
    passwordTooShort: "Новый пароль должен быть не короче 6 символов.",
    changePassword: "Сменить пароль",
    changePasswordHint: "Открывается только когда нужно, чтобы не перегружать экран.",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmNewPassword: "Повтори новый пароль",
    saving: "Сохраняем…",
    updatePassword: "Обновить пароль",
    medicationPlans: "Планы лекарств",
    medicationPlansHint: "Как показывать интервал в планах: в часах или в минутах.",
    hours: "Часы",
    minutes: "Минуты",
    appSettings: "Настройки приложения",
    appSettingsHint: "Язык интерфейса и тема для вашего аккаунта.",
    interfaceLanguage: "Язык",
    interfaceTheme: "Тема",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    themeAuto: "Авто",
    notifications: "Уведомления",
    notificationsHint:
      "Пуш в момент события приходит всегда. Здесь вы настраиваете дополнительные уведомления.",
    childrenReminders: "Уведомление по детям",
    pillboxReminders: "Уведомление по таблетнице",
    childrenRemindersSoftText: "Мягкое напоминание заранее, чтобы спокойно подготовиться.",
    pillboxRemindersSoftText: "Короткий сигнал заранее, чтобы не держать всё в голове.",
    pushServerMissing: "Серверная отправка push пока не настроена.",
    disableNotifications: "Выключить уведомления",
    enableNotifications: "Включить уведомления",
    reminderOn: "Вкл",
    reminderOff: "Выкл",
    minShort: "мин",
    cabinetReminders: "Уведомление по аптечке",
    cabinetRemindersSoftText: "Напомним заранее, чтобы вы успели проверить аптечку дома.",
    notificationsStatusOn: "Активно",
    notificationsStatusOff: "Неактивно",
    confirmDisableNotifications: "Точно выключить push-уведомления на этом устройстве?",
    cancel: "Отмена",
    confirmDisable: "Да, выключить",
    days10: "За 10 дней",
    days7: "За 7 дней",
    days3: "За 3 дня",
    dangerZone: "Опасная зона",
    dangerZoneHint:
      "Удаление аккаунта необратимо. Если вы единственный участник семьи, семейные данные тоже будут удалены.",
    deleteAccount: "Удалить аккаунт",
    deleteAccountDescription:
      "После удаления аккаунта вы сразу выйдете из приложения. Если вы единственный owner, права owner автоматически перейдут следующему участнику.",
    deleteAccountConfirmTitle: "Точно удалить аккаунт?",
    deleteAccountConfirmDescription:
      "Аккаунт будет деактивирован. Вход в него станет недоступен, восстановление не предусмотрено.",
    deleteAccountConfirmAction: "Да, удалить аккаунт",
    deleteAccountFailed: "Не удалось удалить аккаунт.",
    deleteFamily: "Удалить семью полностью",
    deleteFamilyDescription:
      "Удаляет доступ ко всем аккаунтам семьи. Все участники будут разлогинены и деактивированы.",
    deleteFamilyConfirmTitle: "Точно удалить семью?",
    deleteFamilyConfirmDescription: "Все аккаунты семьи будут деактивированы. Действие необратимо.",
    deleteFamilyConfirmAction: "Да, удалить семью",
    deleteFamilyFailed: "Не удалось удалить семью.",
  },
  en: {
    title: "Settings",
    subtitle: "Language, theme, reminders and security.",
    pushConfigCheckFailed: "Could not quickly verify push settings on the server.",
    reminderSaveFailed: "Could not save the advance reminder time.",
    devicePushCheckFailed: "Could not quickly verify push on this device.",
    passwordUpdated: "Password updated.",
    passwordChangeFailed: "Could not change the password.",
    pushServerNotReady: "Push notifications are not configured on the server yet.",
    pushUnsupported: "Push notifications are not available on this device.",
    permissionTimeout: "The browser did not finish the notification permission request.",
    permissionDenied: "The browser did not grant notification permission.",
    nativePermissionBlockedTitle: "Notifications are off in iOS",
    nativePermissionBlockedDescription:
      "PillPath cannot show the system prompt again. Open iPhone settings and enable notifications for the app.",
    openSystemSettings: "Open Settings",
    nativePermissionManualHint:
      "If Settings did not open automatically: iPhone → Settings → PillPath → Notifications.",
    subscribeTimeout: "Could not finish subscribing this device to push.",
    serverAcceptFailed: "The server did not accept the device subscription.",
    enablePushFailed: "Could not enable notifications on this device.",
    disablePushFailed: "Could not disable notifications.",
    fillAllPasswordFields: "Fill in all password fields.",
    passwordsMismatch: "New password and confirmation do not match.",
    passwordTooShort: "The new password must be at least 6 characters long.",
    changePassword: "Change password",
    changePasswordHint: "Keep this collapsed until needed.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Repeat new password",
    saving: "Saving…",
    updatePassword: "Update password",
    medicationPlans: "Medication plans",
    medicationPlansHint: "How to show interval values in plans: hours or minutes.",
    hours: "Hours",
    minutes: "Minutes",
    appSettings: "App settings",
    appSettingsHint: "Interface language and app theme for your account.",
    interfaceLanguage: "Language",
    interfaceTheme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeAuto: "Auto",
    notifications: "Notifications",
    notificationsHint:
      "The push at the event time is always sent. Here you configure additional reminders.",
    childrenReminders: "Child reminders",
    pillboxReminders: "Pillbox reminders",
    childrenRemindersSoftText: "A gentle early reminder so you can prepare calmly.",
    pillboxRemindersSoftText: "A short early heads-up, so you do not keep everything in mind.",
    pushServerMissing: "Server-side push delivery is not configured yet.",
    disableNotifications: "Turn off notifications",
    enableNotifications: "Turn on notifications",
    reminderOn: "On",
    reminderOff: "Off",
    minShort: "min",
    cabinetReminders: "Cabinet reminders",
    cabinetRemindersSoftText: "An early reminder so you have time to review your home cabinet.",
    notificationsStatusOn: "On",
    notificationsStatusOff: "Inactive",
    confirmDisableNotifications: "Turn off push notifications on this device?",
    cancel: "Cancel",
    confirmDisable: "Yes, turn off",
    days10: "10 days before",
    days7: "7 days before",
    days3: "3 days before",
    dangerZone: "Danger zone",
    dangerZoneHint:
      "Account deletion is irreversible. If you are the only family member, family data will be deleted too.",
    deleteAccount: "Delete account",
    deleteAccountDescription:
      "After deletion, you will be signed out immediately. If you are the only owner, owner rights are reassigned automatically.",
    deleteAccountConfirmTitle: "Delete account permanently?",
    deleteAccountConfirmDescription:
      "The account will be deactivated. Login will no longer be possible.",
    deleteAccountConfirmAction: "Yes, delete account",
    deleteAccountFailed: "Could not delete the account.",
    deleteFamily: "Delete family completely",
    deleteFamilyDescription:
      "Removes access for all family accounts. All members will be signed out and deactivated.",
    deleteFamilyConfirmTitle: "Delete family completely?",
    deleteFamilyConfirmDescription:
      "All family accounts will be deactivated. This action cannot be undone.",
    deleteFamilyConfirmAction: "Yes, delete family",
    deleteFamilyFailed: "Could not delete the family.",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function tSettings(language: AppLanguage, key: keyof (typeof settingsCopy)["ru"]) {
  return settingsCopy[language][key];
}

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
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
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
  const childrenEarlyReminderEnabled = Number(selectedReminderMinutes) > 0;
  const pillboxEarlyReminderEnabled = Number(selectedPillboxReminderMinutes) > 0;
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
  }, [language]);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      changePassword(payload),
    onSuccess: () => {
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
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={tSettings(language, "title")}
        subtitle={tSettings(language, "subtitle")}
        compactOnMobile
        hideOnMobile
      />

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{tSettings(language, "appSettings")}</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tSettings(language, "appSettingsHint")}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="soft-card relative z-20 overflow-visible rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted">
              {tSettings(language, "interfaceLanguage")}
            </p>
            <div className="mt-3">
              <LanguageSwitch triggerClassName="soft-button-secondary min-h-[2.85rem] px-3.5 text-[0.84rem] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]" />
            </div>
          </div>

          <div className="soft-card relative z-10 rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted">
              {tSettings(language, "interfaceTheme")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { value: "light", label: tSettings(language, "themeLight") },
                  { value: "dark", label: tSettings(language, "themeDark") },
                  { value: "system", label: tSettings(language, "themeAuto") },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`${
                    theme === option.value ? "soft-tab-active" : "soft-tab"
                  } inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{tSettings(language, "medicationPlans")}</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tSettings(language, "medicationPlansHint")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { value: "hours", label: tSettings(language, "hours") },
              { value: "minutes", label: tSettings(language, "minutes") },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMedicationIntervalUnit(option.value)}
              className={`${
                medicationIntervalUnit === option.value ? "soft-tab-active" : "soft-tab"
              } inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="app-card-title">{tSettings(language, "notifications")}</p>
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border text-[0.68rem] font-semibold ${
                isPushEnabled
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300"
              }`}
            >
              {isPushEnabled ? "✓" : "✕"}
            </span>
            <span
              className={`text-xs ${
                isPushEnabled ? "text-muted" : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {isPushEnabled
                ? tSettings(language, "notificationsStatusOn")
                : tSettings(language, "notificationsStatusOff")}
            </span>
          </div>
          <button
            type="button"
            onClick={handleGlobalPushSwitchToggle}
            disabled={isGlobalPushSwitchDisabled}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
              isPushEnabled
                ? "border-emerald-500/45 bg-emerald-500/25"
                : "border-amber-500/45 bg-amber-500/20"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label={
              isPushEnabled
                ? tSettings(language, "disableNotifications")
                : tSettings(language, "enableNotifications")
            }
          >
            <span
              className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
                isPushEnabled ? "translate-x-6 text-emerald-600" : "translate-x-1 text-amber-700"
              }`}
            >
              {isPushEnabled ? "✓" : "✕"}
            </span>
          </button>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tSettings(language, "notificationsHint")}
        </p>
        {pushError && (
          <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">{pushError}</div>
        )}
        {isNativePushBlocked && !pushError ? (
          <div className="soft-note-warning mt-4 space-y-3 rounded-2xl px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">
              {tSettings(language, "nativePermissionBlockedTitle")}
            </p>
            <p className="leading-6 text-muted">
              {tSettings(language, "nativePermissionBlockedDescription")}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsNativePushSettingsDialogOpen(true);
              }}
              className="soft-button-secondary inline-flex min-h-[2.55rem] items-center justify-center px-4 text-[0.84rem]"
            >
              {tSettings(language, "openSystemSettings")}
            </button>
          </div>
        ) : null}
        {!isPushConfigLoading && pushConfig && !pushConfig.enabled && (
          <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
            {tSettings(language, "pushServerMissing")}
          </div>
        )}
        {isPushEnabled ? (
          <div className="mt-5 border-t border-border/70 pt-4">
            <div className="soft-card mt-3 rounded-[20px] border border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {tSettings(language, "childrenReminders")}
                </p>
                <button
                  type="button"
                  onClick={() => handleChildrenEarlyReminderToggle(!childrenEarlyReminderEnabled)}
                  disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                    childrenEarlyReminderEnabled
                      ? "border-emerald-500/45 bg-emerald-500/25"
                      : "border-border bg-card-muted"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-label={
                    childrenEarlyReminderEnabled
                      ? tSettings(language, "reminderOff")
                      : tSettings(language, "reminderOn")
                  }
                >
                  <span
                    className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
                      childrenEarlyReminderEnabled
                        ? "translate-x-6 text-emerald-600"
                        : "translate-x-1 text-slate-500"
                    }`}
                  >
                    {childrenEarlyReminderEnabled ? "✓" : "✕"}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {tSettings(language, "childrenRemindersSoftText")}
              </p>
              {childrenEarlyReminderEnabled ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[5, 10, 15].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleReminderMinutesChange(String(minutes))}
                      disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                      className={`${
                        selectedReminderMinutes === String(minutes) ? "soft-tab-active" : "soft-tab"
                      } inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.02em] disabled:opacity-50`}
                    >
                      {minutes} {tSettings(language, "minShort")}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="soft-card mt-5 rounded-[20px] border border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {tSettings(language, "pillboxReminders")}
                </p>
                <button
                  type="button"
                  onClick={() => handlePillboxEarlyReminderToggle(!pillboxEarlyReminderEnabled)}
                  disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                    pillboxEarlyReminderEnabled
                      ? "border-emerald-500/45 bg-emerald-500/25"
                      : "border-border bg-card-muted"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-label={
                    pillboxEarlyReminderEnabled
                      ? tSettings(language, "reminderOff")
                      : tSettings(language, "reminderOn")
                  }
                >
                  <span
                    className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
                      pillboxEarlyReminderEnabled
                        ? "translate-x-6 text-emerald-600"
                        : "translate-x-1 text-slate-500"
                    }`}
                  >
                    {pillboxEarlyReminderEnabled ? "✓" : "✕"}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {tSettings(language, "pillboxRemindersSoftText")}
              </p>
              {pillboxEarlyReminderEnabled ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[5, 10, 15].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handlePillboxReminderMinutesChange(String(minutes))}
                      disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                      className={`${
                        selectedPillboxReminderMinutes === String(minutes)
                          ? "soft-tab-active"
                          : "soft-tab"
                      } inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.02em] disabled:opacity-50`}
                    >
                      {minutes} {tSettings(language, "minShort")}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {isPushEnabled ? (
          <div className="mt-5 border-t border-border/70 pt-4">
            <div className="soft-card mt-3 rounded-[20px] border border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {tSettings(language, "cabinetReminders")}
                </p>
                <button
                  type="button"
                  onClick={() => handleCabinetEarlyReminderToggle(!cabinetEarlyReminderEnabled)}
                  disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                    cabinetEarlyReminderEnabled
                      ? "border-emerald-500/45 bg-emerald-500/25"
                      : "border-border bg-card-muted"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-label={
                    cabinetEarlyReminderEnabled
                      ? tSettings(language, "reminderOff")
                      : tSettings(language, "reminderOn")
                  }
                >
                  <span
                    className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
                      cabinetEarlyReminderEnabled
                        ? "translate-x-6 text-emerald-600"
                        : "translate-x-1 text-slate-500"
                    }`}
                  >
                    {cabinetEarlyReminderEnabled ? "✓" : "✕"}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {tSettings(language, "cabinetRemindersSoftText")}
              </p>
              {cabinetEarlyReminderEnabled ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    {
                      key: 10 as const,
                      label: tSettings(language, "days10"),
                    },
                    {
                      key: 7 as const,
                      label: tSettings(language, "days7"),
                    },
                    {
                      key: 3 as const,
                      label: tSettings(language, "days3"),
                    },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleCabinetReminderSelect(option.key)}
                      disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                      className={`${
                        selectedCabinetReminderDays === option.key ? "soft-tab-active" : "soft-tab"
                      } inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.02em] disabled:opacity-50`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Surface>

      <Surface className="p-5 sm:p-6">
        <DisclosureHeader
          isOpen={isPasswordFormOpen}
          onToggle={() => setIsPasswordFormOpen((current) => !current)}
        >
          <>
            <p className="app-card-title">{tSettings(language, "changePassword")}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {tSettings(language, "changePasswordHint")}
            </p>
          </>
        </DisclosureHeader>
        {isPasswordFormOpen ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tSettings(language, "currentPassword")}</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="soft-input w-full px-4"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tSettings(language, "newPassword")}</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="soft-input w-full px-4"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="soft-field-label">
                  {tSettings(language, "confirmNewPassword")}
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="soft-input w-full px-4"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSubmitPasswordChange}
                disabled={changePasswordMutation.isPending}
                className="app-btn-primary-md soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5"
              >
                {changePasswordMutation.isPending
                  ? tSettings(language, "saving")
                  : tSettings(language, "updatePassword")}
              </button>
              {passwordSuccess ? (
                <p className="soft-text-success text-sm">{passwordSuccess}</p>
              ) : null}
            </div>
            {passwordError ? (
              <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                {passwordError}
              </div>
            ) : null}
          </>
        ) : null}
      </Surface>
      <Surface className="p-5 sm:p-6">
        <p className="app-card-title text-[color:var(--color-danger)]">
          {tSettings(language, "dangerZone")}
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">{tSettings(language, "dangerZoneHint")}</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {tSettings(language, "deleteAccountDescription")}
        </p>
        {deleteAccountError ? (
          <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
            {deleteAccountError}
          </div>
        ) : null}
        {accountFamilyRole === "owner" ? (
          <>
            <p className="mt-4 text-sm leading-6 text-muted">
              {tSettings(language, "deleteFamilyDescription")}
            </p>
            {deleteFamilyError ? (
              <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                {deleteFamilyError}
              </div>
            ) : null}
          </>
        ) : null}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteAccountError(null);
                setIsDeleteAccountConfirmOpen(true);
              }}
              className="app-btn-danger-md soft-button-danger inline-flex min-h-[2.95rem] items-center justify-center px-4 sm:min-h-[3.1rem] sm:px-5"
            >
              {tSettings(language, "deleteAccount")}
            </button>
            {accountFamilyRole === "owner" ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteFamilyError(null);
                  setIsDeleteFamilyConfirmOpen(true);
                }}
                className="app-btn-danger-md soft-button-danger inline-flex min-h-[2.95rem] items-center justify-center px-4 sm:min-h-[3.1rem] sm:px-5"
              >
                {tSettings(language, "deleteFamily")}
              </button>
            ) : null}
          </div>
        </div>
      </Surface>
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
