/**
 * Точка роутинга: разветвление по роли (admin/client) в одном месте.
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@shared/store/useAppStore";

import { ClientLayout } from "@client/layout/ClientLayout";
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

export default function App() {
  const role = useAppStore((s) => s.role);

  return (
    <BrowserRouter>
      <ThemeSync />
      <Routes>
        {role === "admin" ? (
          <>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </>
        ) : (
          <>
            <Route path="/" element={<ClientLayout />}>
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
