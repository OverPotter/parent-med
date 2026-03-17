/**
 * Точка роутинга: разветвление по роли (admin/client) в одном месте.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, refreshSession } from "@shared/api/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { setBearerToken, setRefreshHandler } from "@shared/api/client";
import { useAppStore } from "@shared/store/useAppStore";

import { ClientLayout } from "@client/layout/ClientLayout";
import { AuthPage } from "@client/pages/AuthPage";
import { ClientHomePage } from "@client/pages/ClientHomePage";
import { FamilyPage } from "@client/pages/FamilyPage";
import { ChildrenPage } from "@client/pages/ChildrenPage";
import { MedicineCabinetPage } from "@client/pages/MedicineCabinetPage";
import { ChildIllnessPage } from "@client/pages/ChildIllnessPage";
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

function AuthSync() {
  const authToken = useAppStore((s) => s.authToken);
  const refreshToken = useAppStore((s) => s.refreshToken);
  const setSession = useAppStore((s) => s.setSession);
  const setAuthState = useAppStore((s) => s.setAuthState);
  const clearSession = useAppStore((s) => s.clearSession);

  useEffect(() => {
    setBearerToken(authToken);
  }, [authToken]);

  useEffect(() => {
    if (!refreshToken) {
      setRefreshHandler(null);
      return;
    }
    setRefreshHandler(async () => {
      const nextSession = await refreshSession(refreshToken);
      setSession(nextSession);
      setBearerToken(nextSession.accessToken);
      return nextSession.accessToken;
    });
    return () => setRefreshHandler(null);
  }, [refreshToken, setSession]);

  const { data, error } = useQuery({
    queryKey: ["auth", "me", authToken],
    queryFn: fetchMe,
    enabled: !!authToken,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) {
      setAuthState(data);
    }
  }, [data, setAuthState]);

  useEffect(() => {
    if (error) {
      clearSession();
    }
  }, [error, clearSession]);

  useEffect(() => {
    const handleLogout = () => clearSession();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearSession]);

  return null;
}

export default function App() {
  const role = useAppStore((s) => s.role);
  const authToken = useAppStore((s) => s.authToken);
  const hydrated = useAppStore((s) => s.hydrated);

  if (!hydrated) {
    return null;
  }

  return (
    <BrowserRouter>
      <ThemeSync />
      <AuthSync />
      <Routes>
        {!authToken ? (
          <>
            <Route path="/" element={<AuthPage />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
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
              <Route index element={<ClientHomePage />} />
              <Route path="family" element={<FamilyPage />} />
              <Route path="children" element={<ChildrenPage />} />
              <Route path="medicine-cabinet" element={<MedicineCabinetPage />} />
              <Route path="children/:childId/illness" element={<ChildIllnessPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
