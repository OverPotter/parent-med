import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import {
  logoutMobileSession,
  refreshMobileSession,
  toBackendPreferredLanguage,
  updateMyFamilyMemberProfile,
  updateMyFamilyName,
  type MobileAuthSession,
} from "../features/auth/api/authApi";
import { AuthScreen } from "../features/auth/screens/AuthScreen";
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession,
} from "../features/auth/session/mobileAuthSessionStorage";
import { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import { buildChildrenScreenContent } from "../features/children/model/childrenRedesign";
import {
  applyPreferredLanguageToSession,
  updatePreferredLanguage,
} from "../features/settings/api/settingsApi";
import {
  MobileI18nProvider,
  useMobileI18n,
  type MobileLocale,
} from "../shared/i18n/mobileI18n";
import {
  MobileBottomTabBar,
  MobileBottomTabKey,
} from "../shared/components/MobileBottomTabBar";
import {
  MobileThemeProvider,
  useMobileSurfaceTheme,
} from "../shared/theme/mobileSurfaceTheme";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import {
  resolveJournalTargetScreen,
  resolveStoredSessionPreferredLocale,
  type ChildProfileDestination,
  type PillPathActiveScreen,
} from "./pillPathExpoShellModel";

export function PillPathExpoApp() {
  return (
    <MobileThemeProvider>
      <MobileI18nProvider>
        <PillPathExpoShell />
      </MobileI18nProvider>
    </MobileThemeProvider>
  );
}

function PillPathExpoShell() {
  const surfaceTheme = useMobileSurfaceTheme();
  const { locale, setLocale } = useMobileI18n();
  const childrenScreenContent = buildChildrenScreenContent(locale);
  const [authSession, setAuthSession] = useState<MobileAuthSession | null>(null);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const [activeRootTab, setActiveRootTab] = useState<MobileBottomTabKey>("children");
  const rootTabItems = buildChildrenScreenContent(locale, activeRootTab).tabs;
  const [activeScreen, setActiveScreen] = useState<PillPathActiveScreen>("children");
  const [selectedChildId, setSelectedChildId] = useState(
    childrenScreenContent.cards[0]?.nodeId ?? "",
  );
  const [selectedEpisode, setSelectedEpisode] =
    useState<AnalyticsEpisodeCard | null>(null);
  const [selectedJournalKind, setSelectedJournalKind] =
    useState<JournalEntryKind>("feeding");
  const [activeFeedingStartedAtByCardId, setActiveFeedingStartedAtByCardId] =
    useState<Record<string, string | null>>({});

  const handleOpenChildProfile = useCallback((cardId: string) => {
    setSelectedChildId(cardId);
    setActiveScreen("childProfile");
  }, []);

  const handleOpenRootJournalEntry = useCallback(
    (cardId: string, kind: JournalEntryKind) => {
      setSelectedChildId(cardId);
      setSelectedJournalKind(kind);
      setActiveScreen("journalEntry");
    },
    [],
  );

  const handleCloseChildProfile = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleFeedingPress = useCallback((cardId: string) => {
    setActiveFeedingStartedAtByCardId((current) => {
      const activeStartedAt = current[cardId];

      if (activeStartedAt) {
        return {
          ...current,
          [cardId]: null,
        };
      }

      return {
        ...current,
        [cardId]: new Date().toISOString(),
      };
    });
  }, []);

  const handleStartFeedingTimer = useCallback(() => {
    setActiveFeedingStartedAtByCardId((current) => ({
      ...current,
      [selectedChildId]: new Date().toISOString(),
    }));
  }, [selectedChildId]);

  const handleOpenEditProfile = useCallback(() => {
    setActiveScreen("childProfileEdit");
  }, []);

  const handleCloseEditProfile = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleOpenAnalytics = useCallback(() => {
    setActiveScreen("analytics");
  }, []);

  const handleCloseAnalytics = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleOpenAnalyticsEpisode = useCallback((episode: AnalyticsEpisodeCard) => {
    setSelectedEpisode(episode);
    setActiveScreen("analyticsBreakdown");
  }, []);

  const handleCloseAnalyticsEpisode = useCallback(() => {
    setActiveScreen("analytics");
  }, []);

  const handleOpenJournalEntry = useCallback((kind: ChildProfileDestination) => {
    if (
      kind === "feeding" ||
      kind === "sleep" ||
      kind === "weight" ||
      kind === "height"
    ) {
      setSelectedJournalKind(kind);
    }

    setActiveScreen(resolveJournalTargetScreen(kind));
  }, []);

  const handleCloseJournalEntry = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleCloseFeedingHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleCloseSleepHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleCloseWeightHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleCloseGrowthHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleCloseOverview = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleOpenPrivacyPolicy = useCallback(() => {
    setActiveScreen("privacyPolicy");
  }, []);

  const handleOpenSupport = useCallback(() => {
    setActiveScreen("support");
  }, []);

  const handleOpenSettings = useCallback(() => {
    setActiveScreen("settings");
  }, []);

  const handleCloseSettings = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleCloseSupport = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleClosePrivacyPolicy = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleOpenTermsOfUse = useCallback(() => {
    setActiveScreen("termsOfUse");
  }, []);

  const handleCloseTermsOfUse = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleSelectRootTab = useCallback((key: MobileBottomTabKey) => {
    setActiveRootTab(key);
  }, []);

  const applyAuthenticatedSession = useCallback(
    async (session: MobileAuthSession) => {
      setAuthSession(session);
      setLocale(session.account.preferredLanguage);
      await writeStoredAuthSession(session);
    },
    [setLocale],
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
  }, [authSession]);

  const handleSessionDeleted = useCallback(async () => {
    await clearStoredAuthSession();
    setAuthSession(null);
  }, []);

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
        patch.phone === undefined ? undefined : (patch.phone || "").trim() || null;

      let nextSession: MobileAuthSession = authSession;

      const isFamilyOwner =
        authSession.family.ownerAccountId != null &&
        authSession.family.ownerAccountId === authSession.account.id;

      if (isFamilyOwner && trimmedFamilyName && trimmedFamilyName !== authSession.family.name) {
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
            relationshipLabel: updatedProfile.relationshipLabel,
            phone: updatedProfile.phone,
          },
        };
      }

      setAuthSession(nextSession);
      await writeStoredAuthSession(nextSession);
    },
    [authSession],
  );

  const handleUpdatePreferredLanguage = useCallback(
    async (preferredLanguage: MobileLocale) => {
      if (!authSession) {
        return;
      }

      await updatePreferredLanguage({
        accessToken: authSession.accessToken,
        preferredLanguage: toBackendPreferredLanguage(preferredLanguage),
      });

      const nextSession = applyPreferredLanguageToSession(
        authSession,
        preferredLanguage,
      );

      setLocale(preferredLanguage);
      setAuthSession(nextSession);
      await writeStoredAuthSession(nextSession);
    },
    [authSession, setLocale],
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

        const refreshedSession = await refreshMobileSession(storedSession.refreshToken);
        const preferredLocale = resolveStoredSessionPreferredLocale(
          storedSession,
          refreshedSession,
        );

        if (cancelled) {
          return;
        }

        await applyAuthenticatedSession(
          applyPreferredLanguageToSession(refreshedSession, preferredLocale),
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
  }, [applyAuthenticatedSession]);

  if (isAuthBootstrapping) {
    return <View style={styles.root} />;
  }

  if (!authSession) {
    return (
      <View style={[styles.root, { backgroundColor: surfaceTheme.appBackgroundColor }]}>
        <StatusBar style={surfaceTheme.statusBarStyle} />
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: surfaceTheme.appBackgroundColor }]}>
      <StatusBar style={surfaceTheme.statusBarStyle} />
      <RootTabContent
        locale={locale}
        activeRootTab={activeRootTab}
        authSession={authSession}
        activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
        onOpenChildProfile={handleOpenChildProfile}
        onOpenRootJournalEntry={handleOpenRootJournalEntry}
        onFeedingPress={handleFeedingPress}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
        onOpenSupport={handleOpenSupport}
        onOpenTermsOfUse={handleOpenTermsOfUse}
        onOpenPrivacyPolicy={handleOpenPrivacyPolicy}
        onUpdateAuthSession={handleUpdateAuthSession}
        screenLayerStyle={styles.screenLayer}
      />
      <MobileBottomTabBar items={rootTabItems} onSelectTab={handleSelectRootTab} />
      <OverlayScreens
        locale={locale}
        activeScreen={activeScreen}
        selectedChildId={selectedChildId}
        selectedEpisode={selectedEpisode}
        selectedJournalKind={selectedJournalKind}
        authSession={authSession}
        onSessionDeleted={handleSessionDeleted}
        onUpdatePreferredLanguage={handleUpdatePreferredLanguage}
        onBackChildProfile={handleCloseChildProfile}
        onEditProfile={handleOpenEditProfile}
        onOpenAnalytics={handleOpenAnalytics}
        onOpenJournalEntry={handleOpenJournalEntry}
        onBackEditProfile={handleCloseEditProfile}
        onBackAnalytics={handleCloseAnalytics}
        onOpenEpisode={handleOpenAnalyticsEpisode}
        onBackAnalyticsEpisode={handleCloseAnalyticsEpisode}
        onBackJournalEntry={handleCloseJournalEntry}
        onStartFeedingTimer={handleStartFeedingTimer}
        onBackFeedingHistory={handleCloseFeedingHistory}
        onBackSleepHistory={handleCloseSleepHistory}
        onBackWeightHistory={handleCloseWeightHistory}
        onBackGrowthHistory={handleCloseGrowthHistory}
        onBackOverview={handleCloseOverview}
        onBackPrivacyPolicy={handleClosePrivacyPolicy}
        onBackSupport={handleCloseSupport}
        onBackSettings={handleCloseSettings}
        onBackTermsOfUse={handleCloseTermsOfUse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
