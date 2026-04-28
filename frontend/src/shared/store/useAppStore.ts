/** Zustand: тема, auth, семья. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyLanguageToDocument, detectPreferredLanguage, type AppLanguage } from "@shared/i18n";
import type { FamilyAccessPolicy } from "@shared/types/api";
import {
  clearSecureAuthTokens,
  isNativeIOSRuntime,
  migrateLegacyAuthTokensToSecureStorage,
  readSecureAuthTokens,
  writeSecureAuthTokens,
} from "@shared/security/authTokenStorage";
import { buildClientSessionTokens, isCookieSessionMarker } from "@shared/security/authSession";
import { appLog } from "@shared/utils/appLog";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type Role = "client" | "admin";
export type MedicationIntervalUnit = "hours" | "minutes";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const raw = window.localStorage.getItem("pillpath-app");
    if (!raw) {
      return "system";
    }
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown } };
    const storedTheme = parsed.state?.theme;
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme;
    }
  } catch {
    return "system";
  }

  return "system";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (typeof window === "undefined") {
    return theme === "dark" ? "dark" : "light";
  }
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

const initialTheme = readInitialTheme();
const initialLanguage = detectPreferredLanguage();

function emptyAuthState() {
  return {
    authToken: null,
    refreshToken: null,
    accountId: null,
    accountEmail: null,
    accountDisplayName: null,
    accountNeedsProfileCompletion: false,
    accountHasRecoveryCode: false,
    accountPreferredLanguage: null,
    accountFamilyRole: null,
    accountAccessPolicy: null,
    currentFamilyId: null,
    currentFamilyName: null,
  };
}

function applyThemeToDocument(theme: Theme): ResolvedTheme {
  const resolvedTheme = resolveTheme(theme);
  const background = resolvedTheme === "dark" ? "#1e1b2e" : "#ebe4ff";
  const statusBarStyle = resolvedTheme === "dark" ? "black-translucent" : "default";

  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.setAttribute("data-theme-mode", theme);
  document.documentElement.style.colorScheme = resolvedTheme;
  document.documentElement.style.background = background;
  document.body.style.colorScheme = resolvedTheme;
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
  accountEmail: string | null;
  accountDisplayName: string | null;
  accountNeedsProfileCompletion: boolean;
  accountHasRecoveryCode: boolean;
  accountPreferredLanguage: AppLanguage | null;
  accountFamilyRole: string | null;
  accountAccessPolicy: FamilyAccessPolicy | null;
  /** ID выбранной семьи для контекста (MVP: один пользователь — одна семья). */
  currentFamilyId: string | null;
  currentFamilyName: string | null;
  setSession: (session: {
    accessToken: string | null;
    refreshToken: string | null;
    account: {
      id: string;
      email: string | null;
      displayName: string;
      needsProfileCompletion: boolean;
      hasRecoveryCode: boolean;
      preferredLanguage: AppLanguage;
      familyRole: string;
      accessPolicy: FamilyAccessPolicy;
    };
    family: { id: string; name: string };
  }) => void;
  setAuthTokens: (tokens: { accessToken: string | null; refreshToken: string | null }) => void;
  setAuthState: (state: {
    account: {
      id: string;
      email: string | null;
      displayName: string;
      needsProfileCompletion: boolean;
      hasRecoveryCode: boolean;
      preferredLanguage: AppLanguage;
      familyRole: string;
      accessPolicy: FamilyAccessPolicy;
    };
    family: { id: string; name: string };
  }) => void;
  setAccountPreferredLanguage: (language: AppLanguage) => void;
  setAccountEmail: (email: string | null) => void;
  setAccountFamilyContext: (family: {
    familyRole?: string | null;
    accessPolicy?: FamilyAccessPolicy | null;
  }) => void;
  setAccountProfile: (profile: {
    displayName?: string | null;
    email?: string | null;
    hasRecoveryCode?: boolean;
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
      theme: initialTheme,
      effectiveTheme: resolveTheme(initialTheme),
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
      language: initialLanguage,
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
      accountEmail: null,
      accountDisplayName: null,
      accountNeedsProfileCompletion: false,
      accountHasRecoveryCode: false,
      accountPreferredLanguage: null,
      accountFamilyRole: null,
      accountAccessPolicy: null,
      currentFamilyId: null,
      currentFamilyName: null,
      setSession: (session) => {
        const clientTokens = buildClientSessionTokens({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
        set(() => {
          applyLanguageToDocument(session.account.preferredLanguage);
          return {
            authToken: clientTokens.accessToken,
            refreshToken: clientTokens.refreshToken,
            accountId: session.account.id,
            accountEmail: session.account.email,
            accountDisplayName: session.account.displayName,
            accountNeedsProfileCompletion: session.account.needsProfileCompletion,
            accountHasRecoveryCode: session.account.hasRecoveryCode,
            accountPreferredLanguage: session.account.preferredLanguage,
            language: session.account.preferredLanguage,
            accountFamilyRole: session.account.familyRole,
            accountAccessPolicy: session.account.accessPolicy,
            currentFamilyId: session.family.id,
            currentFamilyName: session.family.name,
          };
        });
        if (isNativeIOSRuntime()) {
          void writeSecureAuthTokens({
            accessToken: clientTokens.accessToken,
            refreshToken: clientTokens.refreshToken,
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
            accountEmail: state.account.email,
            accountDisplayName: state.account.displayName,
            accountNeedsProfileCompletion: state.account.needsProfileCompletion,
            accountHasRecoveryCode: state.account.hasRecoveryCode,
            accountPreferredLanguage: state.account.preferredLanguage,
            language: state.account.preferredLanguage,
            accountFamilyRole: state.account.familyRole,
            accountAccessPolicy: state.account.accessPolicy,
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
      setAccountFamilyContext: (family) =>
        set((state) => ({
          accountFamilyRole:
            family.familyRole !== undefined ? family.familyRole : state.accountFamilyRole,
          accountAccessPolicy:
            family.accessPolicy !== undefined ? family.accessPolicy : state.accountAccessPolicy,
        })),
      setAccountProfile: (profile) =>
        set((state) => ({
          accountDisplayName:
            profile.displayName !== undefined ? profile.displayName : state.accountDisplayName,
          accountNeedsProfileCompletion:
            profile.displayName !== undefined
              ? !profile.displayName?.trim()
              : state.accountNeedsProfileCompletion,
          accountHasRecoveryCode:
            profile.hasRecoveryCode !== undefined
              ? profile.hasRecoveryCode
              : state.accountHasRecoveryCode,
          accountEmail: profile.email !== undefined ? profile.email : state.accountEmail,
        })),
      clearSession: () => {
        set(emptyAuthState());
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
        accountEmail: s.accountEmail,
        accountDisplayName: s.accountDisplayName,
        accountNeedsProfileCompletion: s.accountNeedsProfileCompletion,
        accountHasRecoveryCode: s.accountHasRecoveryCode,
        accountPreferredLanguage: s.accountPreferredLanguage,
        accountFamilyRole: s.accountFamilyRole,
        accountAccessPolicy: s.accountAccessPolicy,
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
          useAppStore.setState({ hydrated: true });
          return;
        }

        if (!isNativeIOSRuntime()) {
          const hasPersistedCookieSession =
            isCookieSessionMarker(state.authToken) || isCookieSessionMarker(state.refreshToken);
          if (hasPersistedCookieSession) {
            useAppStore.setState({
              authToken: buildClientSessionTokens({}).accessToken,
              refreshToken: buildClientSessionTokens({}).refreshToken,
            });
          } else {
            useAppStore.setState(emptyAuthState());
          }
          state.setHydrated(true);
          return;
        }

        void (async () => {
          try {
            await migrateLegacyAuthTokensToSecureStorage();
            const tokens = await readSecureAuthTokens();
            if (!tokens.accessToken && !tokens.refreshToken) {
              useAppStore.setState(emptyAuthState());
            } else {
              useAppStore.setState({
                authToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              });
            }
          } catch (error) {
            appLog.error("iOS auth bootstrap failed", error);
            useAppStore.setState(emptyAuthState());
          } finally {
            state.setHydrated(true);
          }
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
