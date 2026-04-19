/** Роутинг: admin / client. */

import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { setBearerToken, setRefreshHandler } from "@shared/api/client";
import { useAppStore } from "@shared/store/useAppStore";
import { CookieConsentBanner } from "@shared/components/CookieConsentBanner";
import { NetworkStatusBanner } from "@shared/components/NetworkStatusBanner";
import {
  getCookieConsentDecision,
  type CookieConsentDecision,
} from "@shared/privacy/cookieConsent";
import {
  getExistingPushSubscription,
  isPushSupported,
  toPushSubscriptionPayload,
} from "@shared/utils/pushNotifications";
import {
  getCachedNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  NATIVE_PUSH_NAVIGATION_EVENT,
} from "@shared/utils/nativePushNotifications";
import { HitKeepBridge } from "@shared/analytics";
import { AppBootSplash } from "@client/layout/AppBootSplash";
import { AuthPage } from "@client/pages/AuthPage";
import { detectIosShell } from "@shared/hooks/useIsIosShell";
import { appLog } from "@shared/utils/appLog";
import { blurActiveField } from "@shared/utils/focus";

const ClientLayout = lazy(() =>
  import("@client/layout/ClientLayout").then((module) => ({ default: module.ClientLayout }))
);
const AccountPage = lazy(() =>
  import("@client/pages/AccountPage").then((module) => ({ default: module.AccountPage }))
);
const SettingsPage = lazy(() =>
  import("@client/pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);
const LandingPage = lazy(() =>
  import("@client/pages/LandingPage").then((module) => ({ default: module.LandingPage }))
);
const AboutPage = lazy(() =>
  import("@client/pages/AboutPage").then((module) => ({ default: module.AboutPage }))
);
const ClientHomePage = lazy(() =>
  import("@client/pages/ClientHomePage").then((module) => ({ default: module.ClientHomePage }))
);
const ClientStartPage = lazy(() =>
  import("@client/pages/ClientStartPage").then((module) => ({ default: module.ClientStartPage }))
);
const FamilyPage = lazy(() =>
  import("@client/pages/FamilyPage").then((module) => ({ default: module.FamilyPage }))
);
const JoinFamilyPage = lazy(() =>
  import("@client/pages/JoinFamilyPage").then((module) => ({ default: module.JoinFamilyPage }))
);
const ChildrenPage = lazy(() =>
  import("@client/pages/ChildrenPage").then((module) => ({ default: module.ChildrenPage }))
);
const ChildProfilePage = lazy(() =>
  import("@client/pages/ChildProfilePage").then((module) => ({ default: module.ChildProfilePage }))
);
const ChildCreatePage = lazy(() =>
  import("@client/pages/ChildCreatePage").then((module) => ({ default: module.ChildCreatePage }))
);
const ChildEditPage = lazy(() =>
  import("@client/pages/ChildEditPage").then((module) => ({ default: module.ChildEditPage }))
);
const ChildSleepPage = lazy(() =>
  import("@client/pages/ChildSleepPage").then((module) => ({ default: module.ChildSleepPage }))
);
const ChildFeedingPage = lazy(() =>
  import("@client/pages/ChildFeedingPage").then((module) => ({ default: module.ChildFeedingPage }))
);
const ChildFeedingCreatePage = lazy(() =>
  import("@client/pages/ChildFeedingCreatePage").then((module) => ({
    default: module.ChildFeedingCreatePage,
  }))
);
const ChildWeightPage = lazy(() =>
  import("@client/pages/ChildWeightPage").then((module) => ({
    default: module.ChildWeightPage,
  }))
);
const ChildHeightPage = lazy(() =>
  import("@client/pages/ChildHeightPage").then((module) => ({
    default: module.ChildHeightPage,
  }))
);
const ChildCalendarPage = lazy(() =>
  import("@client/pages/ChildCalendarPage").then((module) => ({
    default: module.ChildCalendarPage,
  }))
);
const MedicineCabinetPage = lazy(() =>
  import("@client/pages/MedicineCabinetPage").then((module) => ({
    default: module.MedicineCabinetPage,
  }))
);
const PillboxPage = lazy(() =>
  import("@client/pages/PillboxPage").then((module) => ({ default: module.PillboxPage }))
);
const ChildIllnessPage = lazy(() =>
  import("@client/pages/ChildIllnessPage").then((module) => ({ default: module.ChildIllnessPage }))
);
const ActiveIllnessesPage = lazy(() =>
  import("@client/pages/ActiveIllnessesPage").then((module) => ({
    default: module.ActiveIllnessesPage,
  }))
);
const IllnessHistoryPage = lazy(() =>
  import("@client/pages/IllnessHistoryPage").then((module) => ({
    default: module.IllnessHistoryPage,
  }))
);
const MorePage = lazy(() =>
  import("@client/pages/MorePage").then((module) => ({ default: module.MorePage }))
);
const FeedbackPage = lazy(() =>
  import("@client/pages/FeedbackPage").then((module) => ({ default: module.FeedbackPage }))
);
const LegalPage = lazy(() =>
  import("@client/pages/LegalPage").then((module) => ({ default: module.LegalPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import("@client/pages/PrivacyPolicyPage").then((module) => ({
    default: module.PrivacyPolicyPage,
  }))
);
const TermsOfUsePage = lazy(() =>
  import("@client/pages/TermsOfUsePage").then((module) => ({ default: module.TermsOfUsePage }))
);
const SupportPage = lazy(() =>
  import("@client/pages/SupportPage").then((module) => ({ default: module.SupportPage }))
);
const AdminLayout = lazy(() =>
  import("@admin/layout/AdminLayout").then((module) => ({ default: module.AdminLayout }))
);
const AdminHomePage = lazy(() =>
  import("@admin/pages/AdminHomePage").then((module) => ({ default: module.AdminHomePage }))
);

const IOS_FIRST_LAUNCH_NON_CRITICAL_DELAY_MS = 1400;
const IOS_REPEAT_LAUNCH_NON_CRITICAL_DELAY_MS = 600;
const IOS_FIRST_LAUNCH_PUSH_SYNC_DELAY_MS = 6000;
const IOS_REPEAT_LAUNCH_PUSH_SYNC_DELAY_MS = 3000;

function RouteFallback() {
  const [isBootReady, setIsBootReady] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean((window as Window & { __PM_BOOT_READY?: boolean }).__PM_BOOT_READY);
  });

  useEffect(() => {
    if (typeof window === "undefined" || isBootReady) {
      return;
    }

    const handleBootReady = () => setIsBootReady(true);
    window.addEventListener("app:boot-ready", handleBootReady, { once: true });
    return () => window.removeEventListener("app:boot-ready", handleBootReady);
  }, [isBootReady]);

  return isBootReady ? null : <AppBootSplash />;
}

function IOSRouteSnapshotSync() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    return () => {
      const frame = document.querySelector(".app-shell-frame");
      if (!(frame instanceof HTMLElement)) {
        return;
      }
      const clone = frame.cloneNode(true);
      if (!(clone instanceof HTMLElement)) {
        return;
      }
      clone.classList.remove("app-shell-frame");
      clone.classList.add("app-shell-auth", "ios-back-swipe-underlay-screen__content");
      clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      (
        window as Window & { __PM_IOS_PREVIOUS_SCREEN_HTML?: string }
      ).__PM_IOS_PREVIOUS_SCREEN_HTML = clone.outerHTML;
    };
  }, [location.pathname, location.search]);

  return null;
}

