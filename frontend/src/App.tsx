/** Роутинг: admin / client. */

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
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
import { HitKeepBridge } from "@shared/analytics";
import { RouteFallback, useDeferredNonCriticalStartupReady } from "@/app/boot/state";
import {
  BootLog,
  DisplayModeSync,
  IosSafeAreaSync,
  RuntimePlatformSync,
  ThemeSync,
} from "@/app/runtime/sync";
import {
  IOSKeyboardViewportSync,
  IOSLandingGestureGuard,
  IOSRouteSnapshotSync,
} from "@/app/mobile/ios/sync";
import {
  GlobalTapGuard,
  MobileInteractionDiagnostics,
  MobilePageResumeSync,
  PullToRefreshSync,
  RouteScrollReset,
  WarmRouteChunks,
} from "@/app/mobile/runtime";
import { NativePushNavigationSync, PushSubscriptionSync } from "@/app/push/sync";
import { AuthPage } from "@client/pages/AuthPage";
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
