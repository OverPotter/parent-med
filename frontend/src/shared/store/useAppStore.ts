/** Zustand: тема, auth, семья. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyLanguageToDocument, type AppLanguage } from "@shared/i18n";

type Theme = "light" | "dark";
type Role = "client" | "admin";
export type MedicationIntervalUnit = "hours" | "minutes";

function applyThemeToDocument(theme: Theme) {
  const background = theme === "dark" ? "#1e1b2e" : "#ebe4ff";
  const statusBarStyle = theme === "dark" ? "black-translucent" : "default";

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.background = background;
  document.body.style.background = background;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
  document
    .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute("content", statusBarStyle);
}

interface AppState {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  hasSeenWorkspaceIntro: boolean;
  markWorkspaceIntroSeen: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  medicationIntervalUnit: MedicationIntervalUnit;
  setMedicationIntervalUnit: (unit: MedicationIntervalUnit) => void;
  /** Роль пользователя (MVP: по умолчанию client). */
  role: Role;
  setRole: (role: Role) => void;
  authToken: string | null;
  refreshToken: string | null;
  accountId: string | null;
  accountLogin: string | null;
  accountEmail: string | null;
  accountDisplayName: string | null;
  accountPreferredLanguage: AppLanguage | null;
  accountFamilyRole: string | null;
  /** ID выбранной семьи для контекста (MVP: один пользователь — одна семья). */
  currentFamilyId: string | null;
  currentFamilyName: string | null;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    account: {
      id: string;
      login: string;
      email: string | null;
      displayName: string;
      preferredLanguage: AppLanguage;
      familyRole: string;
    };
    family: { id: string; name: string };
  }) => void;
  setAuthState: (state: {
    account: {
      id: string;
      login: string;
      email: string | null;
      displayName: string;
      preferredLanguage: AppLanguage;
      familyRole: string;
    };
    family: { id: string; name: string };
  }) => void;
  setAccountPreferredLanguage: (language: AppLanguage) => void;
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
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        applyThemeToDocument(theme);
      },
      toggleTheme: () => {
        set((s) => {
          const next: Theme = s.theme === "light" ? "dark" : "light";
          applyThemeToDocument(next);
          return { theme: next };
        });
      },
      language: "ru",
      setLanguage: (language) => {
        set({ language });
        applyLanguageToDocument(language);
      },
      medicationIntervalUnit: "hours",
      setMedicationIntervalUnit: (unit) => set({ medicationIntervalUnit: unit }),
      role: "client",
      setRole: (role) => set({ role }),
      authToken: null,
      refreshToken: null,
      accountId: null,
      accountLogin: null,
      accountEmail: null,
      accountDisplayName: null,
      accountPreferredLanguage: null,
      accountFamilyRole: null,
      currentFamilyId: null,
      currentFamilyName: null,
      setSession: (session) =>
        set(() => {
          applyLanguageToDocument(session.account.preferredLanguage);
          return {
            authToken: session.accessToken,
            refreshToken: session.refreshToken,
            accountId: session.account.id,
            accountLogin: session.account.login,
            accountEmail: session.account.email,
            accountDisplayName: session.account.displayName,
            accountPreferredLanguage: session.account.preferredLanguage,
            language: session.account.preferredLanguage,
            accountFamilyRole: session.account.familyRole,
            currentFamilyId: session.family.id,
            currentFamilyName: session.family.name,
          };
        }),
      setAuthState: (state) =>
        set(() => {
          applyLanguageToDocument(state.account.preferredLanguage);
          return {
            accountId: state.account.id,
            accountLogin: state.account.login,
            accountEmail: state.account.email,
            accountDisplayName: state.account.displayName,
            accountPreferredLanguage: state.account.preferredLanguage,
            language: state.account.preferredLanguage,
            accountFamilyRole: state.account.familyRole,
            currentFamilyId: state.family.id,
            currentFamilyName: state.family.name,
          };
        }),
      setAccountPreferredLanguage: (language) =>
        set(() => {
          applyLanguageToDocument(language);
          return {
            accountPreferredLanguage: language,
            language,
          };
        }),
      clearSession: () =>
        set({
          authToken: null,
          refreshToken: null,
          accountId: null,
          accountLogin: null,
          accountEmail: null,
          accountDisplayName: null,
          accountPreferredLanguage: null,
          accountFamilyRole: null,
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
      name: "pillpath-app",
      partialize: (s) => ({
        theme: s.theme,
        language: s.language,
        medicationIntervalUnit: s.medicationIntervalUnit,
        role: s.role,
        hasSeenWorkspaceIntro: s.hasSeenWorkspaceIntro,
        authToken: s.authToken,
        refreshToken: s.refreshToken,
        accountId: s.accountId,
        accountLogin: s.accountLogin,
        accountEmail: s.accountEmail,
        accountDisplayName: s.accountDisplayName,
        accountPreferredLanguage: s.accountPreferredLanguage,
        accountFamilyRole: s.accountFamilyRole,
        currentFamilyId: s.currentFamilyId,
        currentFamilyName: s.currentFamilyName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
        if (state?.language) {
          applyLanguageToDocument(state.language);
        }
        state?.setHydrated(true);
      },
    }
  )
);