function useGlobalBootReady() {
  const [isBootReady, setIsBootReady] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean((window as Window & { __PM_BOOT_READY?: boolean }).__PM_BOOT_READY);
  });

  useEffect(() => {
    if (typeof window === "undefined" || isBootReady) {
      return;
    }

    const handleBootReady = () => setIsBootReady(true);
    window.addEventListener("app:boot-ready", handleBootReady, { once: true });
    return () => window.removeEventListener("app:boot-ready", handleBootReady);
  }, [isBootReady]);

  return isBootReady;
}

function useDeferredNonCriticalStartupReady() {
  const isBootReady = useGlobalBootReady();
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
  const [isInitialNativeLaunch] = useState(() => {
    if (!isNativeIos || typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
  });
  const [isReady, setIsReady] = useState(!isNativeIos);

  useEffect(() => {
    if (!isNativeIos) {
      setIsReady(true);
      return;
    }

    if (!isBootReady) {
      setIsReady(false);
      return;
    }

    setIsReady(false);
    const timeoutId = window.setTimeout(
      () => setIsReady(true),
      isInitialNativeLaunch
        ? IOS_FIRST_LAUNCH_NON_CRITICAL_DELAY_MS
        : IOS_REPEAT_LAUNCH_NON_CRITICAL_DELAY_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [isBootReady, isInitialNativeLaunch, isNativeIos]);

  return isReady;
}

function BootLog() {
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      return;
    }
    const api = import.meta.env.VITE_API_URL?.trim() || "прокси /api";
    appLog.info(`Store гидратирован, API=${api}`);
  }, []);
  return null;
}

