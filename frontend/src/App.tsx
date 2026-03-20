/**
 * Точка роутинга: разветвление по роли (admin/client) в одном месте.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { setBearerToken, setRefreshHandler } from "@shared/api/client";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  isPushSupported,
  toPushSubscriptionPayload,
} from "@shared/utils/pushNotifications";

import { ClientLayout } from "@client/layout/ClientLayout";
import { AccountPage } from "@client/pages/AccountPage";
import { LandingPage } from "@client/pages/LandingPage";
import { AuthPage } from "@client/pages/AuthPage";
import { AboutPage } from "@client/pages/AboutPage";
import { ClientHomePage } from "@client/pages/ClientHomePage";
import { ClientIntroPage } from "@client/pages/ClientIntroPage";
import { ClientStartPage } from "@client/pages/ClientStartPage";
import { FamilyPage } from "@client/pages/FamilyPage";
import { JoinFamilyPage } from "@client/pages/JoinFamilyPage";
import { ChildrenPage } from "@client/pages/ChildrenPage";
import { MedicineCabinetPage } from "@client/pages/MedicineCabinetPage";
import { ChildIllnessPage } from "@client/pages/ChildIllnessPage";
import { ActiveIllnessesPage } from "@client/pages/ActiveIllnessesPage";
import { IllnessHistoryPage } from "@client/pages/IllnessHistoryPage";
import { MorePage } from "@client/pages/MorePage";
import { AdminLayout } from "@admin/layout/AdminLayout";
import { AdminHomePage } from "@admin/pages/AdminHomePage";

/** При инициализации восстанавливаем data-theme из store. */
function ThemeSync() {
  const theme = useAppStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
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
      } catch {
        // Silent sync: UI в аккаунте остаётся основным местом управления.
      }
    };

    void sync();

    return () => {
      isCancelled = true;
    };
  }, [accountId, authToken, pushConfig?.enabled]);

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
      <ThemeSync />
      <DisplayModeSync />
      <AuthSync />
      <PushSubscriptionSync />
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
              <Route path="intro" element={<ClientIntroPage />} />
              <Route path="family" element={<FamilyPage />} />
              <Route path="join-family" element={<JoinFamilyPage />} />
              <Route path="children" element={<ChildrenPage />} />
              <Route path="illnesses/active" element={<ActiveIllnessesPage />} />
              <Route path="illnesses/history" element={<IllnessHistoryPage />} />
              <Route path="medicine-cabinet" element={<MedicineCabinetPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="children/:childId/illness" element={<ChildIllnessPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
