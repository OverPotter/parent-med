/** Роутинг: admin / client. */

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { setBearerToken, setRefreshHandler } from "@shared/api/client";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  isPushSupported,
  toPushSubscriptionPayload,
} from "@shared/utils/pushNotifications";
import { HitKeepBridge } from "@shared/analytics";
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
    if (!authToken || !accountId || !pushConfig?.enabled || !isPushSupported()) {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }

    let isCancelled = false;

    const sync = async () => {
      try {
        const subscription = await getExistingPushSubscription();
        if (!subscription || isCancelled) {
          return;
        }
        await upsertPushSubscription(toPushSubscriptionPayload(subscription));
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
        await queryClient.invalidateQueries();
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
      void queryClient.invalidateQueries();
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

export default function App() {
  const role = useAppStore((s) => s.role);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const hydrated = useAppStore((s) => s.hydrated);

  if (!hydrated) {
    return null;
  }

  return (
    <BrowserRouter>
      <BootLog />
      <HitKeepBridge />
      <ThemeSync />
      <DisplayModeSync />
      <RouteScrollReset />
      <AuthSync />
      <PushSubscriptionSync />
      <MobilePageResumeSync />
      <PullToRefreshSync />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {!(authToken || accountId) ? (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/join-family" element={<JoinFamilyPage />} />
              <Route path="/auth" element={<AuthPage />} />
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
                <Route path="pillbox" element={<PillboxPage />} />
                <Route path="children/:childId" element={<ChildProfilePage />} />
                <Route path="illnesses/active" element={<ActiveIllnessesPage />} />
                <Route path="illnesses/history" element={<IllnessHistoryPage />} />
                <Route path="medicine-cabinet" element={<MedicineCabinetPage />} />
                <Route path="more" element={<MorePage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="children/:childId/illness" element={<ChildIllnessPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
