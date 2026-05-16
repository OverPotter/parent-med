import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect } from "react";
import {
  logoutMobileSession,
  refreshMobileSession,
  toBackendPreferredLanguage,
  updateMyFamilyMemberProfile,
  updateMyFamilyName,
  type MobileAuthSession,
} from "../features/auth/api/authApi";
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession,
} from "../features/auth/session/mobileAuthSessionStorage";
import { applyPreferredLanguageToSession } from "../features/settings/api/settingsApi";
import { updatePreferredLanguage } from "../features/settings/api/settingsApi";
import {
  type MobileLocale,
} from "../shared/i18n/mobileI18n";
import { deleteStoredNativePushSubscription } from "../shared/push/nativePushSync";

export function useShellAuthSessionController({
  authSession,
  setAuthSession,
  setIsAuthBootstrapping,
  setLocale,
}: {
  authSession: MobileAuthSession | null;
  setAuthSession: Dispatch<SetStateAction<MobileAuthSession | null>>;
  setIsAuthBootstrapping: Dispatch<SetStateAction<boolean>>;
  setLocale: (locale: MobileLocale) => void | Promise<void>;
}) {
  const applyAuthenticatedSession = useCallback(
    async (
      session: MobileAuthSession,
      preferredLanguageOverride?: MobileLocale,
    ) => {
      const nextSession = preferredLanguageOverride
        ? applyPreferredLanguageToSession(session, preferredLanguageOverride)
        : session;

      setAuthSession(nextSession);
      setLocale(nextSession.account.preferredLanguage);
      await writeStoredAuthSession(nextSession);
    },
    [setAuthSession, setLocale],
  );

  const handleAuthenticated = useCallback(
    async (session: MobileAuthSession) => {
      await applyAuthenticatedSession(session);
    },
    [applyAuthenticatedSession],
  );

  const handleLogout = useCallback(async () => {
    if (authSession) {
      try {
        await deleteStoredNativePushSubscription({
          accessToken: authSession.accessToken,
        });
      } catch {
        // Local logout still continues if push cleanup fails.
      }

      try {
        await logoutMobileSession({
          accessToken: authSession.accessToken,
          refreshToken: authSession.refreshToken,
        });
      } catch {
        // Local clear is authoritative for the mobile client.
      }
    }

    await clearStoredAuthSession();
    setAuthSession(null);
  }, [authSession, setAuthSession]);

  const handleSessionDeleted = useCallback(async () => {
    if (authSession) {
      try {
        await deleteStoredNativePushSubscription({
          accessToken: authSession.accessToken,
        });
      } catch {
        // Local account cleanup still continues if push cleanup fails.
      }
    }

    await clearStoredAuthSession();
    setAuthSession(null);
  }, [authSession, setAuthSession]);

  const handleUpdateAuthSession = useCallback(
    async (patch: {
      familyName?: string;
      displayName?: string;
      relationshipLabel?: string | null;
      phone?: string | null;
    }) => {
      if (!authSession) {
        return;
      }

      const trimmedFamilyName = patch.familyName?.trim();
      const trimmedDisplayName = patch.displayName?.trim();
      const nextRelationshipLabel =
        patch.relationshipLabel === undefined
          ? undefined
          : (patch.relationshipLabel || "").trim() || null;
      const nextPhone =
        patch.phone === undefined
          ? undefined
          : (patch.phone || "").trim() || null;

      let nextSession: MobileAuthSession = authSession;
      const isFamilyOwner =
        authSession.family.ownerAccountId != null &&
        authSession.family.ownerAccountId === authSession.account.id;

      if (
        isFamilyOwner &&
        trimmedFamilyName &&
        trimmedFamilyName !== authSession.family.name
      ) {
        const updatedFamily = await updateMyFamilyName({
          accessToken: authSession.accessToken,
          name: trimmedFamilyName,
        });

        nextSession = {
          ...nextSession,
          family: {
            ...nextSession.family,
            name: updatedFamily.name,
          },
        };
      }

      if (
        trimmedDisplayName !== undefined ||
        nextRelationshipLabel !== undefined ||
        nextPhone !== undefined
      ) {
        const updatedProfile = await updateMyFamilyMemberProfile({
          accessToken: authSession.accessToken,
          memberAccountId: authSession.account.id,
          displayName: trimmedDisplayName ?? authSession.account.displayName,
          relationshipLabel:
            nextRelationshipLabel ?? authSession.account.relationshipLabel,
          phone: nextPhone ?? authSession.account.phone,
        });

        nextSession = {
          ...nextSession,
          account: {
            ...nextSession.account,
            displayName: updatedProfile.displayName,
            needsProfileCompletion: !updatedProfile.displayName.trim(),
            relationshipLabel: updatedProfile.relationshipLabel,
            phone: updatedProfile.phone,
          },
        };
      }

      setAuthSession(nextSession);
      await writeStoredAuthSession(nextSession);
    },
    [authSession, setAuthSession],
  );

  const handleMarkRecoveryCodeConfigured = useCallback(async () => {
    if (!authSession) {
      return;
    }

    const nextSession: MobileAuthSession = {
      ...authSession,
      account: {
        ...authSession.account,
        hasRecoveryCode: true,
      },
    };

    setAuthSession(nextSession);
    await writeStoredAuthSession(nextSession);
  }, [authSession, setAuthSession]);

  const handleUpdatePreferredLanguage = useCallback(
    async (preferredLanguage: MobileLocale) => {
      if (!authSession) {
        return;
      }

      const nextSession = applyPreferredLanguageToSession(
        authSession,
        preferredLanguage,
      );

      setLocale(preferredLanguage);
      setAuthSession(nextSession);
      await writeStoredAuthSession(nextSession);

      try {
        await updatePreferredLanguage({
          accessToken: authSession.accessToken,
          preferredLanguage: toBackendPreferredLanguage(preferredLanguage),
        });
      } catch {
        // App locale stays user-controlled even if the backend language endpoint lags behind.
      }
    },
    [authSession, setAuthSession, setLocale],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuthSession() {
      try {
        const storedSession = await readStoredAuthSession();

        if (!storedSession?.refreshToken) {
          if (!cancelled) {
            setAuthSession(null);
          }
          return;
        }

        const refreshedSession = await refreshMobileSession(
          storedSession.refreshToken,
        );

        if (cancelled) {
          return;
        }

        await applyAuthenticatedSession(
          refreshedSession,
          storedSession.account.preferredLanguage,
        );
      } catch {
        await clearStoredAuthSession();

        if (!cancelled) {
          setAuthSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthBootstrapping(false);
        }
      }
    }

    void bootstrapAuthSession();

    return () => {
      cancelled = true;
    };
  }, [applyAuthenticatedSession, setAuthSession, setIsAuthBootstrapping]);

  return {
    handleAuthenticated,
    handleLogout,
    handleMarkRecoveryCodeConfigured,
    handleSessionDeleted,
    handleUpdateAuthSession,
    handleUpdatePreferredLanguage,
  };
}