function ThemeSync() {
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    document.documentElement.style.colorScheme = effectiveTheme;
    const background = effectiveTheme === "dark" ? "#1e1b2e" : "#ebe4ff";
    document.documentElement.style.background = background;
    document.body.style.background = background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
    document
      .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      ?.setAttribute("content", effectiveTheme === "dark" ? "black-translucent" : "default");
  }, [effectiveTheme]);

  useEffect(() => {
    const syncThemeAfterRestore = () => {
      const background = effectiveTheme === "dark" ? "#1e1b2e" : "#ebe4ff";
      document.documentElement.setAttribute("data-theme", effectiveTheme);
      document.documentElement.style.colorScheme = effectiveTheme;
      document.documentElement.style.background = background;
      document.body.style.background = background;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
      document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.setAttribute("content", effectiveTheme === "dark" ? "black-translucent" : "default");
    };

    window.addEventListener("pageshow", syncThemeAfterRestore);
    document.addEventListener("visibilitychange", syncThemeAfterRestore);
    return () => {
      window.removeEventListener("pageshow", syncThemeAfterRestore);
      document.removeEventListener("visibilitychange", syncThemeAfterRestore);
    };
  }, [effectiveTheme]);
  return null;
}

function DisplayModeSync() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const applyDisplayMode = () => {
      const isStandalone =
        mediaQuery.matches ||
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      document.documentElement.setAttribute(
        "data-display-mode",
        isStandalone ? "standalone" : "browser"
      );
    };

    applyDisplayMode();
    mediaQuery.addEventListener("change", applyDisplayMode);

    return () => mediaQuery.removeEventListener("change", applyDisplayMode);
  }, []);

  return null;
}

function RouteScrollReset() {
  const location = useLocation();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    blurActiveField();
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = location.pathname;

    if (previousPathname === location.pathname) {
      return;
    }

    const isCreateObservationRoute =
      location.pathname.startsWith("/children/") &&
      location.pathname.endsWith("/illness") &&
      new URLSearchParams(location.search).get("mode") === "create";

    if (isCreateObservationRoute) {
      return;
    }

    const isMobileViewport = window.innerWidth < 768;
    const isPrimaryMenuRoute = [
      "/children",
      "/pillbox",
      "/medicine-cabinet",
      "/home",
      "/more",
      "/illnesses/active",
      "/illnesses/history",
      "/family",
      "/account",
      "/settings",
      "/about",
      "/feedback",
      "/legal",
      "/legal/privacy",
      "/legal/terms",
      "/legal/support",
    ].some((path) => location.pathname === path);

    if (!isMobileViewport || !isPrimaryMenuRoute) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
}

function AuthSync() {
  const queryClient = useQueryClient();
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const refreshToken = useAppStore((s) => s.refreshToken);
  const setSession = useAppStore((s) => s.setSession);
  const setAuthState = useAppStore((s) => s.setAuthState);
  const clearSession = useAppStore((s) => s.clearSession);

  useEffect(() => {
    setBearerToken(authToken);
  }, [authToken]);

  useEffect(() => {
    setRefreshHandler(async () => {
      const nextSession = await refreshSession(refreshToken);
      setSession(nextSession);
      setBearerToken(nextSession.accessToken);
      return nextSession.accessToken;
    });
    return () => setRefreshHandler(null);
  }, [refreshToken, setSession]);

  const { data } = useQuery({
    queryKey: ["auth", "me", authToken, accountId],
    queryFn: fetchMe,
    enabled: Boolean(authToken || refreshToken || accountId),
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) {
      setAuthState(data);
    }
  }, [data, setAuthState]);

  useEffect(() => {
    const handleLogout = () => {
      appLog.warn("Сессия сброшена (401 / выход)");
      queryClient.clear();
      clearSession();
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearSession, queryClient]);

  return null;
}

function PushSubscriptionSync() {
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const isBootReady = useGlobalBootReady();
  const [isIosPushSyncReady, setIsIosPushSyncReady] = useState(
    !(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")
  );

  useEffect(() => {
    if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) {
      setIsIosPushSyncReady(true);
      return;
    }

    setIsIosPushSyncReady(false);
    const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
    const isInitialNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    const timeoutId = window.setTimeout(
      () => {
        setIsIosPushSyncReady(true);
      },
      isInitialNativeLaunch
        ? IOS_FIRST_LAUNCH_PUSH_SYNC_DELAY_MS
        : IOS_REPEAT_LAUNCH_PUSH_SYNC_DELAY_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(authToken && accountId && isBootReady && isIosPushSyncReady),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isBootReady || !isIosPushSyncReady || !authToken || !accountId || !pushConfig?.enabled) {
      return;
    }

    let isCancelled = false;

    const sync = async () => {
      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            return;
          }
          const nativePayload = getCachedNativePushSubscriptionPayload();
          if (!nativePayload || isCancelled) {
            return;
          }
          await upsertPushSubscription(nativePayload);
          return;
        }

        if (!isPushSupported() || Notification.permission !== "granted") {
          return;
        }
        const webSubscription = await getExistingPushSubscription();
        if (!webSubscription || isCancelled) {
          return;
        }
        await upsertPushSubscription(toPushSubscriptionPayload(webSubscription));
      } catch (e) {
        appLog.dev("Push: синхронизация подписки пропущена", e);
      }
    };

    void sync();

    return () => {
      isCancelled = true;
    };
  }, [accountId, authToken, isBootReady, isIosPushSyncReady, pushConfig?.enabled]);

  return null;
}

