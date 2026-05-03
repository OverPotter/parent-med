/** Роутинг: admin / client. */

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
import { FAMILY_ACCESS_REFRESH_MS } from "@shared/hooks/useFamilyAccessQueryOptions";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { applySessionToClient, setBearerToken, setRefreshHandler } from "@shared/api/client";
import { useAppStore } from "@shared/store/useAppStore";
import { CookieConsentBanner } from "@shared/components/CookieConsentBanner";
import { NetworkStatusBanner } from "@shared/components/NetworkStatusBanner";
import {
  getCookieConsentDecision,
  type CookieConsentDecision,
} from "@shared/privacy/cookieConsent";
import { HitKeepBridge } from "@shared/analytics";
import { PUBLIC_WEBSITE_SHARED_ROUTE_PATHS } from "@/app/publicWebsiteRoutes";
import { NativeUnauthedBootReady } from "@/app/boot/NativeUnauthedBootReady";
import { RouteFallback, useDeferredNonCriticalStartupReady } from "@/app/boot/state";
import {
  IosSafeAreaSync,
  RuntimePlatformSync,
  ThemeSync,
} from "@/app/runtime/sync";
import { NativePushNavigationSync } from "@/app/push/sync";
import { ClientRuntimeMount } from "@/app/runtime/ClientRuntimeMount";
import { RevenueCatSync } from "@/app/billing/revenueCatSync";
import { IOSBackSwipeZone } from "@/app/mobile/ios/IOSBackSwipeZone";
import {
  IOSKeyboardViewportSync,
  IOSLandingGestureGuard,
  IOSRouteSnapshotSync,
} from "@/app/mobile/ios/sync";
import {
  MobileInteractionDiagnostics,
  RouteScrollReset,
  WarmRouteChunks,
} from "@/app/mobile/runtime";
import { DisplayNameOnboardingOverlay } from "@client/components/DisplayNameOnboardingOverlay";
import { AuthPage } from "@client/pages/AuthPage";
import { OnboardingPage } from "@client/pages/OnboardingPage";
import { ChildFeedingCreatePage } from "@client/pages/ChildFeedingCreatePage";
import { appLog } from "@shared/utils/appLog";
import { shouldClearSessionForAuthError } from "@shared/api/authSessionErrors";
import { shouldUseAppEntryWebMode } from "@shared/runtime/publicWebsiteMode";
import { cleanupDeviceSessionArtifacts } from "@shared/utils/sessionCleanup";
import { shouldRedirectAfterSessionLoss } from "@client/startup/startupDecisions";
const ClientLayout = lazy(() =>
  import("@client/layout/ClientLayout").then((module) => ({ default: module.ClientLayout }))
);
const AccountPage = lazy(() =>
  import("@client/pages/AccountPage").then((module) => ({ default: module.AccountPage }))
);
const AppOnlyRedirectPage = lazy(() =>
  import("@client/pages/AppOnlyRedirectPage").then((module) => ({
    default: module.AppOnlyRedirectPage,
  }))
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
const ClientWorkspacePage = lazy(() =>
  import("@client/pages/ClientWorkspacePage").then((module) => ({
    default: module.ClientWorkspacePage,
  }))
);
const ClientStartPage = lazy(() =>
  import("@client/pages/ClientStartPage").then((module) => ({ default: module.ClientStartPage }))
);
const FamilyPage = lazy(() =>
  import("@client/pages/FamilyPage").then((module) => ({ default: module.FamilyPage }))
);
const FamilyMembersPage = lazy(() =>
  import("@client/pages/FamilyMembersPage").then((module) => ({
    default: module.FamilyMembersPage,
  }))
);
const FamilyMemberAccessPage = lazy(() =>
  import("@client/pages/FamilyMemberAccessPage").then((module) => ({
    default: module.FamilyMemberAccessPage,
  }))
);
const RecoverPasswordPage = lazy(() =>
  import("@client/pages/RecoverPasswordPage").then((module) => ({
    default: module.RecoverPasswordPage,
  }))
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

function renderPublicWebsiteRoutes() {
  return PUBLIC_WEBSITE_SHARED_ROUTE_PATHS.map((path) => {
    if (path === "/") {
      return <Route key={path} path={path} element={<LandingPage />} />;
    }
    if (path === "/legal") {
      return <Route key={path} path={path} element={<LegalPage />} />;
    }
    if (path === "/legal/privacy") {
      return <Route key={path} path={path} element={<PrivacyPolicyPage />} />;
    }
    if (path === "/legal/terms") {
      return <Route key={path} path={path} element={<TermsOfUsePage />} />;
    }
    return <Route key={path} path={path} element={<SupportPage />} />;
  });
}

function AuthSync() {
  const queryClient = useQueryClient();
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const refreshToken = useAppStore((s) => s.refreshToken);
  const setAuthState = useAppStore((s) => s.setAuthState);
  const clearSession = useAppStore((s) => s.clearSession);

  useEffect(() => {
    setBearerToken(authToken);
  }, [authToken]);

  useEffect(() => {
    setRefreshHandler(async () => {
      const nextSession = await refreshSession(refreshToken);
      applySessionToClient(nextSession);
      return nextSession.accessToken;
    });
    return () => setRefreshHandler(null);
  }, [accountId, authToken, refreshToken]);

  const { data, error } = useQuery({
    queryKey: ["auth", "me", authToken, accountId],
    queryFn: fetchMe,
    enabled: Boolean(authToken || refreshToken),
    retry: false,
    staleTime: 0,
    refetchInterval: authToken || refreshToken ? FAMILY_ACCESS_REFRESH_MS : false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setAuthState(data);
    }
  }, [data, setAuthState]);

  useEffect(() => {
    if (!error || !(authToken || refreshToken || accountId)) {
      return;
    }
    if (!shouldClearSessionForAuthError(error)) {
      appLog.warn("Сессия: backend недоступен, сохраняю локальный auth state");
      return;
    }
    appLog.warn("Сессия недействительна, сбрасываю локальный auth state", {
      hasAuthToken: Boolean(authToken),
      hasRefreshToken: Boolean(refreshToken),
      hasAccountId: Boolean(accountId),
    });
    void cleanupDeviceSessionArtifacts({ includeServerCleanup: false });
    queryClient.clear();
    setBearerToken(null);
    clearSession();
  }, [accountId, authToken, clearSession, error, queryClient, refreshToken]);

  useEffect(() => {
    const handleLogout = () => {
      appLog.warn("Сессия сброшена (401 / выход)");
      void cleanupDeviceSessionArtifacts({ includeServerCleanup: false });
      queryClient.clear();
      setBearerToken(null);
      clearSession();
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearSession, queryClient]);

  return null;
}

function SessionLossRedirect({ defaultTargetPath }: { defaultTargetPath: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const hasSession = Boolean(authToken || accountId);
  const hadSessionRef = useRef(hasSession);
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  const targetPath = defaultTargetPath;

  useEffect(() => {
    if (
      shouldRedirectAfterSessionLoss({
        hadSession: hadSessionRef.current,
        hasSession,
        currentPath: currentUrl,
        targetPath,
      })
    ) {
      navigate(targetPath, { replace: true });
    }

    hadSessionRef.current = hasSession;
  }, [currentUrl, hasSession, navigate, targetPath]);

  return null;
}

function UnauthedOnboardingRoute({ authPath }: { authPath: string }) {
  const hasSeenAuthOnboarding = useAppStore((s) => s.hasSeenAuthOnboarding);
  return hasSeenAuthOnboarding ? <Navigate to={authPath} replace /> : <OnboardingPage />;
}

function UnauthedAuthRoute() {
  const hasSeenAuthOnboarding = useAppStore((s) => s.hasSeenAuthOnboarding);
  return hasSeenAuthOnboarding ? <AuthPage /> : <Navigate to="/onboarding" replace />;
}

export default function App() {
  const role = useAppStore((s) => s.role);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const hasSeenAuthOnboarding = useAppStore((s) => s.hasSeenAuthOnboarding);
  const isNativeRuntime = Capacitor.isNativePlatform();
  const shouldUseAppEntryRoute = isNativeRuntime || shouldUseAppEntryWebMode();
  const isPublicWebsiteMode = !isNativeRuntime && !shouldUseAppEntryWebMode();
  const sessionLossTargetPath = shouldUseAppEntryRoute ? "/auth?mode=login" : "/";
  const signedOutAuthPath = "/auth?mode=register";
  const signedOutEntryPath = shouldUseAppEntryRoute
    ? hasSeenAuthOnboarding
      ? signedOutAuthPath
      : "/onboarding"
    : "/";
  const isNonCriticalStartupReady = useDeferredNonCriticalStartupReady();
  const hasSession = Boolean(authToken || accountId);
  const shouldMountClientRuntime = isNonCriticalStartupReady && hasSession && role !== "admin";
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

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    const bootWindow = window as Window & { __PM_BOOT_READY?: boolean };
    if (bootWindow.__PM_BOOT_READY) {
      return;
    }

    const firstFrameId = window.requestAnimationFrame(() => {
      const secondFrameId = window.requestAnimationFrame(() => {
        if (bootWindow.__PM_BOOT_READY) {
          return;
        }
        bootWindow.__PM_BOOT_READY = true;
        window.dispatchEvent(new Event("app:boot-ready"));
      });

      (
        bootWindow as Window & { __PM_BOOT_READY_SECOND_FRAME_ID?: number }
      ).__PM_BOOT_READY_SECOND_FRAME_ID = secondFrameId;
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      const secondFrameId = (bootWindow as Window & { __PM_BOOT_READY_SECOND_FRAME_ID?: number })
        .__PM_BOOT_READY_SECOND_FRAME_ID;
      if (typeof secondFrameId === "number") {
        window.cancelAnimationFrame(secondFrameId);
      }
    };
  }, [hydrated]);

  useEffect(() => {
    if (hydrated || isNativeRuntime || typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (useAppStore.getState().hydrated) {
        return;
      }
      appLog.warn("Hydration watchdog: forcing web app render");
      setHydrated(true);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [hydrated, isNativeRuntime, setHydrated]);

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
      <NativeUnauthedBootReady />
      {isNonCriticalStartupReady ? <HitKeepBridge /> : null}
      <ThemeSync />
      <RouteScrollReset />
      {!isNativeRuntime && import.meta.env.DEV ? <MobileInteractionDiagnostics /> : null}
      <WarmRouteChunks />
      <NetworkStatusBanner />
      <IOSLandingGestureGuard />
      <AuthSync />
      <SessionLossRedirect defaultTargetPath={sessionLossTargetPath} />
      <RevenueCatSync />
      <DisplayNameOnboardingOverlay />
      {role !== "admin" ? <NativePushNavigationSync /> : null}
      <ClientRuntimeMount enabled={shouldMountClientRuntime} />
      <Suspense fallback={<RouteFallback />}>
        <div id="app-route-root" tabIndex={-1}>
          <Routes>
            {!(authToken || accountId) ? (
              <>
                <Route
                  path="/"
                  element={
                    shouldUseAppEntryRoute ? (
                      <Navigate to={signedOutEntryPath} replace />
                    ) : (
                      <LandingPage />
                    )
                  }
                />
                <Route
                  path="/onboarding"
                  element={<UnauthedOnboardingRoute authPath={signedOutAuthPath} />}
                />
                <Route path="/auth" element={<UnauthedAuthRoute />} />
                <Route path="/recover-password" element={<RecoverPasswordPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/legal/terms" element={<TermsOfUsePage />} />
                <Route path="/legal/support" element={<SupportPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : role === "admin" ? (
              isPublicWebsiteMode ? (
                <>
                  {renderPublicWebsiteRoutes()}
                  <Route path="*" element={<AppOnlyRedirectPage />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<AdminLayout />}>
                    <Route index element={<AdminHomePage />} />
                    <Route path="auth" element={<Navigate to="/" replace />} />
                    <Route path="recover-password" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </>
              )
            ) : (
              isPublicWebsiteMode ? (
                <>
                  {renderPublicWebsiteRoutes()}
                  <Route path="*" element={<AppOnlyRedirectPage />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<ClientLayout />}>
                    <Route path="auth" element={<Navigate to="/" replace />} />
                    <Route path="recover-password" element={<RecoverPasswordPage />} />
                    <Route index element={<ClientStartPage />} />
                    <Route path="workspace" element={<ClientWorkspacePage />} />
                    <Route path="home" element={<ClientHomePage />} />
                    <Route path="intro" element={<Navigate to="/home" replace />} />
                    <Route path="family" element={<FamilyPage />} />
                    <Route path="family/members" element={<FamilyMembersPage />} />
                    <Route
                      path="family/members/:memberAccountId/access"
                      element={<FamilyMemberAccessPage />}
                    />
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
              )
            )}
          </Routes>
        </div>
      </Suspense>
      {cookieConsent === null ? <CookieConsentBanner /> : null}
    </BrowserRouter>
  );
}
