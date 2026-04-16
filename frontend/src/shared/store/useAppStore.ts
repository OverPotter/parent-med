/** Zustand: тема, auth, семья. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyLanguageToDocument, type AppLanguage } from "@shared/i18n";
import {
  clearSecureAuthTokens,
  isNativeIOSRuntime,
  migrateLegacyAuthTokensToSecureStorage,
  readSecureAuthTokens,
  writeSecureAuthTokens,
} from "@shared/security/authTokenStorage";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type Role = "client" | "admin";
export type MedicationIntervalUnit = "hours" | "minutes";

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyThemeToDocument(theme: Theme): ResolvedTheme {
  const resolvedTheme = resolveTheme(theme);
  const background = resolvedTheme === "dark" ? "#1e1b2e" : "#ebe4ff";
  const statusBarStyle = resolvedTheme === "dark" ? "black-translucent" : "default";

  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.setAttribute("data-theme-mode", theme);
  document.documentElement.style.colorScheme = resolvedTheme;
  document.documentElement.style.background = background;
  document.body.style.background = background;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
  document
    .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute("content", statusBarStyle);
  return resolvedTheme;
}

interface AppState {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  hasSeenWorkspaceIntro: boolean;
  markWorkspaceIntroSeen: () => void;
  theme: Theme;
  effectiveTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  syncSystemTheme: () => void;
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
  setAuthTokens: (tokens: { accessToken: string | null; refreshToken: string | null }) => void;
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
  setAccountEmail: (email: string | null) => void;
  setAccountProfile: (profile: { displayName?: string | null; email?: string | null }) => void;
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
      theme: "system",
      effectiveTheme: "light",
      setTheme: (theme) => {
        const effectiveTheme = applyThemeToDocument(theme);
        set({ theme, effectiveTheme });
      },
      toggleTheme: () => {
        set((s) => {
          const next: Theme = s.effectiveTheme === "light" ? "dark" : "light";
          const effectiveTheme = applyThemeToDocument(next);
          return { theme: next, effectiveTheme };
        });
      },
      syncSystemTheme: () => {
        set((s) => {
          if (s.theme !== "system") {
            return {};
          }
          const effectiveTheme = applyThemeToDocument("system");
          if (effectiveTheme === s.effectiveTheme) {
            return {};
          }
          return { effectiveTheme };
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
      setSession: (session) => {
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
        });
        if (isNativeIOSRuntime()) {
          void writeSecureAuthTokens({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
          });
        }
      },
      setAuthTokens: (tokens) => {
        set({
          authToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        if (!isNativeIOSRuntime()) {
          return;
        }
        if (!tokens.accessToken && !tokens.refreshToken) {
          void clearSecureAuthTokens();
          return;
        }
        void writeSecureAuthTokens(tokens);
      },
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
      setAccountEmail: (email) => set({ accountEmail: email }),
      setAccountProfile: (profile) =>
        set((state) => ({
          accountDisplayName:
            profile.displayName !== undefined ? profile.displayName : state.accountDisplayName,
          accountEmail: profile.email !== undefined ? profile.email : state.accountEmail,
        })),
      clearSession: () => {
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
        });
        if (isNativeIOSRuntime()) {
          void clearSecureAuthTokens();
        }
      },
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
        effectiveTheme: s.effectiveTheme,
        language: s.language,
        medicationIntervalUnit: s.medicationIntervalUnit,
        role: s.role,
        hasSeenWorkspaceIntro: s.hasSeenWorkspaceIntro,
        ...(isNativeIOSRuntime() ? {} : { authToken: s.authToken, refreshToken: s.refreshToken }),
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
          const effectiveTheme = applyThemeToDocument(state.theme);
          state.effectiveTheme = effectiveTheme;
        }
        if (state?.language) {
          applyLanguageToDocument(state.language);
        }

        if (!state) {
          return;
        }

        if (!isNativeIOSRuntime()) {
          state.setHydrated(true);
          return;
        }

        void (async () => {
          await migrateLegacyAuthTokensToSecureStorage();
          const tokens = await readSecureAuthTokens();
          state.setAuthTokens(tokens);
          state.setHydrated(true);
        })();
      },
    }
  )
);

if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const syncSystemTheme = () => {
    useAppStore.getState().syncSystemTheme();
  };
  mediaQuery.addEventListener("change", syncSystemTheme);
}
