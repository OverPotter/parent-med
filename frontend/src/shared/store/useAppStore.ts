/**
 * Глобальный стейт (Zustand): тема и auth для разветвления роутов.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";
type Role = "client" | "admin";
export type MedicationIntervalUnit = "hours" | "minutes";

interface AppState {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  hasSeenWorkspaceIntro: boolean;
  markWorkspaceIntroSeen: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  medicationIntervalUnit: MedicationIntervalUnit;
  setMedicationIntervalUnit: (unit: MedicationIntervalUnit) => void;
  /** Роль пользователя (MVP: по умолчанию client). */
  role: Role;
  setRole: (role: Role) => void;
  authToken: string | null;
  refreshToken: string | null;
  accountId: string | null;
  accountEmail: string | null;
  /** ID выбранной семьи для контекста (MVP: один пользователь — одна семья). */
  currentFamilyId: string | null;
  currentFamilyName: string | null;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    account: { id: string; email: string };
    family: { id: string; name: string };
  }) => void;
  setAuthState: (state: {
    account: { id: string; email: string };
    family: { id: string; name: string };
  }) => void;
  clearSession: () => void;
  setCurrentFamily: (family: { id: string; name: string } | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      hasSeenWorkspaceIntro: false,
      markWorkspaceIntroSeen: () => set({ hasSeenWorkspaceIntro: true }),
      theme: "dark",
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
      medicationIntervalUnit: "hours",
      setMedicationIntervalUnit: (unit) => set({ medicationIntervalUnit: unit }),
      role: "client",
      setRole: (role) => set({ role }),
      authToken: null,
      refreshToken: null,
      accountId: null,
      accountEmail: null,
      currentFamilyId: null,
      currentFamilyName: null,
      setSession: (session) =>
        set({
          authToken: session.accessToken,
          refreshToken: session.refreshToken,
          accountId: session.account.id,
          accountEmail: session.account.email,
          currentFamilyId: session.family.id,
          currentFamilyName: session.family.name,
        }),
      setAuthState: (state) =>
        set({
          accountId: state.account.id,
          accountEmail: state.account.email,
          currentFamilyId: state.family.id,
          currentFamilyName: state.family.name,
        }),
      clearSession: () =>
        set({
          authToken: null,
          refreshToken: null,
          accountId: null,
          accountEmail: null,
          currentFamilyId: null,
          currentFamilyName: null,
        }),
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
        medicationIntervalUnit: s.medicationIntervalUnit,
        role: s.role,
        hasSeenWorkspaceIntro: s.hasSeenWorkspaceIntro,
        authToken: s.authToken,
        refreshToken: s.refreshToken,
        accountId: s.accountId,
        accountEmail: s.accountEmail,
        currentFamilyId: s.currentFamilyId,
        currentFamilyName: s.currentFamilyName,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