function NativePushNavigationSync() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: unknown }>).detail;
      const url = detail?.url;
      if (typeof url !== "string" || !url.startsWith("/")) {
        return;
      }
      navigate(url, { replace: false });
    };

    window.addEventListener(NATIVE_PUSH_NAVIGATION_EVENT, handleNavigate);
    return () => window.removeEventListener(NATIVE_PUSH_NAVIGATION_EVENT, handleNavigate);
  }, [navigate]);

  return null;
}

function PullToRefreshSync() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      return;
    }

    if (typeof window === "undefined" || !("ontouchstart" in window)) {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    if (!mediaQuery.matches) {
      return;
    }

    let startY = 0;
    let pullDistance = 0;
    let canRefresh = false;
    let scrollElement: Element | null = null;

    const getScrollTop = () => {
      if (scrollElement instanceof HTMLElement) {
        return scrollElement.scrollTop;
      }
      return window.scrollY;
    };

    const refreshPageData = async () => {
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      setIsRefreshing(true);

      try {
        await queryClient.refetchQueries({ type: "active" });
      } finally {
        refreshTimeoutRef.current = window.setTimeout(() => {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          refreshTimeoutRef.current = null;
        }, 420);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (event.touches.length !== 1 || !touch) {
        canRefresh = false;
        return;
      }

      scrollElement = document.scrollingElement;
      canRefresh = getScrollTop() <= 0;
      startY = touch.clientY;
      pullDistance = 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!canRefresh || event.touches.length !== 1 || !touch) {
        return;
      }

      const currentY = touch.clientY;
      pullDistance = currentY - startY;
    };

    const handleTouchEnd = () => {
      if (canRefresh && pullDistance > 96) {
        void refreshPageData();
      }

      canRefresh = false;
      startY = 0;
      pullDistance = 0;
      scrollElement = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [location.key, queryClient]);

  if (!isRefreshing) {
    return null;
  }

  return (
    <div className="soft-refresh-overlay" aria-live="polite" aria-label="Обновляем страницу">
      <div className="soft-refresh-indicator">
        <span className="soft-refresh-spinner" aria-hidden="true" />
        <span>Обновляем…</span>
      </div>
    </div>
  );
}

function MobilePageResumeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let lastHiddenAt = Date.now();

    const refreshActiveQueries = () => {
      void queryClient.refetchQueries({ type: "active" });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt = Date.now();
        return;
      }

      if (Date.now() - lastHiddenAt > 1500) {
        refreshActiveQueries();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshActiveQueries();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", refreshActiveQueries);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", refreshActiveQueries);
    };
  }, [queryClient]);

  return null;
}

function RuntimePlatformSync() {
  useEffect(() => {
    const root = document.documentElement;
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const isIosShell = detectIosShell();
    root.setAttribute("data-runtime", isNative ? "native" : "web");
    root.setAttribute("data-platform", platform);
    root.setAttribute("data-ios-shell", isIosShell ? "true" : "false");
    return () => {
      root.removeAttribute("data-runtime");
      root.removeAttribute("data-platform");
      root.removeAttribute("data-ios-shell");
    };
  }, []);

  return null;
}

