/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { useEffect, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchFamilies } from "@shared/api/families";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { Layout } from "@shared/components/Layout";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  getPushSupportIssue,
  isPushSupported,
  subscribeToPushNotifications,
  toPushSubscriptionPayload,
  withTimeout,
} from "@shared/utils/pushNotifications";

const activeObservationsNavItem = {
  to: "/illnesses/active",
  label: "Наблюдения",
  mobileLabel: "Наблюдения",
  exactActivePaths: ["/illnesses/active", "/children/:childId/illness"],
};

const childrenNavItem = {
  to: "/children",
  label: "Дети",
  mobileLabel: "Дети",
  exactActivePaths: ["/children", "/children/:childId"],
};

const baseDesktopNavLinks = [
  childrenNavItem,
  { to: "/medicine-cabinet", label: "Аптечка", mobileLabel: "Аптечка" },
  {
    to: "/more",
    label: "Ещё",
    mobileLabel: "Ещё",
    exactActivePaths: ["/more", "/account", "/about", "/family", "/illnesses/history", "/home"],
  },
];

const baseMobileNavLinks = [
  childrenNavItem,
  { to: "/medicine-cabinet", label: "Аптечка", mobileLabel: "Аптечка" },
  {
    to: "/more",
    label: "Ещё",
    mobileLabel: "Ещё",
    exactActivePaths: ["/more", "/account", "/about", "/family", "/illnesses/history", "/home"],
  },
];

export function ClientLayout() {
  const accountId = useAppStore((s) => s.accountId);
  const authToken = useAppStore((s) => s.authToken);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [isPushPromptActionsHidden, setIsPushPromptActionsHidden] = useState(false);
  const [isPushPending, setIsPushPending] = useState(false);
  const [pushPromptError, setPushPromptError] = useState<string | null>(null);
  const [pushPromptSuccess, setPushPromptSuccess] = useState<string | null>(null);
  const { data: families = [], isSuccess } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(authToken && accountId),
    staleTime: 5 * 60 * 1000,
  });

  const familyId = currentFamilyId ?? families[0]?.id ?? null;

  const { data: children = [] } = useQuery({
    queryKey: ["children", familyId],
    queryFn: () => fetchChildrenByFamilyId(familyId!),
    enabled: !!familyId,
  });

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id,
    })),
  });

  const hasActiveEpisode = activeEpisodeQueries.some((query) => Boolean(query.data));

  const desktopNavLinks = hasActiveEpisode
    ? [activeObservationsNavItem, ...baseDesktopNavLinks]
    : baseDesktopNavLinks;
  const mobileNavLinks = hasActiveEpisode
    ? [activeObservationsNavItem, ...baseMobileNavLinks]
    : baseMobileNavLinks;

  useEffect(() => {
    setIsPushPromptActionsHidden(false);
    setPushPromptError(null);
    setPushPromptSuccess(null);
  }, [accountId]);

  useEffect(() => {
    if (!authToken || !accountId || !pushConfig?.enabled || !isPushSupported()) {
      setPushStatus("disabled");
      setPushPromptSuccess(null);
      return;
    }

    let isCancelled = false;

    const checkPush = async () => {
      try {
        if (Notification.permission !== "granted") {
          if (!isCancelled) {
            setPushStatus("disabled");
            setPushPromptSuccess(null);
          }
          return;
        }

        const subscription = await getExistingPushSubscription();
        if (!isCancelled) {
          const nextStatus = subscription ? "enabled" : "disabled";
          setPushStatus(nextStatus);
          if (nextStatus === "disabled") {
            setPushPromptSuccess(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
          setPushPromptSuccess(null);
        }
      }
    };

    void checkPush();

    const handlePushSubscriptionChanged = () => {
      void checkPush();
    };

    window.addEventListener("push:subscription-changed", handlePushSubscriptionChanged);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", handlePushSubscriptionChanged);
    };
  }, [accountId, authToken, pushConfig?.enabled]);

  const shouldShowPushPrompt =
    Boolean(pushConfig?.enabled) && isPushSupported() && pushStatus === "disabled";

  const handleEnablePush = async () => {
    const pushSupportIssue = getPushSupportIssue();
    if (pushSupportIssue) {
      setPushPromptError(pushSupportIssue);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushPromptError("Уведомления ещё не настроены на сервере.");
      return;
    }

    setPushPromptError(null);
    setPushPromptSuccess(null);
    setIsPushPending(true);

    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        "Браузер не завершил запрос разрешения на уведомления."
      );
      if (permission !== "granted") {
        setPushPromptError("Браузер не дал разрешение на уведомления.");
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
      setPushPromptSuccess("Уведомления включены.");
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch (error) {
      setPushPromptError(
        error instanceof Error ? error.message : "Не удалось включить уведомления."
      );
    } finally {
      setIsPushPending(false);
    }
  };

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    const firstFamily = families[0] ?? null;
    if (!currentFamilyId) {
      if (firstFamily) {
        setCurrentFamily(firstFamily);
      }
      return;
    }
    const family = families.find((item) => item.id === currentFamilyId);
    if (!family) {
      setCurrentFamily(firstFamily);
      return;
    }
    if (family.name !== currentFamilyName) {
      setCurrentFamily(family);
    }
  }, [currentFamilyId, currentFamilyName, families, isSuccess, setCurrentFamily]);

  return (
    <Layout navLinks={desktopNavLinks} mobileNavLinks={mobileNavLinks} showCurrentFamily>
      {shouldShowPushPrompt && (
        <Surface className="soft-panel-muted mb-4 p-4 sm:p-5">
          {isPushPromptActionsHidden ? (
            <button
              type="button"
              onClick={() => setIsPushPromptActionsHidden(false)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[20px] text-left transition hover:opacity-95"
            >
              <p className="app-card-title text-[0.96rem]">Включите уведомления</p>
              <span className="soft-button-secondary inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.025em]">
                Открыть
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="app-card-title text-[1rem]">Включите уведомления</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Так проще не пропустить напоминания по наблюдениям и аптечке.
                </p>
                {pushPromptError && (
                  <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
                    {pushPromptError}
                  </p>
                )}
                {pushPromptSuccess && (
                  <p className="soft-note-success mt-3 rounded-2xl px-4 py-3 text-sm">
                    {pushPromptSuccess}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isPushPending}
                  className="soft-button-primary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.03em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
                >
                  {isPushPending ? "Подключаем…" : "Включить уведомления"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPushPromptActionsHidden(true)}
                  disabled={isPushPending}
                  className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
                >
                  Скрыть пока
                </button>
              </div>
            </div>
          )}
        </Surface>
      )}
      <Outlet />
    </Layout>
  );
}
