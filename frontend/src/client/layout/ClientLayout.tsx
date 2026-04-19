/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import { fetchAdministrationEventsByEpisodeId } from "@shared/api/administrationEvents";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchFamilies } from "@shared/api/families";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchPillboxPlans } from "@shared/api/pillboxPlans";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { Layout } from "@shared/components/Layout";
import { Surface } from "@shared/components/Surface";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type { IllnessEpisode } from "@shared/types/api";
import {
  getExistingPushSubscription,
  getPushSupportIssue,
  isPushSupported,
  subscribeToPushNotifications,
  toPushSubscriptionPayload,
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
import { getPrioritizedMedicationPlanItems } from "../utils/medicationPlans";

export function ClientLayout() {
  const { copy, language } = useI18n();
  const location = useLocation();
  const accountId = useAppStore((s) => s.accountId);
  const authToken = useAppStore((s) => s.authToken);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const isIosShell = useIsIosShell();
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [isPushPromptActionsHidden, setIsPushPromptActionsHidden] = useState(false);
  const [isPushPending, setIsPushPending] = useState(false);
  const [pushPromptError, setPushPromptError] = useState<string | null>(null);
  const [pushPromptSuccess, setPushPromptSuccess] = useState<string | null>(null);
  const [nativePushIssue, setNativePushIssue] = useState<"system" | "app" | null>(null);
  const [isDeferredBootReady, setIsDeferredBootReady] = useState(!isIosShell);
  const now = useNow(15_000);

  useEffect(() => {
    if (!isIosShell) {
      setIsDeferredBootReady(true);
      return;
    }

    setIsDeferredBootReady(false);
    let timeoutId: number | null = null;
    let frameId: number | null = null;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setIsDeferredBootReady(true);
      }, 850);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isIosShell, authToken, accountId]);

  const { data: navChildren = [] } = useQuery({
    queryKey: ["children", currentFamilyId, "nav-attention"],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: Boolean(currentFamilyId && isDeferredBootReady),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const activeEpisodeQueries = useQueries({
    queries: navChildren.map((child) => ({
      queryKey: ["illness-episode-active", child.id, "nav-attention"],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: Boolean(currentFamilyId && child.id && isDeferredBootReady),
      staleTime: 15_000,
      refetchInterval: 30_000,
    })),
  });

  const activeEpisodes = useMemo(
    () =>
      activeEpisodeQueries
        .map((query) => query.data)
        .filter((episode): episode is IllnessEpisode => Boolean(episode)),
    [activeEpisodeQueries]
  );

  const episodePlansQueries = useQueries({
    queries: activeEpisodes.map((episode) => ({
      queryKey: ["episode-medication-plans", episode.id, "nav-attention"],
      queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(episode.id),
      enabled: Boolean(episode.id && isDeferredBootReady),
      staleTime: 15_000,
      refetchInterval: 30_000,
    })),
  });

  const administrationQueries = useQueries({
    queries: activeEpisodes.map((episode) => ({
      queryKey: ["administration-events", episode.id, "nav-attention"],
      queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
      enabled: Boolean(episode.id && isDeferredBootReady),
      staleTime: 15_000,
      refetchInterval: 30_000,
    })),
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId, "nav-attention"],
    queryFn: fetchHouseholdMedicines,
    enabled: Boolean(currentFamilyId && isDeferredBootReady),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: pillboxPlans = [] } = useQuery({
    queryKey: ["pillbox-plans", currentFamilyId, language, "nav-attention"],
    queryFn: fetchPillboxPlans,
    enabled: Boolean(currentFamilyId && isDeferredBootReady),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const observationsAttention = useMemo(() => {
    const currentDate = new Date(now);
    const actionableCount = activeEpisodes.reduce((total, _episode, index) => {
      const plans = episodePlansQueries[index]?.data ?? [];
      const administrations = administrationQueries[index]?.data ?? [];
      const actionable = getPrioritizedMedicationPlanItems(
        plans,
        administrations,
        householdMedicines,
        currentDate
      ).filter((item) => !item.isUnavailable && !item.stats.isBlocked).length;
      return total + actionable;
    }, 0);
    if (actionableCount > 0) {
      return { count: actionableCount, tone: "danger" as const };
    }

    const episodesWithPlans = activeEpisodes.reduce((total, _episode, index) => {
      const plans = episodePlansQueries[index]?.data ?? [];
      return total + (plans.length > 0 ? 1 : 0);
    }, 0);
    if (episodesWithPlans > 0) {
      return { count: episodesWithPlans, tone: "warning" as const };
    }
    if (activeEpisodes.length > 0) {
      return { count: activeEpisodes.length, tone: "warning" as const };
    }
    return { count: 0, tone: "danger" as const };
  }, [activeEpisodes, administrationQueries, episodePlansQueries, householdMedicines, now]);

  const pillboxAttention = useMemo(() => {
    const threshold = now + 60_000;
    const dueNowCount = pillboxPlans.filter((plan) => {
      if (plan.status !== "active" || !plan.nextMedicationId || !plan.nextDoseAt) {
        return false;
      }
      const nextDoseTime = new Date(plan.nextDoseAt).getTime();
      return Number.isFinite(nextDoseTime) && nextDoseTime <= threshold;
    }).length;
    if (dueNowCount > 0) {
      return { count: dueNowCount, tone: "danger" as const };
    }
    const activePlansCount = pillboxPlans.filter((plan) => plan.status === "active").length;
    if (activePlansCount > 0) {
      return { count: activePlansCount, tone: "success" as const };
    }
    return { count: 0, tone: "danger" as const };
  }, [now, pillboxPlans]);

  const mobileNavLabels =
    language === "ru"
      ? {
          observations: "Журнал",
          children: "Дети",
          pillbox: "Таблетница",
          cabinet: "Аптечка",
        }
      : {
          observations: "Health",
          children: "Kids",
          pillbox: "Meds",
          cabinet: "Cabinet",
        };

  const activeObservationsNavItem = {
    to: "/illnesses/active",
    label: copy.clientLayout.nav.observations,
    mobileLabel: mobileNavLabels.observations,
    exactActivePaths: ["/illnesses/active"],
    attentionCount: observationsAttention.count > 0 ? observationsAttention.count : undefined,
    attentionTone: observationsAttention.tone,
  };
  const childrenNavItem = {
    to: "/children",
    label: copy.clientLayout.nav.children,
    mobileLabel: mobileNavLabels.children,
    exactActivePaths: ["/children", "/children/:childId"],
    activePaths: ["/children"],
  };
  const baseDesktopNavLinks = [
    activeObservationsNavItem,
    childrenNavItem,
    {
      to: "/pillbox",
      label: copy.clientLayout.nav.pillbox,
      mobileLabel: mobileNavLabels.pillbox,
      exactActivePaths: ["/pillbox"],
      attentionCount: pillboxAttention.count > 0 ? pillboxAttention.count : undefined,
      attentionTone: pillboxAttention.tone,
    },
    {
      to: "/medicine-cabinet",
      label: copy.clientLayout.nav.cabinet,
      mobileLabel: mobileNavLabels.cabinet,
    },
  ];
  const isObservationsRoute = activeObservationsNavItem.exactActivePaths.some((path) =>
    matchPath({ path, end: path === "/illnesses/active" }, location.pathname)
  );
  const baseMobileNavLinks =
    activeEpisodes.length > 0 || isObservationsRoute
      ? [...baseDesktopNavLinks]
      : baseDesktopNavLinks.filter((link) => link.to !== activeObservationsNavItem.to);
  const { data: families = [], isSuccess } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(authToken && accountId && isDeferredBootReady),
    staleTime: 5 * 60 * 1000,
  });

  const desktopNavLinks = baseDesktopNavLinks;
  const mobileNavLinks = baseMobileNavLinks;
  const mainMenuPaths = [
    "/",
    "/start",
    "/children",
    "/pillbox",
    "/medicine-cabinet",
    "/illnesses/active",
    "/more",
  ];
  const shouldHideHeader = !mainMenuPaths.some((path) =>
    matchPath({ path, end: true }, location.pathname)
  );
  const isMedicineCabinetAddRoute = Boolean(
    matchPath({ path: "/medicine-cabinet/add", end: true }, location.pathname) ||
    matchPath({ path: "/medicine-cabinet/add/:mode", end: true }, location.pathname) ||
    matchPath({ path: "/medicine-cabinet/:medicineId/new-pack", end: true }, location.pathname)
  );
  const shouldHideMobileNav = Boolean(
    shouldHideHeader ||
    isMedicineCabinetAddRoute ||
    matchPath({ path: "/children/:childId/illness", end: false }, location.pathname)
  );
  useEffect(() => {
    setIsPushPromptActionsHidden(false);
    setPushPromptError(null);
    setPushPromptSuccess(null);
  }, [accountId]);

  useEffect(() => {
    if (!isDeferredBootReady || !authToken || !accountId || !pushConfig?.enabled) {
      setPushStatus("disabled");
      setPushPromptSuccess(null);
      setNativePushIssue(null);
      return;
    }

    let isCancelled = false;

    const checkPush = async () => {
      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            if (!isCancelled) {
              setPushStatus("disabled");
              setPushPromptSuccess(null);
              setNativePushIssue("app");
            }
            return;
          }
          const permission = await getNativePushPermissionStatus();
          if (permission === "denied") {
            if (!isCancelled) {
              setPushStatus("disabled");
              setPushPromptSuccess(null);
              setNativePushIssue("system");
            }
            return;
          }
          const payload = await getNativePushSubscriptionPayload({ promptIfNeeded: false });
          if (!isCancelled) {
            const nextStatus = payload ? "enabled" : "disabled";
            setPushStatus(nextStatus);
            setNativePushIssue(nextStatus === "disabled" ? "app" : null);
            if (nextStatus === "disabled") {
              setPushPromptSuccess(null);
            }
          }
          return;
        }

        if (!isPushSupported() || Notification.permission !== "granted") {
          if (!isCancelled) {
            setPushStatus("disabled");
            setPushPromptSuccess(null);
            setNativePushIssue(null);
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
          setNativePushIssue(null);
        }
      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
          setPushPromptSuccess(null);
          setNativePushIssue(null);
        }
      }
    };

    void checkPush();

    const handlePushSubscriptionChanged = () => {
      void checkPush();
    };

    window.addEventListener("push:subscription-changed", handlePushSubscriptionChanged);
    window.addEventListener("focus", handlePushSubscriptionChanged);
    window.addEventListener("pageshow", handlePushSubscriptionChanged);
    document.addEventListener("visibilitychange", handlePushSubscriptionChanged);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", handlePushSubscriptionChanged);
      window.removeEventListener("focus", handlePushSubscriptionChanged);
      window.removeEventListener("pageshow", handlePushSubscriptionChanged);
      document.removeEventListener("visibilitychange", handlePushSubscriptionChanged);
    };
  }, [accountId, authToken, isDeferredBootReady, pushConfig?.enabled]);

  const shouldShowPushPrompt =
    Boolean(pushConfig?.enabled) &&
    !isNativePushSupported() &&
    isPushSupported() &&
    pushStatus === "disabled";
  const shouldShowNativePushPrompt = Boolean(pushConfig?.enabled) && nativePushIssue !== null;

  const handleEnablePush = async () => {
    if (isNativePushSupported()) {
      if (!pushConfig?.enabled) {
        setPushPromptError(copy.clientLayout.pushErrors.serverNotReady);
        return;
      }

      setPushPromptError(null);
      setPushPromptSuccess(null);
      setIsPushPending(true);

      try {
        setNativePushOptOut(false);
        const permission = await getNativePushPermissionStatus();
        if (permission === "denied") {
          setNativePushIssue("system");
          return;
        }

        const payload = await withTimeout(
          getNativePushSubscriptionPayload({ promptIfNeeded: true }),
          10000,
          copy.clientLayout.pushErrors.subscribeTimeout
        );
        if (!payload) {
          setNativePushIssue("app");
          return;
        }

        await withTimeout(
          upsertPushSubscription(payload),
          8000,
          copy.clientLayout.pushErrors.acceptTimeout
        );
        setPushStatus("enabled");
        setNativePushIssue(null);
        setPushPromptSuccess(copy.clientLayout.pushErrors.enabled);
        window.dispatchEvent(new Event("push:subscription-changed"));
      } catch (error) {
        setPushPromptError(
          error instanceof Error ? error.message : copy.clientLayout.pushErrors.enableFailed
        );
      } finally {
        setIsPushPending(false);
      }
      return;
    }

    const pushSupportIssue = getPushSupportIssue();
    if (pushSupportIssue) {
      setPushPromptError(copy.clientLayout.pushErrors.supportMissing);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushPromptError(copy.clientLayout.pushErrors.serverNotReady);
      return;
    }

    setPushPromptError(null);
    setPushPromptSuccess(null);
    setIsPushPending(true);

    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        copy.clientLayout.pushErrors.permissionTimeout
      );
      if (permission !== "granted") {
        setPushPromptError(copy.clientLayout.pushErrors.permissionDenied);
        return;
      }

      const subscription = await withTimeout(
        subscribeToPushNotifications(pushConfig.vapidPublicKey),
        10000,
        copy.clientLayout.pushErrors.subscribeTimeout
      );

      await withTimeout(
        upsertPushSubscription(toPushSubscriptionPayload(subscription)),
        8000,
        copy.clientLayout.pushErrors.acceptTimeout
      );

      setPushStatus("enabled");
      setPushPromptSuccess(copy.clientLayout.pushErrors.enabled);
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch (error) {
      setPushPromptError(
        error instanceof Error ? error.message : copy.clientLayout.pushErrors.enableFailed
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
    <Layout
      navLinks={desktopNavLinks}
      mobileNavLinks={shouldHideMobileNav ? [] : mobileNavLinks}
      hideHeader={shouldHideHeader || isMedicineCabinetAddRoute}
      compactHiddenChrome={shouldHideHeader || isMedicineCabinetAddRoute}
    >
      {shouldShowNativePushPrompt && (
        <Surface className="soft-panel-muted mb-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="app-card-title text-[1rem]">
                {nativePushIssue === "system"
                  ? copy.clientLayout.pushPrompt.nativeBlockedTitle
                  : copy.clientLayout.pushPrompt.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {nativePushIssue === "system"
                  ? copy.clientLayout.pushPrompt.nativeBlockedDescription
                  : copy.clientLayout.pushPrompt.description}
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
            <button
              type="button"
              onClick={() => {
                if (nativePushIssue === "system") {
                  openNativeNotificationSettings();
                  return;
                }
                void handleEnablePush();
              }}
              disabled={isPushPending}
              className="soft-button-secondary inline-flex min-h-[2.85rem] shrink-0 items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
            >
              {nativePushIssue === "system"
                ? copy.clientLayout.pushPrompt.openSettings
                : isPushPending
                  ? copy.clientLayout.pushPrompt.enabling
                  : copy.clientLayout.pushPrompt.enable}
            </button>
          </div>
        </Surface>
      )}
      {shouldShowPushPrompt && (
        <Surface className="soft-panel-muted mb-4 p-4 sm:p-5">
          {isPushPromptActionsHidden ? (
            <button
              type="button"
              onClick={() => setIsPushPromptActionsHidden(false)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[20px] text-left transition hover:opacity-95"
            >
              <p className="app-card-title text-[0.96rem]">{copy.clientLayout.pushPrompt.title}</p>
              <span className="soft-button-secondary inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.025em]">
                {copy.common.open}
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="app-card-title text-[1rem]">{copy.clientLayout.pushPrompt.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {copy.clientLayout.pushPrompt.description}
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
                  {isPushPending
                    ? copy.clientLayout.pushPrompt.enabling
                    : copy.clientLayout.pushPrompt.enable}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPushPromptActionsHidden(true)}
                  disabled={isPushPending}
                  className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
                >
                  {copy.clientLayout.pushPrompt.hide}
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
