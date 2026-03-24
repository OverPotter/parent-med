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

export function AccountPage() {
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
      withTimeout(
        fetchPushNotificationConfig(),
        5000,
        "Не удалось быстро проверить настройки push на сервере."
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
        error instanceof Error
          ? error.message
          : "Не удалось сохранить время дополнительного напоминания."
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
          "Не удалось быстро проверить push на этом устройстве."
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
      setPasswordSuccess("Пароль обновлён.");
    },
    onError: (error) => {
      setPasswordSuccess(null);
      setPasswordError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : "Не удалось сменить пароль.")
      );
    },
  });

  const handleEnablePush = async () => {
    if (pushSupportIssue) {
      setPushError(pushSupportIssue);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushError("Push-уведомления ещё не настроены на сервере.");
      return;
    }
    if (!isPushSupported()) {
      setPushError("На этом устройстве web push недоступен.");
      return;
    }
    setPushError(null);
    setIsPushPending(true);
    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        "Браузер не завершил запрос разрешения на уведомления."
      );
      if (permission !== "granted") {
        setPushError("Браузер не дал разрешение на уведомления.");
        return;
      }
      const subscription = await withTimeout(
        subscribeToPushNotifications(pushConfig.vapidPublicKey),
        10000,
        "Не удалось завершить подписку устройства на push."
      );
      await withTimeout(
        upsertPushSubscription(toPushSubscriptionPayload(subscription)),
        8000,
        "Сервер не принял подписку устройства."
      );
      setPushStatus("enabled");
    } catch (error) {
      setPushError(
        error instanceof Error
          ? error.message
          : "Не удалось включить уведомления на этом устройстве."
      );
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
    } catch {
      setPushError("Не удалось отключить уведомления.");
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
      setPasswordError("Заполни все поля пароля.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError("Новый пароль и подтверждение не совпадают.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordSuccess(null);
      setPasswordError("Новый пароль должен быть не короче 6 символов.");
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
      <PageIntro title="Аккаунт" subtitle="Личные настройки, уведомления и безопасность." />

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Профиль</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label="Имя в семье"
            value={accountDisplayName || accountLogin || "Не указано"}
          />
          <InfoCard label="Логин" value={accountLogin ? `@${accountLogin}` : "Не указан"} />
          <InfoCard label="Email" value={accountEmail || "Не указан"} />
          <InfoCard
            label="Роль в семье"
            value={accountFamilyRole === "owner" ? "Владелец" : "Участник"}
          />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <DisclosureHeader
          isOpen={isPasswordFormOpen}
          onToggle={() => setIsPasswordFormOpen((current) => !current)}
        >
          <>
            <p className="text-sm font-medium text-foreground">Сменить пароль</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Открывается только когда нужно, чтобы не перегружать настройки.
            </p>
          </>
        </DisclosureHeader>
        {isPasswordFormOpen && (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="block text-sm text-muted">Текущий пароль</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="block text-sm text-muted">Новый пароль</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="block text-sm text-muted">Повтори новый пароль</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSubmitPasswordChange}
                disabled={changePasswordMutation.isPending}
                className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? "Сохраняем…" : "Обновить пароль"}
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
        <p className="text-sm font-medium text-foreground">Планы лекарства</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Как показывать и вводить интервал в планах по времени: в часах или в минутах.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { value: "hours", label: "Часы" },
              { value: "minutes", label: "Минуты" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMedicationIntervalUnit(option.value)}
              className={`${
                medicationIntervalUnit === option.value ? "soft-tab-active" : "soft-tab"
              } rounded-2xl px-4 py-2.5 text-sm`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Уведомления</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Одно уведомление приходит всегда, когда препарат уже можно дать. Дополнительно можно
          выбрать раннее напоминание заранее.
        </p>
        {pushError && (
          <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">{pushError}</div>
        )}
        {!isPushConfigLoading && pushConfig && !pushConfig.enabled && (
          <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
            Серверная отправка push пока не настроена. Нужны VAPID-ключи на backend.
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
            } rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50`}
          >
            {isPushPending
              ? isPushEnabled
                ? "Отключаем…"
                : "Подключаем…"
              : isPushConfigLoading
                ? "Проверяем сервер…"
                : pushStatus === "checking"
                  ? "Проверяем…"
                  : isPushEnabled
                    ? "Выключить уведомления"
                    : "Включить уведомления"}
          </button>
        </div>
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="text-sm font-medium text-foreground">Раннее напоминание</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Дополнительное уведомление заранее. Основное уведомление в момент следующей дозы
            остаётся всегда.
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
                } rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50`}
              >
                {minutes} мин
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="text-sm font-medium text-foreground">Напоминания по аптечке</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Отдельные push-напоминания по сроку годности или сроку после вскрытия. Напоминание за 1
            день приходит всегда.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              {
                key: "cabinet_notify_10_days" as const,
                label: "За 10 дней",
                enabled: pushPreferences?.cabinetNotify10Days ?? false,
              },
              {
                key: "cabinet_notify_7_days" as const,
                label: "За 7 дней",
                enabled: pushPreferences?.cabinetNotify7Days ?? false,
              },
              {
                key: "cabinet_notify_3_days" as const,
                label: "За 3 дня",
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
                } rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50`}
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
    <div className="soft-card rounded-[24px] px-4 py-4 sm:px-5">
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-3 text-base font-medium text-foreground">{value}</p>
    </div>
  );
}