function IosSafeAreaSync() {
  useLayoutEffect(() => {
    if (!detectIosShell()) {
      return;
    }

    const root = document.documentElement;
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "fixed";
    probe.style.top = "0";
    probe.style.left = "0";
    probe.style.width = "0";
    probe.style.height = "0";
    probe.style.opacity = "0";
    probe.style.pointerEvents = "none";
    probe.style.paddingTop = "env(safe-area-inset-top)";
    probe.style.paddingBottom = "env(safe-area-inset-bottom)";
    document.body.appendChild(probe);

    let rafId = 0;
    let timeoutId: number | null = null;

    const applySafeArea = () => {
      const styles = window.getComputedStyle(probe);
      const top = Number.parseFloat(styles.paddingTop || "0");
      const bottom = Number.parseFloat(styles.paddingBottom || "0");
      root.style.setProperty("--app-safe-top-runtime", `${Math.max(0, top)}px`);
      root.style.setProperty("--app-safe-bottom-runtime", `${Math.max(0, bottom)}px`);
    };

    const scheduleApply = () => {
      window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      rafId = window.requestAnimationFrame(() => {
        applySafeArea();
        timeoutId = window.setTimeout(applySafeArea, 180);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleApply();
      }
    };

    scheduleApply();
    window.addEventListener("resize", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);
    window.addEventListener("orientationchange", scheduleApply);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("resize", scheduleApply);
      window.removeEventListener("pageshow", scheduleApply);
      window.removeEventListener("orientationchange", scheduleApply);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      probe.remove();
    };
  }, []);

  return null;
}

function IOSKeyboardViewportSync() {
  useEffect(() => {
    if (!detectIosShell()) {
      return;
    }

    return () => {
      document.documentElement.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}

function IOSBackSwipeZone() {
  const location = useLocation();
  const navigate = useNavigate();
  const [previousScreenHtml, setPreviousScreenHtml] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return (
      (window as Window & { __PM_IOS_PREVIOUS_SCREEN_HTML?: string })
        .__PM_IOS_PREVIOUS_SCREEN_HTML ?? ""
    );
  });
  const swipeStateRef = useRef<{
    startX: number;
    startY: number;
    latestDx: number;
    renderedDx: number;
    horizontalLocked: boolean;
    active: boolean;
    resetTimeoutId: number | null;
  }>({
    startX: 0,
    startY: 0,
    latestDx: 0,
    renderedDx: 0,
    horizontalLocked: false,
    active: false,
    resetTimeoutId: null,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    document.documentElement.setAttribute("data-ios-back-swipe-zone", "true");
    return () => {
      if (swipeStateRef.current.resetTimeoutId !== null) {
        window.clearTimeout(swipeStateRef.current.resetTimeoutId);
      }
      document.documentElement.style.removeProperty("--ios-back-swipe-offset");
      document.documentElement.style.removeProperty("--ios-back-swipe-progress");
      document.documentElement.removeAttribute("data-ios-back-swipe-active");
      document.documentElement.removeAttribute("data-ios-back-swipe-commit");
      document.documentElement.removeAttribute("data-ios-back-swipe-cancel");
      document.documentElement.removeAttribute("data-ios-back-swipe-zone");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setPreviousScreenHtml(
      (window as Window & { __PM_IOS_PREVIOUS_SCREEN_HTML?: string })
        .__PM_IOS_PREVIOUS_SCREEN_HTML ?? ""
    );
  }, [location.pathname, location.search]);

  const pillboxMode = new URLSearchParams(location.search).get("mode");
  const shouldDisableSwipeBack =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/start" ||
    location.pathname === "/children" ||
    location.pathname === "/medicine-cabinet" ||
    location.pathname === "/illnesses/active" ||
    (location.pathname === "/pillbox" && !pillboxMode);

  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "ios" ||
    shouldDisableSwipeBack
  ) {
    return null;
  }

  return (
    <>
      <div aria-hidden="true" className="ios-back-swipe-underlay">
        {previousScreenHtml ? (
          <div
            className="ios-back-swipe-underlay-screen"
            dangerouslySetInnerHTML={{ __html: previousScreenHtml }}
          />
        ) : null}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 30,
          zIndex: 160,
          touchAction: "pan-y",
        }}
        onTouchStart={(event) => {
          const touch = event.touches.item(0);
          if (!touch) {
            return;
          }
          const root = document.documentElement;
          if (swipeStateRef.current.resetTimeoutId !== null) {
            window.clearTimeout(swipeStateRef.current.resetTimeoutId);
            swipeStateRef.current.resetTimeoutId = null;
          }
          swipeStateRef.current.startX = touch.clientX;
          swipeStateRef.current.startY = touch.clientY;
          swipeStateRef.current.latestDx = 0;
          swipeStateRef.current.renderedDx = 0;
          swipeStateRef.current.horizontalLocked = false;
          swipeStateRef.current.active = true;
          root.removeAttribute("data-ios-back-swipe-commit");
          root.removeAttribute("data-ios-back-swipe-cancel");
          root.setAttribute("data-ios-back-swipe-active", "true");
          root.style.setProperty("--ios-back-swipe-offset", "0px");
          root.style.setProperty("--ios-back-swipe-progress", "0");
        }}
        onTouchMove={(event) => {
          const touch = event.touches.item(0);
          if (!touch || !swipeStateRef.current.active) {
            return;
          }
          const root = document.documentElement;
          const dx = Math.max(0, touch.clientX - swipeStateRef.current.startX);
          const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
          swipeStateRef.current.latestDx = dx;
          if (!swipeStateRef.current.horizontalLocked && dx >= 18 && dx >= dy * 1.08) {
            swipeStateRef.current.horizontalLocked = true;
          }
          const verticalCancelThreshold = swipeStateRef.current.horizontalLocked ? 132 : 84;
          if (dy > verticalCancelThreshold) {
            swipeStateRef.current.active = false;
            root.removeAttribute("data-ios-back-swipe-active");
            root.setAttribute("data-ios-back-swipe-cancel", "true");
            root.style.setProperty("--ios-back-swipe-offset", "0px");
            root.style.setProperty("--ios-back-swipe-progress", "0");
            swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
              root.removeAttribute("data-ios-back-swipe-cancel");
              swipeStateRef.current.resetTimeoutId = null;
            }, 220);
            return;
          }
          const previousOffset = swipeStateRef.current.renderedDx;
          const targetOffset = Math.min(swipeStateRef.current.latestDx, window.innerWidth);
          const offset =
            targetOffset >= previousOffset
              ? targetOffset
              : previousOffset + (targetOffset - previousOffset) * 0.38;
          swipeStateRef.current.renderedDx = Math.max(0, offset);
          const progress = Math.min(1, offset / Math.max(window.innerWidth, 1));
          root.style.setProperty("--ios-back-swipe-offset", `${offset}px`);
          root.style.setProperty("--ios-back-swipe-progress", `${progress}`);
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches.item(0);
          if (!touch) {
            return;
          }
          const root = document.documentElement;
          const startX = swipeStateRef.current.startX;
          const startY = swipeStateRef.current.startY;
          const dx = Math.max(0, touch.clientX - startX);
          const dy = Math.abs(touch.clientY - startY);
          swipeStateRef.current.active = false;
          const canCommit =
            dx >= 40 && (swipeStateRef.current.horizontalLocked || (dy <= 88 && dy <= dx * 1.35));
          if (canCommit) {
            const activeElement = document.activeElement;
            if (
              activeElement instanceof HTMLElement &&
              activeElement.closest("input, textarea, select, [contenteditable='true']")
            ) {
              blurActiveField();
              root.removeAttribute("data-ios-back-swipe-active");
              root.setAttribute("data-ios-back-swipe-cancel", "true");
              root.style.setProperty("--ios-back-swipe-offset", "0px");
              root.style.setProperty("--ios-back-swipe-progress", "0");
              swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
                root.removeAttribute("data-ios-back-swipe-cancel");
                swipeStateRef.current.resetTimeoutId = null;
              }, 220);
              return;
            }
            root.removeAttribute("data-ios-back-swipe-active");
            root.setAttribute("data-ios-back-swipe-commit", "true");
            root.style.setProperty(
              "--ios-back-swipe-offset",
              `${Math.min(dx, window.innerWidth)}px`
            );
            root.style.setProperty("--ios-back-swipe-progress", "1");
            swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
              root.removeAttribute("data-ios-back-swipe-commit");
              root.style.removeProperty("--ios-back-swipe-offset");
              root.style.removeProperty("--ios-back-swipe-progress");
              swipeStateRef.current.resetTimeoutId = null;
              navigate(-1);
            }, 150);
            return;
          }
          root.removeAttribute("data-ios-back-swipe-active");
          root.setAttribute("data-ios-back-swipe-cancel", "true");
          root.style.setProperty("--ios-back-swipe-offset", "0px");
          root.style.setProperty("--ios-back-swipe-progress", "0");
          swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
            root.removeAttribute("data-ios-back-swipe-cancel");
            swipeStateRef.current.resetTimeoutId = null;
          }, 220);
        }}
      />
    </>
  );
}

