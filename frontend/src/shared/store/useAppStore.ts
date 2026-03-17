/**
 * Глобальный стейт (Zustand): тема и auth для разветвления роутов.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";
type Role = "client" | "admin";

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Роль пользователя (MVP: по умолчанию client). */
  role: Role;
  setRole: (role: Role) => void;
  /** ID выбранной семьи для контекста (MVP: один пользователь — одна семья). */
  currentFamilyId: string | null;
  currentFamilyName: string | null;
  setCurrentFamily: (family: { id: string; name: string } | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      toggleTheme: () => {
        set((s) => {
          const next: Theme = s.theme === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", next);
          return { theme: next };
        });
      },
      role: "client",
      setRole: (role) => set({ role }),
      currentFamilyId: null,
      currentFamilyName: null,
      setCurrentFamily: (family) =>
        set({
          currentFamilyId: family?.id ?? null,
          currentFamilyName: family?.name ?? null,
        }),
    }),
    {
      name: "parent-med-app",
      partialize: (s) => ({
        theme: s.theme,
        role: s.role,
        currentFamilyId: s.currentFamilyId,
        currentFamilyName: s.currentFamilyName,
      }),
    }
  )
);
