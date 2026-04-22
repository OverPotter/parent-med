/** Роутинг: admin / client. */

import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { NativeUnauthedBootReady } from "@/app/boot/NativeUnauthedBootReady";
import { RouteFallback, useDeferredNonCriticalStartupReady } from "@/app/boot/state";
import {
  DisplayModeSync,
  IosSafeAreaSync,
  RuntimePlatformSync,
  ThemeSync,
} from "@/app/runtime/sync";
import { ClientRuntimeMount } from "@/app/runtime/ClientRuntimeMount";
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
import { AuthPage } from "@client/pages/AuthPage";
import { appLog } from "@shared/utils/appLog";
import { cleanupDeviceSessionArtifacts } from "@shared/utils/sessionCleanup";
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

  const { data, error } = useQuery({
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
    if (!error || !(authToken || refreshToken || accountId)) {
      return;
    }
    appLog.warn("Сессия недействительна, сбрасываю локальный auth state");
    void cleanupDeviceSessionArtifacts();
    queryClient.clear();
    clearSession();
  }, [accountId, authToken, clearSession, error, queryClient, refreshToken]);

  useEffect(() => {
    const handleLogout = () => {
      appLog.warn("Сессия сброшена (401 / выход)");
      void cleanupDeviceSessionArtifacts();
      queryClient.clear();
      clearSession();
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearSession, queryClient]);

  return null;
}

export default function App() {
  const role = useAppStore((s) => s.role);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const hydrated = useAppStore((s) => s.hydrated);
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isStandalonePwa = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    );
  }, []);
  const isLocalhostWeb =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  const shouldUseAppEntryRoute = isNativeRuntime || isStandalonePwa || isLocalhostWeb;
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

      (bootWindow as Window & { __PM_BOOT_READY_SECOND_FRAME_ID?: number }).__PM_BOOT_READY_SECOND_FRAME_ID =
        secondFrameId;
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      const secondFrameId = (
        bootWindow as Window & { __PM_BOOT_READY_SECOND_FRAME_ID?: number }
      ).__PM_BOOT_READY_SECOND_FRAME_ID;
      if (typeof secondFrameId === "number") {
        window.cancelAnimationFrame(secondFrameId);
      }
    };
  }, [hydrated]);

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
      <DisplayModeSync />
      <RouteScrollReset />
      {!isNativeRuntime && import.meta.env.DEV ? <MobileInteractionDiagnostics /> : null}
      {!isNativeRuntime ? <WarmRouteChunks /> : null}
      <NetworkStatusBanner />
      <IOSLandingGestureGuard />
      <AuthSync />
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
                      <Navigate to="/auth?mode=login" replace />
                    ) : (
                      <LandingPage />
                    )
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
                  <Route path="workspace" element={<ClientWorkspacePage />} />
                  <Route path="home" element={<ClientHomePage />} />
                  <Route path="intro" element={<Navigate to="/home" replace />} />
                  <Route path="family" element={<FamilyPage />} />
                  <Route path="family/members" element={<FamilyMembersPage />} />
                  <Route
                    path="family/members/:memberAccountId/access"
                    element={<FamilyMemberAccessPage />}
                  />
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