function IOSLandingGestureGuard() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const shouldLockHorizontal = location.pathname === "/";

    if (shouldLockHorizontal) {
      html.classList.add("ios-lock-horizontal");
      body.classList.add("ios-lock-horizontal");
    } else {
      html.classList.remove("ios-lock-horizontal");
      body.classList.remove("ios-lock-horizontal");
    }

    return () => {
      html.classList.remove("ios-lock-horizontal");
      body.classList.remove("ios-lock-horizontal");
    };
  }, [location.pathname]);

  return null;
}

function GlobalTapGuard() {
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      return;
    }

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 1024 ||
      (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
    if (!isMobile) {
      return;
    }

    const lastTapByElement = new WeakMap<HTMLElement, number>();
    const TAP_BLOCK_MS = 320;

    const findActionElement = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      return target.closest(
        "button, a[role='button'], [role='menuitem'], [role='menuitemradio'], .soft-button-primary, .soft-button-secondary, .soft-tab, .soft-tab-active, .app-btn-primary-md, .app-btn-danger-md"
      );
    };

    const isElementDisabled = (element: HTMLElement) => {
      if (element instanceof HTMLButtonElement) {
        return element.disabled;
      }
      return element.getAttribute("aria-disabled") === "true";
    };

    const handleClickCapture = (event: MouseEvent) => {
      const actionElement = findActionElement(event.target);
      if (!actionElement || isElementDisabled(actionElement)) {
        return;
      }
      const now = performance.now();
      const last = lastTapByElement.get(actionElement) ?? 0;
      if (now - last < TAP_BLOCK_MS) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      lastTapByElement.set(actionElement, now);
    };

    document.addEventListener("click", handleClickCapture, true);
    return () => document.removeEventListener("click", handleClickCapture, true);
  }, []);

  return null;
}

