/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchFamilies } from "@shared/api/families";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchPillboxPlans } from "@shared/api/pillboxPlans";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Layout } from "@shared/components/Layout";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  getPushSupportIssue,
  isPushSupported,
  subscribeToPushNotifications,
  toPushSubscriptionPayload,
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
import { AppBootSplash } from "./AppBootSplash";
import { PushPromptControlProvider } from "./PushPromptControlContext";

const IOS_FIRST_LAUNCH_PUSH_UI_DELAY_MS = 3000;
const IOS_REPEAT_LAUNCH_PUSH_UI_DELAY_MS = 1200;
const IOS_FIRST_LAUNCH_BOOT_DELAY_MS = 500;
const IOS_REPEAT_LAUNCH_BOOT_DELAY_MS = 180;
const IOS_FIRST_LAUNCH_SHELL_WORK_DELAY_MS = 1200;
const IOS_REPEAT_LAUNCH_SHELL_WORK_DELAY_MS = 350;
const IOS_TYPING_RETRY_DELAY_MS = 400;
const IOS_FIRST_LAUNCH_IDLE_TIMEOUT_MS = 1600;
const IOS_REPEAT_LAUNCH_IDLE_TIMEOUT_MS = 900;
const IOS_FIRST_LAUNCH_SHELL_FALLBACK_DELAY_MS = 600;
const IOS_REPEAT_LAUNCH_SHELL_FALLBACK_DELAY_MS = 250;
const IOS_FIRST_LAUNCH_SPLASH_SETTLE_MS = 900;
const IOS_REPEAT_LAUNCH_SPLASH_SETTLE_MS = 220;
const IOS_FIRST_INTERACTION_DEFER_MS = 1800;
const IOS_REPEAT_INTERACTION_DEFER_MS = 700;
export function ClientLayout() {
  const globalBootWindow =
    typeof window === "undefined" ? undefined : (window as Window & { __PM_BOOT_READY?: boolean });
  const wasBootReadyOnMount = Boolean(globalBootWindow?.__PM_BOOT_READY);
  const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
  const { copy, language } = useI18n();
  const location = useLocation();
  const accountId = useAppStore((s) => s.accountId);
  const authToken = useAppStore((s) => s.authToken);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const isIosShell = useIsIosShell();
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [isPushPending, setIsPushPending] = useState(false);
  const [pushPromptError, setPushPromptError] = useState<string | null>(null);
  const [pushPromptSuccess, setPushPromptSuccess] = useState<string | null>(null);
  const [nativePushIssue, setNativePushIssue] = useState<"system" | "app" | null>(null);
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);
  const [isDeferredBootReady, setIsDeferredBootReady] = useState(!isIosShell);
  const [isDeferredShellWorkReady, setIsDeferredShellWorkReady] = useState(!isIosShell);
  const [isInitialBootSettled, setIsInitialBootSettled] = useState(wasBootReadyOnMount);
  const [isBootSplashMounted, setIsBootSplashMounted] = useState(!wasBootReadyOnMount);
  const [isBootSplashClosing, setIsBootSplashClosing] = useState(false);
  const [isIosPushUiReady, setIsIosPushUiReady] = useState(!isIosShell);
  const [isInteractiveDataReady, setIsInteractiveDataReady] = useState(!isIosShell);
  const now = useNow(15_000);
  const navStaleTime = isIosShell ? 30_000 : 15_000;
  const navRefetchInterval = isIosShell ? 60_000 : 30_000;
  const { data: navChildren = [] } = useQuery({
    queryKey: ["children", currentFamilyId, "nav-observations"],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: Boolean(currentFamilyId && isDeferredShellWorkReady && isInteractiveDataReady),
    staleTime: navStaleTime,
    refetchInterval: navRefetchInterval,
  });

  const activeEpisodeQueries = useQueries({
    queries: navChildren.map((child) => ({
      queryKey: ["illness-episode-active", child.id, "nav-observations"],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: Boolean(
        currentFamilyId && child.id && isDeferredShellWorkReady && isInteractiveDataReady
      ),
      staleTime: navStaleTime,
      refetchInterval: navRefetchInterval,
    })),
  });

  const activeEpisodesCount = useMemo(
    () => activeEpisodeQueries.reduce((total, query) => total + (query.data ? 1 : 0), 0),
    [activeEpisodeQueries]
  );

  useEffect(() => {
    if (!isIosShell) {
      setIsInteractiveDataReady(true);
      return;
    }

    if (!isDeferredShellWorkReady) {
      setIsInteractiveDataReady(false);
      return;
    }

    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    setIsInteractiveDataReady(false);
    const timeoutId = window.setTimeout(
      () => {
        setIsInteractiveDataReady(true);
      },
      isFirstNativeLaunch ? IOS_FIRST_INTERACTION_DEFER_MS : IOS_REPEAT_INTERACTION_DEFER_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [firstNativeLaunchStorageKey, isDeferredShellWorkReady, isIosShell]);

  useEffect(() => {
    if (!isIosShell) {
      setIsIosPushUiReady(true);
      return;
    }

    setIsIosPushUiReady(false);
    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    const timeoutId = window.setTimeout(
      () => {
        setIsIosPushUiReady(true);
      },
      isFirstNativeLaunch ? IOS_FIRST_LAUNCH_PUSH_UI_DELAY_MS : IOS_REPEAT_LAUNCH_PUSH_UI_DELAY_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accountId, authToken, firstNativeLaunchStorageKey, isIosShell]);

  useEffect(() => {
    if (!isIosShell) {
      setIsDeferredBootReady(true);
      setIsDeferredShellWorkReady(true);
      return;
    }

    setIsDeferredBootReady(false);
    setIsDeferredShellWorkReady(false);
    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    let timeoutId: number | null = null;
    let frameId: number | null = null;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(
        () => {
          setIsDeferredBootReady(true);
        },
        isFirstNativeLaunch ? IOS_FIRST_LAUNCH_BOOT_DELAY_MS : IOS_REPEAT_LAUNCH_BOOT_DELAY_MS
      );
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [accountId, authToken, firstNativeLaunchStorageKey, isIosShell]);

  useEffect(() => {
    if (!isIosShell) {
      setIsDeferredShellWorkReady(true);
      return;
    }

    if (!isDeferredBootReady) {
      setIsDeferredShellWorkReady(false);
      return;
    }

    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    const windowWithIdleApi = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const finishReady = () => {
      if (!cancelled) {
        setIsDeferredShellWorkReady(true);
      }
    };

    const armReady = () => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLElement &&
        Boolean(activeElement.closest("input, textarea, select, [contenteditable='true']"));

      if (isTyping) {
        timeoutId = window.setTimeout(armReady, IOS_TYPING_RETRY_DELAY_MS);
        return;
      }

      if (typeof windowWithIdleApi.requestIdleCallback === "function") {
        idleId = windowWithIdleApi.requestIdleCallback(() => finishReady(), {
          timeout: isFirstNativeLaunch
            ? IOS_FIRST_LAUNCH_IDLE_TIMEOUT_MS
            : IOS_REPEAT_LAUNCH_IDLE_TIMEOUT_MS,
        });
        return;
      }

      timeoutId = window.setTimeout(
        finishReady,
        isFirstNativeLaunch
          ? IOS_FIRST_LAUNCH_SHELL_FALLBACK_DELAY_MS
          : IOS_REPEAT_LAUNCH_SHELL_FALLBACK_DELAY_MS
      );
    };

    timeoutId = window.setTimeout(
      armReady,
      isFirstNativeLaunch
        ? IOS_FIRST_LAUNCH_SHELL_WORK_DELAY_MS
        : IOS_REPEAT_LAUNCH_SHELL_WORK_DELAY_MS
    );

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null && typeof windowWithIdleApi.cancelIdleCallback === "function") {
        windowWithIdleApi.cancelIdleCallback(idleId);
      }
    };
  }, [accountId, authToken, firstNativeLaunchStorageKey, isDeferredBootReady, isIosShell]);

  const { data: pillboxPlans = [] } = useQuery({
    queryKey: ["pillbox-plans", currentFamilyId, language, "nav-attention"],
    queryFn: fetchPillboxPlans,
    enabled: Boolean(currentFamilyId && isDeferredShellWorkReady && isInteractiveDataReady),
    staleTime: navStaleTime,
    refetchInterval: navRefetchInterval,
  });

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
      return { count: dueNowCount, tone: "info" as const };
    }
    const activePlansCount = pillboxPlans.filter((plan) => plan.status === "active").length;
    if (activePlansCount > 0) {
      return { count: activePlansCount, tone: "success" as const };
    }
    return { count: 0, tone: "info" as const };
  }, [now, pillboxPlans]);

  const mobileNavLabels =
    language === "ru"
      ? {
          observations: "Журнал",
          children: "Дети",
          pillbox: "Приёмы",
          cabinet: "Аптечка",
        }
      : {
          observations: "Tracking",
          children: "Kids",
          pillbox: "Meds",
          cabinet: "Cabinet",
        };

  const observationsNavItem = {
    to: "/illnesses/active",
    label: copy.clientLayout.nav.observations,
    mobileLabel: mobileNavLabels.observations,
    exactActivePaths: ["/illnesses/active"],
    attentionCount: activeEpisodesCount > 0 ? activeEpisodesCount : undefined,
    attentionTone: "info" as const,
  };
  const childrenNavItem = {
    to: "/children",
    label: copy.clientLayout.nav.children,
    mobileLabel: mobileNavLabels.children,
    exactActivePaths: ["/children", "/children/:childId"],
    activePaths: ["/children"],
  };
  const isObservationsRoute = observationsNavItem.exactActivePaths.some((path) =>
    matchPath({ path, end: true }, location.pathname)
  );
  const shouldShowObservationsTab = activeEpisodesCount > 0 || isObservationsRoute;
  const baseDesktopNavLinks = [
    ...(shouldShowObservationsTab ? [observationsNavItem] : []),
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
  const {
    data: families = [],
    isSuccess,
    isLoading: isFamiliesLoading,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(
      authToken &&
      accountId &&
      isDeferredShellWorkReady &&
      isIosPushUiReady &&
      isInteractiveDataReady
    ),
    staleTime: 5 * 60 * 1000,
  });

  const desktopNavLinks = baseDesktopNavLinks;
  const mobileNavLinks = baseDesktopNavLinks;
  const mainMenuPathMatchers = [
    { path: "/", end: true },
    { path: "/start", end: true },
    { path: "/children", end: true },
    { path: "/pillbox", end: true },
    { path: "/medicine-cabinet", end: true },
    { path: "/illnesses/active", end: true },
    { path: "/more", end: true },
    { path: "/settings", end: true },
    { path: "/feedback", end: true },
    { path: "/account", end: true },
    { path: "/family", end: true },
    { path: "/about", end: true },
    { path: "/legal", end: false },
  ] as const;
  const pillboxMode = new URLSearchParams(location.search).get("mode");
  const isPillboxInnerRoute =
    location.pathname === "/pillbox" &&
    ["setup", "medication", "details", "analytics"].includes(pillboxMode ?? "");
  const isAccountRoute = Boolean(matchPath({ path: "/account", end: true }, location.pathname));
  const isFamilyRoute = Boolean(matchPath({ path: "/family", end: true }, location.pathname));
  const shouldHideHeader =
    isAccountRoute ||
    isFamilyRoute ||
    isPillboxInnerRoute ||
    !mainMenuPathMatchers.some((matcher) => matchPath(matcher, location.pathname));
  const isMedicineCabinetAddRoute = Boolean(
    matchPath({ path: "/medicine-cabinet/add", end: true }, location.pathname) ||
    matchPath({ path: "/medicine-cabinet/add/:mode", end: true }, location.pathname) ||
    matchPath({ path: "/medicine-cabinet/:medicineId/new-pack", end: true }, location.pathname)
  );
  const shouldHideMobileNav = Boolean(
    isAccountRoute ||
    isFamilyRoute ||
    shouldHideHeader ||
    isMedicineCabinetAddRoute ||
    matchPath({ path: "/children/:childId/illness", end: false }, location.pathname)
  );
  const isCompactNestedChrome = shouldHideHeader || isMedicineCabinetAddRoute;
  const isPushPromptReady = Boolean(
    authToken && accountId && isDeferredShellWorkReady && isIosPushUiReady && pushConfig?.enabled
  );
  useEffect(() => {
    setPushPromptError(null);
    setPushPromptSuccess(null);
  }, [accountId]);

  useEffect(() => {
    if (!isPushPromptReady) {
      setPushStatus("checking");
      setPushPromptSuccess(null);
      setNativePushIssue(null);
      return;
    }

    let isCancelled = false;
    let isChecking = false;
    let lastCheckAt = 0;
    const MIN_PUSH_CHECK_INTERVAL_MS = 2500;

    const checkPush = async () => {
      const nowTs = Date.now();
      if (isChecking || nowTs - lastCheckAt < MIN_PUSH_CHECK_INTERVAL_MS) {
        return;
      }
      isChecking = true;
      lastCheckAt = nowTs;

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
          const payload = getCachedNativePushSubscriptionPayload();
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
      } finally {
        isChecking = false;
      }
    };

    void checkPush();

    const handlePushSubscriptionChanged = () => {
      void checkPush();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkPush();
      }
    };

    window.addEventListener("push:subscription-changed", handlePushSubscriptionChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", handlePushSubscriptionChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPushPromptReady]);

  const shouldShowPushPrompt =
    isPushPromptReady && !isNativePushSupported() && isPushSupported() && pushStatus === "disabled";
  const shouldShowNativePushPrompt = isPushPromptReady && nativePushIssue !== null;
  const shouldShowNotificationPrompt = shouldShowNativePushPrompt || shouldShowPushPrompt;
  const isNotificationBellActive = shouldShowNotificationPrompt;

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

  const handleHidePushPrompt = () => {
    setIsPushDialogOpen(false);
  };

  useEffect(() => {
    if (!shouldShowNotificationPrompt) {
      setIsPushDialogOpen(false);
    }
  }, [shouldShowNotificationPrompt]);

  useEffect(() => {
    if (pushStatus === "enabled" && !nativePushIssue) {
      setIsPushDialogOpen(false);
    }
  }, [nativePushIssue, pushStatus]);

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

  const isFirstNativeLaunch =
    isIosShell &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";

  const shouldShowBootSplash =
    Boolean(authToken && accountId) &&
    (!isDeferredBootReady ||
      isFamiliesLoading ||
      !isSuccess ||
      (isFirstNativeLaunch && !isDeferredShellWorkReady));

  useEffect(() => {
    if (wasBootReadyOnMount) {
      return;
    }

    if (isInitialBootSettled || shouldShowBootSplash) {
      return;
    }

    const bootWindow = window as Window & {
      __PM_FIRST_COLD_BOOT_SETTLED?: boolean;
    };
    const settleDelay = isIosShell
      ? bootWindow.__PM_FIRST_COLD_BOOT_SETTLED
        ? 140
        : isFirstNativeLaunch
          ? IOS_FIRST_LAUNCH_SPLASH_SETTLE_MS
          : IOS_REPEAT_LAUNCH_SPLASH_SETTLE_MS
      : 140;

    const timeoutId = window.setTimeout(() => {
      bootWindow.__PM_FIRST_COLD_BOOT_SETTLED = true;
      if (isFirstNativeLaunch) {
        window.localStorage.setItem(firstNativeLaunchStorageKey, "1");
      }
      setIsInitialBootSettled(true);
    }, settleDelay);

    return () => window.clearTimeout(timeoutId);
  }, [isInitialBootSettled, isIosShell, shouldShowBootSplash, wasBootReadyOnMount]);

  useEffect(() => {
    if (wasBootReadyOnMount) {
      setIsBootSplashMounted(false);
      setIsBootSplashClosing(false);
      return;
    }

    if (!isInitialBootSettled) {
      setIsBootSplashMounted(true);
      setIsBootSplashClosing(false);
      return;
    }

    if (shouldShowBootSplash) {
      return;
    }

    setIsBootSplashMounted(true);
    setIsBootSplashClosing(true);
    (window as Window & { __PM_BOOT_READY?: boolean }).__PM_BOOT_READY = true;
    window.dispatchEvent(new Event("app:boot-ready"));
    const timeoutId = window.setTimeout(() => {
      setIsBootSplashMounted(false);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [isInitialBootSettled, shouldShowBootSplash, wasBootReadyOnMount]);

  return (
    <>
      <PushPromptControlProvider
        value={{
          showNotificationBell: shouldShowNotificationPrompt,
          isNotificationBellActive,
          onNotificationBellClick: shouldShowNotificationPrompt
            ? () => setIsPushDialogOpen(true)
            : null,
        }}
      >
        <Layout
          navLinks={desktopNavLinks}
          mobileNavLinks={shouldHideMobileNav ? [] : mobileNavLinks}
          hideHeader={isCompactNestedChrome}
          compactHiddenChrome={isCompactNestedChrome}
          showNotificationBell={shouldShowNotificationPrompt}
          isNotificationBellActive={isNotificationBellActive}
          onNotificationBellClick={
            shouldShowNotificationPrompt ? () => setIsPushDialogOpen(true) : null
          }
        >
          <Outlet />
        </Layout>
      </PushPromptControlProvider>
      <ConfirmDialog
        isOpen={isPushDialogOpen && shouldShowNotificationPrompt}
        title={
          shouldShowNativePushPrompt && nativePushIssue === "system"
            ? copy.clientLayout.pushPrompt.nativeBlockedTitle
            : copy.clientLayout.pushPrompt.title
        }
        description={[
          shouldShowNativePushPrompt && nativePushIssue === "system"
            ? copy.clientLayout.pushPrompt.nativeBlockedDescription
            : copy.clientLayout.pushPrompt.description,
          pushPromptError,
          pushPromptSuccess,
        ]
          .filter(Boolean)
          .join(" ")}
        confirmLabel={
          shouldShowNativePushPrompt && nativePushIssue === "system"
            ? copy.clientLayout.pushPrompt.openSettings
            : isPushPending
              ? copy.clientLayout.pushPrompt.enabling
              : copy.clientLayout.pushPrompt.enable
        }
        cancelLabel={copy.clientLayout.pushPrompt.hide}
        isPending={isPushPending}
        onCancel={handleHidePushPrompt}
        onConfirm={() => {
          if (shouldShowNativePushPrompt && nativePushIssue === "system") {
            openNativeNotificationSettings();
            setIsPushDialogOpen(false);
            return;
          }
          void handleEnablePush();
        }}
      />
      {isBootSplashMounted ? (
        <AppBootSplash className="app-boot-splash--overlay" isClosing={isBootSplashClosing} />
      ) : null}
    </>
  );
}
