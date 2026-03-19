import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logout } from "@shared/api/auth";
import {
  deletePushSubscription,
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  updatePushNotificationPreferences,
  upsertPushSubscription,
} from "@shared/api/pushNotifications";
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
  const accountEmail = useAppStore((s) => s.accountEmail);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const clearSession = useAppStore((s) => s.clearSession);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [pushError, setPushError] = useState<string | null>(null);
  const [isPushPending, setIsPushPending] = useState(false);
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
    mutationFn: (beforeReminderMinutes: number) =>
      updatePushNotificationPreferences({ before_reminder_minutes: beforeReminderMinutes }),
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

  const handleChangePassword = () => {
    window.alert("Смена пароля появится позже, когда будет готов backend API.");
  };

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
        error instanceof Error ? error.message : "Не удалось включить уведомления на этом устройстве."
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Локальный выход остаётся приоритетом.
    } finally {
      clearSession();
    }
  };

  const handleReminderMinutesChange = (value: string) => {
    setSelectedReminderMinutes(value);
    setPushError(null);
    void updatePushPreferencesMutation.mutate(parseInt(value, 10));
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Аккаунт</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Личные настройки и действия, которые не должны мешать ежедневной работе с детьми и
          записями.
        </p>
      </div>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Профиль</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoCard label="Email" value={accountEmail || "Не удалось получить email"} />
          <InfoCard label="Тема" value={theme === "light" ? "Светлая" : "Тёмная"} />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Быстрые действия</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleChangePassword}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Сменить пароль
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Переключить на {theme === "light" ? "тёмную" : "светлую"} тему
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Выйти из аккаунта
          </button>
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
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Безопасность</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Кнопка смены пароля уже показана в интерфейсе, но пока работает как заглушка. Когда
          появится API, здесь можно будет подключить полноценную форму.
        </p>
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