function MobileInteractionDiagnostics() {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 1024 ||
      (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
    if (!isMobile) {
      return;
    }

    let observer: PerformanceObserver | null = null;

    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration >= 120) {
              appLog.warn(`UI long task detected: ${entry.duration.toFixed(0)}ms`);
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        observer = null;
      }
    }

    const findActionElement = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      return target.closest(
        "button, a[role='button'], [role='menuitem'], [role='menuitemradio'], .soft-button-primary, .soft-button-secondary, .soft-tab, .soft-tab-active, .app-btn-primary-md, .app-btn-danger-md"
      );
    };

    const handlePointerDown = (event: PointerEvent) => {
      const actionElement = findActionElement(event.target);
      if (!actionElement) {
        return;
      }
      const startedAt = performance.now();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const delay = performance.now() - startedAt;
          if (delay >= 140) {
            const text = actionElement.textContent?.trim()?.slice(0, 60) || "unknown";
            appLog.warn(`Slow tap reaction: ${delay.toFixed(0)}ms (${text})`);
          }
        });
      });
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      observer?.disconnect();
    };
  }, []);

  return null;
}

function WarmRouteChunks() {
  const role = useAppStore((s) => s.role);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const isBootReady = useGlobalBootReady();
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
  const [isInitialNativeLaunch] = useState(() => {
    if (!isNativeIos || typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
  });

  useEffect(() => {
    if (!(authToken || accountId) || role === "admin") {
      return;
    }

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

    const warmRoutes = () => {
      if (cancelled) {
        return;
      }

      const activeElement = document.activeElement;
      const isUserTyping =
        activeElement instanceof HTMLElement &&
        Boolean(activeElement.closest("input, textarea, select, [contenteditable='true']"));

      if (isUserTyping) {
        timeoutId = window.setTimeout(warmRoutes, 1400);
        return;
      }

      void Promise.allSettled([
        import("@client/pages/ChildrenPage"),
        import("@client/pages/ChildSleepPage"),
        import("@client/pages/ChildFeedingPage"),
        import("@client/pages/ChildIllnessPage"),
        import("@client/pages/PillboxPage"),
        import("@client/pages/MedicineCabinetPage"),
        import("@client/pages/ActiveIllnessesPage"),
        import("@client/pages/MorePage"),
        import("@client/pages/SettingsPage"),
        import("@client/pages/FamilyPage"),
      ]);
    };

    const scheduleWarmRoutes = () => {
      if (!isBootReady) {
        timeoutId = window.setTimeout(warmRoutes, isNativeIos ? 900 : 120);
        return;
      }

      if (typeof windowWithIdleApi.requestIdleCallback === "function") {
        idleId = windowWithIdleApi.requestIdleCallback(
          () => {
            warmRoutes();
          },
          { timeout: isNativeIos ? 4600 : 3200 }
        );
        return;
      }

      timeoutId = window.setTimeout(warmRoutes, isNativeIos ? 3400 : 2200);
    };

    timeoutId = window.setTimeout(
      scheduleWarmRoutes,
      isBootReady
        ? isNativeIos
          ? isInitialNativeLaunch
            ? 4200
            : 2400
          : 1800
        : isNativeIos
          ? 900
          : 220
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
  }, [accountId, authToken, isBootReady, isInitialNativeLaunch, isNativeIos, role]);

  return null;
}

export default function App() {
  const role = useAppStore((s) => s.role);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const hydrated = useAppStore((s) => s.hydrated);
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isNonCriticalStartupReady = useDeferredNonCriticalStartupReady();
  const [cookieConsent, setCookieConsent] = useState<CookieConsentDecision | null>(() =>
    getCookieConsentDecision()
  );

  useEffect(() => {
    const handleConsentChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentDecision>).detail;
      if (detail === "accepted" || detail === "rejected") {
        setCookieConsent(detail);
        return;
      }
      setCookieConsent(getCookieConsentDecision());
    };

    window.addEventListener("cookie-consent:changed", handleConsentChanged as EventListener);
    return () =>
      window.removeEventListener("cookie-consent:changed", handleConsentChanged as EventListener);
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <BrowserRouter>
      {!isNativeRuntime ? (
        <a href="#app-route-root" className="a11y-skip-link">
          {language === "ru" ? "Перейти к содержимому" : "Skip to content"}
        </a>
      ) : null}
      <RuntimePlatformSync />
      <IOSRouteSnapshotSync />
      <IosSafeAreaSync />
      <IOSKeyboardViewportSync />
      <IOSBackSwipeZone />
      <BootLog />
      {isNonCriticalStartupReady ? <HitKeepBridge /> : null}
      <ThemeSync />
      <DisplayModeSync />
      <RouteScrollReset />
      <GlobalTapGuard />
      <MobileInteractionDiagnostics />
      <WarmRouteChunks />
      <NetworkStatusBanner />
      <IOSLandingGestureGuard />
      <AuthSync />
      {isNonCriticalStartupReady ? <PushSubscriptionSync /> : null}
      {isNonCriticalStartupReady ? <NativePushNavigationSync /> : null}
      {isNonCriticalStartupReady ? <MobilePageResumeSync /> : null}
      {isNonCriticalStartupReady ? <PullToRefreshSync /> : null}
      <Suspense fallback={<RouteFallback />}>
        <div id="app-route-root" tabIndex={-1}>
          <Routes>
            {!(authToken || accountId) ? (
              <>
                <Route
                  path="/"
                  element={
                    isNativeRuntime ? <Navigate to="/auth?mode=login" replace /> : <LandingPage />
                  }
                />
                <Route path="/join-family" element={<JoinFamilyPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/legal/terms" element={<TermsOfUsePage />} />
                <Route path="/legal/support" element={<SupportPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : role === "admin" ? (
              <>
                <Route path="/" element={<AdminLayout />}>
                  <Route index element={<AdminHomePage />} />
                  <Route path="auth" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </>
            ) : (
              <>
                <Route path="/" element={<ClientLayout />}>
                  <Route path="auth" element={<Navigate to="/" replace />} />
                  <Route index element={<ClientStartPage />} />
                  <Route path="home" element={<ClientHomePage />} />
                  <Route path="intro" element={<Navigate to="/home" replace />} />
                  <Route path="family" element={<FamilyPage />} />
                  <Route path="join-family" element={<JoinFamilyPage />} />
                  <Route path="children" element={<ChildrenPage />} />
                  <Route path="children/new" element={<ChildCreatePage />} />
                  <Route path="children/:childId/edit" element={<ChildEditPage />} />
                  <Route path="pillbox" element={<PillboxPage />} />
                  <Route path="children/:childId" element={<ChildProfilePage />} />
                  <Route path="children/:childId/sleep" element={<ChildSleepPage />} />
                  <Route path="children/:childId/feeding" element={<ChildFeedingPage />} />
                  <Route
                    path="children/:childId/feeding/new"
                    element={<ChildFeedingCreatePage />}
                  />
                  <Route path="children/:childId/weight" element={<ChildWeightPage />} />
                  <Route path="children/:childId/height" element={<ChildHeightPage />} />
                  <Route path="children/:childId/calendar" element={<ChildCalendarPage />} />
                  <Route path="illnesses/active" element={<ActiveIllnessesPage />} />
                  <Route path="illnesses/history" element={<IllnessHistoryPage />} />
                  <Route path="medicine-cabinet" element={<MedicineCabinetPage />} />
                  <Route path="medicine-cabinet/add" element={<MedicineCabinetPage />} />
                  <Route path="medicine-cabinet/add/:mode" element={<MedicineCabinetPage />} />
                  <Route
                    path="medicine-cabinet/:medicineId/new-pack"
                    element={<MedicineCabinetPage />}
                  />
                  <Route path="more" element={<MorePage />} />
                  <Route path="feedback" element={<FeedbackPage />} />
                  <Route path="legal" element={<LegalPage />} />
                  <Route path="legal/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="legal/terms" element={<TermsOfUsePage />} />
                  <Route path="legal/support" element={<SupportPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="children/:childId/illness" element={<ChildIllnessPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </>
            )}
          </Routes>
        </div>
      </Suspense>
      {cookieConsent === null ? <CookieConsentBanner /> : null}
    </BrowserRouter>
  );
}
