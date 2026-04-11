/** Роутинг: admin / client. */

import { Suspense, lazy, useEffect, useRef, useState } from "react";
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
  getNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
} from "@shared/utils/nativePushNotifications";
import { HitKeepBridge } from "@shared/analytics";
import { detectIosShell } from "@shared/hooks/useIsIosShell";
import { appLog } from "@shared/utils/appLog";

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
const AuthPage = lazy(() =>
  import("@client/pages/AuthPage").then((module) => ({ default: module.AuthPage }))
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

function RouteFallback() {
  return <div className="min-h-screen soft-app-bg" aria-hidden="true" />;
}

function BootLog() {
  useEffect(() => {
    const api = import.meta.env.VITE_API_URL?.trim() || "прокси /api";
    appLog.info(`Store гидратирован, API=${api}`);
  }, []);
  return null;
}

function ThemeSync() {
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);
  useEffect(() => {
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

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(authToken && accountId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!authToken || !accountId || !pushConfig?.enabled) {
      return;
    }

    let isCancelled = false;

    const sync = async () => {
      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            return;
          }
          const nativePayload = await getNativePushSubscriptionPayload({ promptIfNeeded: false });
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
  }, [accountId, authToken, pushConfig?.enabled]);

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

function IOSKeyboardViewportSync() {
  useEffect(() => {
    if (!detectIosShell()) {
      return;
    }

    const root = document.documentElement;
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const syncKeyboardState = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
      const isKeyboardOpen = keyboardHeight > 140;
      root.setAttribute("data-keyboard-open", isKeyboardOpen ? "true" : "false");
    };

    syncKeyboardState();
    viewport.addEventListener("resize", syncKeyboardState);
    viewport.addEventListener("scroll", syncKeyboardState);

    return () => {
      root.removeAttribute("data-keyboard-open");
      viewport.removeEventListener("resize", syncKeyboardState);
      viewport.removeEventListener("scroll", syncKeyboardState);
    };
  }, []);

  return null;
}

function IOSSwipeBackSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    let tracking = false;
    let startX = 0;
    let startY = 0;

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      if (isInteractiveTarget(event.target)) {
        tracking = false;
        return;
      }
      const touch = event.touches.item(0);
      if (!touch || touch.clientX > 44) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) {
        return;
      }
      const touch = event.touches.item(0);
      if (!touch) {
        return;
      }
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dx < 0 || (dy > 34 && dy > dx)) {
        tracking = false;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!tracking) {
        return;
      }
      tracking = false;
      const touch = event.changedTouches.item(0);
      if (!touch) {
        return;
      }
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (pathnameRef.current === "/" || pathnameRef.current === "/home") {
        return;
      }
      if (dx >= 48 && dy <= 56 && dy <= dx * 0.9) {
        navigate(-1);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate]);

  return null;
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

export default function App() {
  const role = useAppStore((s) => s.role);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const hydrated = useAppStore((s) => s.hydrated);
  const isNativeRuntime = Capacitor.isNativePlatform();
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
      <IOSKeyboardViewportSync />
      <BootLog />
      {cookieConsent === "accepted" ? <HitKeepBridge /> : null}
      <ThemeSync />
      <DisplayModeSync />
      <RouteScrollReset />
      <GlobalTapGuard />
      <MobileInteractionDiagnostics />
      <NetworkStatusBanner />
      <IOSLandingGestureGuard />
      <IOSSwipeBackSync />
      <AuthSync />
      <PushSubscriptionSync />
      <MobilePageResumeSync />
      <PullToRefreshSync />
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
                  <Route path="pillbox" element={<PillboxPage />} />
                  <Route path="children/:childId" element={<ChildProfilePage />} />
                  <Route path="children/:childId/sleep" element={<ChildSleepPage />} />
                  <Route path="children/:childId/feeding" element={<ChildFeedingPage />} />
                  <Route path="children/:childId/feeding/new" element={<ChildFeedingCreatePage />} />
                  <Route path="children/:childId/weight" element={<ChildWeightPage />} />
                  <Route path="children/:childId/height" element={<ChildHeightPage />} />
                  <Route path="children/:childId/calendar" element={<ChildCalendarPage />} />
                  <Route path="illnesses/active" element={<ActiveIllnessesPage />} />
                  <Route path="illnesses/history" element={<IllnessHistoryPage />} />
                  <Route path="medicine-cabinet" element={<MedicineCabinetPage />} />
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
