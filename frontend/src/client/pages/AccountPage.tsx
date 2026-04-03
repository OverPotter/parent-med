import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "@shared/api/auth";
import {
  deletePushSubscription,
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  updatePushNotificationPreferences,
  upsertPushSubscription,
} from "@shared/api/pushNotifications";
import { DisclosureHeader } from "@shared/components/DisclosureHeader";
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

const appBtnPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4";

const accountCopy = {
  ru: {
    pushConfigCheckFailed: "Не удалось быстро проверить настройки push на сервере.",
    reminderSaveFailed: "Не удалось сохранить время дополнительного напоминания.",
    devicePushCheckFailed: "Не удалось быстро проверить push на этом устройстве.",
    passwordUpdated: "Пароль обновлён.",
    passwordChangeFailed: "Не удалось сменить пароль.",
    pushServerNotReady: "Push-уведомления ещё не настроены на сервере.",
    pushUnsupported: "На этом устройстве web push недоступен.",
    permissionTimeout: "Браузер не завершил запрос разрешения на уведомления.",
    permissionDenied: "Браузер не дал разрешение на уведомления.",
    subscribeTimeout: "Не удалось завершить подписку устройства на push.",
    serverAcceptFailed: "Сервер не принял подписку устройства.",
    enablePushFailed: "Не удалось включить уведомления на этом устройстве.",
    disablePushFailed: "Не удалось отключить уведомления.",
    fillAllPasswordFields: "Заполни все поля пароля.",
    passwordsMismatch: "Новый пароль и подтверждение не совпадают.",
    passwordTooShort: "Новый пароль должен быть не короче 6 символов.",
    title: "Аккаунт",
    subtitle: "Личные настройки, уведомления и безопасность.",
    profile: "Профиль",
    familyName: "Имя в семье",
    login: "Логин",
    notSet: "Не указано",
    familyRole: "Роль в семье",
    owner: "Владелец",
    member: "Участник",
    changePassword: "Сменить пароль",
    changePasswordHint: "Открывается только когда нужно, чтобы не перегружать настройки.",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmNewPassword: "Повтори новый пароль",
    saving: "Сохраняем…",
    updatePassword: "Обновить пароль",
    medicationPlans: "Планы лекарства",
    medicationPlansHint:
      "Как показывать и вводить интервал в планах по времени: в часах или в минутах.",
    hours: "Часы",
    minutes: "Минуты",
    notifications: "Уведомления",
    notificationsHint:
      "Одно уведомление приходит всегда, когда препарат уже можно дать. Дополнительно можно выбрать раннее напоминание заранее.",
    pushServerMissing: "Серверная отправка push пока не настроена. Нужны VAPID-ключи на backend.",
    disabling: "Отключаем…",
    enabling: "Подключаем…",
    checkingServer: "Проверяем сервер…",
    checking: "Проверяем…",
    disableNotifications: "Выключить уведомления",
    enableNotifications: "Включить уведомления",
    earlyReminder: "Раннее напоминание",
    earlyReminderHint:
      "Дополнительное уведомление заранее. Основное уведомление в момент следующей дозы остаётся всегда.",
    minShort: "мин",
    cabinetReminders: "Напоминания по аптечке",
    cabinetRemindersHint:
      "Отдельные push-напоминания по сроку годности или сроку после вскрытия. Напоминание за 1 день приходит всегда.",
    days10: "За 10 дней",
    days7: "За 7 дней",
    days3: "За 3 дня",
  },
  en: {
    pushConfigCheckFailed: "Could not quickly verify push settings on the server.",
    reminderSaveFailed: "Could not save the advance reminder time.",
    devicePushCheckFailed: "Could not quickly verify push on this device.",
    passwordUpdated: "Password updated.",
    passwordChangeFailed: "Could not change the password.",
    pushServerNotReady: "Push notifications are not configured on the server yet.",
    pushUnsupported: "Web push is not available on this device.",
    permissionTimeout: "The browser did not finish the notification permission request.",
    permissionDenied: "The browser did not grant notification permission.",
    subscribeTimeout: "Could not finish subscribing this device to push.",
    serverAcceptFailed: "The server did not accept the device subscription.",
    enablePushFailed: "Could not enable notifications on this device.",
    disablePushFailed: "Could not disable notifications.",
    fillAllPasswordFields: "Fill in all password fields.",
    passwordsMismatch: "New password and confirmation do not match.",
    passwordTooShort: "The new password must be at least 6 characters long.",
    title: "Account",
    subtitle: "Personal settings, notifications and security.",
    profile: "Profile",
    familyName: "Family name",
    login: "Login",
    notSet: "Not set",
    familyRole: "Family role",
    owner: "Owner",
    member: "Member",
    changePassword: "Change password",
    changePasswordHint: "This stays collapsed until needed, so settings stay lighter.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Repeat new password",
    saving: "Saving…",
    updatePassword: "Update password",
    medicationPlans: "Medication plans",
    medicationPlansHint: "How to show and enter plan intervals: in hours or in minutes.",
    hours: "Hours",
    minutes: "Minutes",
    notifications: "Notifications",
    notificationsHint:
      "One notification always arrives when it is time to give the medicine. You can also choose an earlier heads-up.",
    pushServerMissing:
      "Server-side push delivery is not configured yet. Backend VAPID keys are required.",
    disabling: "Disabling…",
    enabling: "Enabling…",
    checkingServer: "Checking server…",
    checking: "Checking…",
    disableNotifications: "Turn off notifications",
    enableNotifications: "Turn on notifications",
    earlyReminder: "Advance reminder",
    earlyReminderHint:
      "An extra notification ahead of time. The main notification at the next dose time always stays on.",
    minShort: "min",
    cabinetReminders: "First aid kit reminders",
    cabinetRemindersHint:
      "Separate push reminders for expiry dates or shelf life after opening. The 1-day reminder always stays on.",
    days10: "10 days before",
    days7: "7 days before",
    days3: "3 days before",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function tAccount(language: AppLanguage, key: keyof (typeof accountCopy)["ru"]) {
  return accountCopy[language][key];
}

export function AccountPage() {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const accountLogin = useAppStore((s) => s.accountLogin);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const medicationIntervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const setMedicationIntervalUnit = useAppStore((s) => s.setMedicationIntervalUnit);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [pushError, setPushError] = useState<string | null>(null);
  const [isPushPending, setIsPushPending] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [selectedReminderMinutes, setSelectedReminderMinutes] = useState("10");
  const pushSupportIssue = getPushSupportIssue();
  const isPushEnabled = pushStatus === "enabled";

  const { data: pushConfig, isLoading: isPushConfigLoading } = useQuery({
    queryKey: ["push", "config", "account"],
    queryFn: () =>
      withTimeout(fetchPushNotificationConfig(), 5000, tAccount(language, "pushConfigCheckFailed")),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: pushPreferences, isLoading: isPushPreferencesLoading } = useQuery({
    queryKey: ["push", "preferences", "account"],
    queryFn: fetchPushNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });

  const updatePushPreferencesMutation = useMutation({
    mutationFn: (payload: {
      before_reminder_minutes?: number;
      cabinet_notify_10_days?: boolean;
      cabinet_notify_7_days?: boolean;
      cabinet_notify_3_days?: boolean;
    }) => updatePushNotificationPreferences(payload),
    onSuccess: (nextPreferences) => {
      setSelectedReminderMinutes(String(nextPreferences.beforeReminderMinutes));
      queryClient.setQueryData(["push", "preferences", "account"], nextPreferences);
    },
    onError: (error) => {
      setPushError(
        error instanceof Error ? error.message : tAccount(language, "reminderSaveFailed")
      );
    },
  });

  useEffect(() => {
    if (pushPreferences) {
      setSelectedReminderMinutes(String(pushPreferences.beforeReminderMinutes));
    }
  }, [pushPreferences]);

  useEffect(() => {
    if (!isPushSupported()) {
      setPushStatus("disabled");
      return;
    }
    setPushStatus("checking");
    let isCancelled = false;
    const loadSubscription = async () => {
      try {
        const subscription = await withTimeout(
          getExistingPushSubscription(),
          5000,
          tAccount(language, "devicePushCheckFailed")
        );
        if (!isCancelled) {
          setPushStatus(subscription ? "enabled" : "disabled");
        }
      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
        }
      }
    };
    void loadSubscription();
    return () => {
      isCancelled = true;
    };
  }, []);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      changePassword(payload),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setPasswordSuccess(tAccount(language, "passwordUpdated"));
    },
    onError: (error) => {
      setPasswordSuccess(null);
      setPasswordError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tAccount(language, "passwordChangeFailed"))
      );
    },
  });

  const handleEnablePush = async () => {
    if (pushSupportIssue) {
      setPushError(pushSupportIssue);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushError(tAccount(language, "pushServerNotReady"));
      return;
    }
    if (!isPushSupported()) {
      setPushError(tAccount(language, "pushUnsupported"));
      return;
    }
    setPushError(null);
    setIsPushPending(true);
    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        tAccount(language, "permissionTimeout")
      );
      if (permission !== "granted") {
        setPushError(tAccount(language, "permissionDenied"));
        return;
      }
      const subscription = await withTimeout(
        subscribeToPushNotifications(pushConfig.vapidPublicKey),
        10000,
        tAccount(language, "subscribeTimeout")
      );
      await withTimeout(
        upsertPushSubscription(toPushSubscriptionPayload(subscription)),
        8000,
        tAccount(language, "serverAcceptFailed")
      );
      setPushStatus("enabled");
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch (error) {
      setPushError(error instanceof Error ? error.message : tAccount(language, "enablePushFailed"));
    } finally {
      setIsPushPending(false);
    }
  };

  const handleDisablePush = async () => {
    setPushError(null);
    setIsPushPending(true);
    try {
      const subscription = await getExistingPushSubscription();
      if (subscription) {
        await deletePushSubscription({ endpoint: subscription.endpoint });
      }
      await unsubscribeFromPushNotifications();
      const remainingSubscription = await getExistingPushSubscription();
      setPushStatus(remainingSubscription ? "enabled" : "disabled");
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch {
      setPushError(tAccount(language, "disablePushFailed"));
    } finally {
      setIsPushPending(false);
    }
  };

  const handleReminderMinutesChange = (value: string) => {
    setSelectedReminderMinutes(value);
    setPushError(null);
    updatePushPreferencesMutation.mutate({ before_reminder_minutes: parseInt(value, 10) });
  };

  const handleCabinetReminderToggle = (
    key: "cabinet_notify_10_days" | "cabinet_notify_7_days" | "cabinet_notify_3_days",
    nextValue: boolean
  ) => {
    setPushError(null);
    updatePushPreferencesMutation.mutate({ [key]: nextValue });
  };

  const handleSubmitPasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError(tAccount(language, "fillAllPasswordFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError(tAccount(language, "passwordsMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordSuccess(null);
      setPasswordError(tAccount(language, "passwordTooShort"));
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
        title={tAccount(language, "title")}
        subtitle={tAccount(language, "subtitle")}
        compactOnMobile
        hideOnMobile
      />

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{tAccount(language, "profile")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label={tAccount(language, "familyName")}
            value={accountDisplayName || accountLogin || tAccount(language, "notSet")}
          />
          <InfoCard
            label={tAccount(language, "login")}
            value={accountLogin ? `@${accountLogin}` : tAccount(language, "notSet")}
          />
          <InfoCard label="Email" value={accountEmail || tAccount(language, "notSet")} />
          <InfoCard
            label={tAccount(language, "familyRole")}
            value={
              accountFamilyRole === "owner"
                ? tAccount(language, "owner")
                : tAccount(language, "member")
            }
          />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <DisclosureHeader
          isOpen={isPasswordFormOpen}
          onToggle={() => setIsPasswordFormOpen((current) => !current)}
        >
          <>
            <p className="app-card-title">{tAccount(language, "changePassword")}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {tAccount(language, "changePasswordHint")}
            </p>
          </>
        </DisclosureHeader>
        {isPasswordFormOpen && (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tAccount(language, "currentPassword")}</span>
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
                <span className="soft-field-label">{tAccount(language, "newPassword")}</span>
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
                <span className="soft-field-label">{tAccount(language, "confirmNewPassword")}</span>
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
                className={`${appBtnPrimaryClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
              >
                {changePasswordMutation.isPending
                  ? tAccount(language, "saving")
                  : tAccount(language, "updatePassword")}
              </button>
              {passwordSuccess && <p className="soft-text-success text-sm">{passwordSuccess}</p>}
            </div>
            {passwordError && (
              <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                {passwordError}
              </div>
            )}
          </>
        )}
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{tAccount(language, "medicationPlans")}</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tAccount(language, "medicationPlansHint")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { value: "hours", label: tAccount(language, "hours") },
              { value: "minutes", label: tAccount(language, "minutes") },
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
        <p className="app-card-title">{tAccount(language, "notifications")}</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tAccount(language, "notificationsHint")}
        </p>
        {pushError && (
          <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">{pushError}</div>
        )}
        {!isPushConfigLoading && pushConfig && !pushConfig.enabled && (
          <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
            {tAccount(language, "pushServerMissing")}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={isPushEnabled ? handleDisablePush : handleEnablePush}
            disabled={
              isPushPending ||
              isPushConfigLoading ||
              pushStatus === "checking" ||
              (!isPushEnabled && (!pushConfig?.enabled || !isPushSupported()))
            }
            className={`${
              isPushEnabled ? "soft-button-danger" : "soft-button-primary"
            } inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]`}
          >
            {isPushPending
              ? isPushEnabled
                ? tAccount(language, "disabling")
                : tAccount(language, "enabling")
              : isPushConfigLoading
                ? tAccount(language, "checkingServer")
                : pushStatus === "checking"
                  ? tAccount(language, "checking")
                  : isPushEnabled
                    ? tAccount(language, "disableNotifications")
                    : tAccount(language, "enableNotifications")}
          </button>
        </div>
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="app-card-title text-base">{tAccount(language, "earlyReminder")}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {tAccount(language, "earlyReminderHint")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => handleReminderMinutesChange(String(minutes))}
                disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                className={`${
                  selectedReminderMinutes === String(minutes) ? "soft-tab-active" : "soft-tab"
                } inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]`}
              >
                {minutes} {tAccount(language, "minShort")}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="app-card-title text-base">{tAccount(language, "cabinetReminders")}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {tAccount(language, "cabinetRemindersHint")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              {
                key: "cabinet_notify_10_days" as const,
                label: tAccount(language, "days10"),
                enabled: pushPreferences?.cabinetNotify10Days ?? false,
              },
              {
                key: "cabinet_notify_7_days" as const,
                label: tAccount(language, "days7"),
                enabled: pushPreferences?.cabinetNotify7Days ?? false,
              },
              {
                key: "cabinet_notify_3_days" as const,
                label: tAccount(language, "days3"),
                enabled: pushPreferences?.cabinetNotify3Days ?? false,
              },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleCabinetReminderToggle(option.key, !option.enabled)}
                disabled={isPushPreferencesLoading || updatePushPreferencesMutation.isPending}
                className={`${
                  option.enabled ? "soft-tab-active" : "soft-tab"
                } inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Surface>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card rounded-[28px] px-4 py-4 sm:px-5">
      <p className="text-xs font-semibold tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-foreground">{value}</p>
    </div>
  );
}
