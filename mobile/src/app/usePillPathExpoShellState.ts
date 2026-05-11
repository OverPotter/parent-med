import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { type AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import {
  createMobileChild,
  fetchMobileChildren,
} from "../features/children/api/childrenApi";
import { createMobileHeightEntry } from "../features/growth/api/heightEntriesApi";
import {
  buildChildrenCardsFromApi,
  buildChildrenScreenContent,
} from "../features/children/model/childrenRedesign";
import {
  createMobileIllnessObservation,
  type IllnessQuickActionKind,
  type MobileIllnessObservation,
} from "../features/illness/model/illnessObservation";
import { type JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import {
  applyPreferredLanguageToSession,
  updatePreferredLanguage,
} from "../features/settings/api/settingsApi";
import { createMobileWeightEntry } from "../features/weight/api/weightEntriesApi";
import { useMobileI18n, type MobileLocale } from "../shared/i18n/mobileI18n";
import { type MobileBottomTabKey } from "../shared/components/MobileBottomTabBar";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import {
  resolveJournalTargetScreen,
  resolveStoredSessionPreferredLocale,
  type ChildProfileDestination,
  type PillPathActiveScreen,
} from "./pillPathExpoShellModel";

type RootTabContentProps = ComponentProps<typeof RootTabContent>;
type OverlayScreensProps = ComponentProps<typeof OverlayScreens>;

function useChildFlowController({
  activeIllnessObservationsByChildId,
  selectedChildId,
  setActiveScreen,
  setSelectedChildId,
  setSelectedEpisode,
  setSelectedJournalKind,
  setActiveFeedingStartedAtByCardId,
}: {
  activeIllnessObservationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  selectedChildId: string;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
  setSelectedChildId: Dispatch<SetStateAction<string>>;
  setSelectedEpisode: Dispatch<SetStateAction<AnalyticsEpisodeCard | null>>;
  setSelectedJournalKind: Dispatch<SetStateAction<JournalEntryKind>>;
  setActiveFeedingStartedAtByCardId: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
}) {
  const handleOpenChildProfile = useCallback((cardId: string) => {
    setSelectedChildId(cardId);
    setActiveScreen("childProfile");
  }, [setActiveScreen, setSelectedChildId]);

  const handleOpenRootJournalEntry = useCallback(
    (cardId: string, kind: JournalEntryKind) => {
      setSelectedChildId(cardId);
      setSelectedJournalKind(kind);
      setActiveScreen("journalEntry");
    },
    [setActiveScreen, setSelectedChildId, setSelectedJournalKind],
  );

  const handleOpenObservation = useCallback(
    (cardId: string) => {
      setSelectedChildId(cardId);
      setActiveScreen(
        activeIllnessObservationsByChildId[cardId]
          ? "illnessJournal"
          : "illnessOnboarding",
      );
    },
    [activeIllnessObservationsByChildId, setActiveScreen, setSelectedChildId],
  );

  const handleCloseChildProfile = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

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
  }, [setActiveFeedingStartedAtByCardId]);

  const handleStartFeedingTimer = useCallback(() => {
    setActiveFeedingStartedAtByCardId((current) => ({
      ...current,
      [selectedChildId]: new Date().toISOString(),
    }));
  }, [selectedChildId, setActiveFeedingStartedAtByCardId]);

  const handleOpenEditProfile = useCallback(() => {
    setActiveScreen("childProfileEdit");
  }, [setActiveScreen]);

  const handleCloseEditProfile = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  const handleOpenAnalytics = useCallback(() => {
    setActiveScreen("analytics");
  }, [setActiveScreen]);

  const handleCloseAnalytics = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  const handleOpenAnalyticsEpisode = useCallback((episode: AnalyticsEpisodeCard) => {
    setSelectedEpisode(episode);
    setActiveScreen("analyticsBreakdown");
  }, [setActiveScreen, setSelectedEpisode]);

  const handleCloseAnalyticsEpisode = useCallback(() => {
    setActiveScreen("analytics");
  }, [setActiveScreen]);

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
  }, [setActiveScreen, setSelectedJournalKind]);

  const handleCloseJournalEntry = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleCloseFeedingHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  const handleCloseSleepHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  const handleCloseWeightHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  const handleCloseGrowthHistory = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  const handleCloseOverview = useCallback(() => {
    setActiveScreen("childProfile");
  }, [setActiveScreen]);

  return {
    handleCloseAnalytics,
    handleCloseAnalyticsEpisode,
    handleCloseChildProfile,
    handleCloseEditProfile,
    handleCloseFeedingHistory,
    handleCloseGrowthHistory,
    handleCloseJournalEntry,
    handleCloseOverview,
    handleCloseSleepHistory,
    handleCloseWeightHistory,
    handleFeedingPress,
    handleOpenAnalytics,
    handleOpenAnalyticsEpisode,
    handleOpenChildProfile,
    handleOpenEditProfile,
    handleOpenJournalEntry,
    handleOpenObservation,
    handleOpenRootJournalEntry,
    handleStartFeedingTimer,
  };
}

function useIllnessFlowController({
  locale,
  selectedChildId,
  setActiveScreen,
  setActiveRootTab,
  setSelectedChildId,
  setSelectedIllnessActionKind,
  setActiveIllnessObservationsByChildId,
}: {
  locale: MobileLocale;
  selectedChildId: string;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>;
  setSelectedChildId: Dispatch<SetStateAction<string>>;
  setSelectedIllnessActionKind: Dispatch<SetStateAction<IllnessQuickActionKind>>;
  setActiveIllnessObservationsByChildId: Dispatch<
    SetStateAction<Record<string, MobileIllnessObservation | undefined>>
  >;
}) {
  const handleCloseIllnessOnboarding = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleCloseIllnessJournal = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleCloseIllnessActionPlaceholder = useCallback(() => {
    setActiveScreen("illnessJournal");
  }, [setActiveScreen]);

  const handleStartIllnessObservation = useCallback(
    ({ startedAt, reason }: { startedAt: string; reason: string }) => {
      setActiveIllnessObservationsByChildId((current) => ({
        ...current,
        [selectedChildId]: createMobileIllnessObservation({
          childId: selectedChildId,
          startedAt,
          reason,
          locale,
        }),
      }));
      setActiveScreen("illnessJournal");
    },
    [locale, selectedChildId, setActiveIllnessObservationsByChildId, setActiveScreen],
  );

  const handleAddIllnessEntry = useCallback(
    (childId: string, kind: IllnessQuickActionKind) => {
      setSelectedChildId(childId);
      setSelectedIllnessActionKind(kind);
      setActiveScreen("illnessActionPlaceholder");
    },
    [setActiveScreen, setSelectedChildId, setSelectedIllnessActionKind],
  );

  const handleFinishIllnessObservation = useCallback((childId: string) => {
    setActiveIllnessObservationsByChildId((current) => ({
      ...current,
      [childId]: undefined,
    }));
  }, [setActiveIllnessObservationsByChildId]);

  const handleSelectTab = useCallback((key: MobileBottomTabKey) => {
    if (key === "journal") {
      return;
    }

    setActiveRootTab(key);
    setActiveScreen("children");
  }, [setActiveRootTab, setActiveScreen]);

  return {
    handleAddIllnessEntry,
    handleCloseIllnessActionPlaceholder,
    handleCloseIllnessJournal,
    handleCloseIllnessOnboarding,
    handleFinishIllnessObservation,
    handleSelectTab,
    handleStartIllnessObservation,
  };
}

function useUtilityNavigationController({
  setActiveScreen,
}: {
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
}) {
  const handleOpenPrivacyPolicy = useCallback(() => {
    setActiveScreen("privacyPolicy");
  }, [setActiveScreen]);

  const handleOpenSupport = useCallback(() => {
    setActiveScreen("support");
  }, [setActiveScreen]);

  const handleOpenSettings = useCallback(() => {
    setActiveScreen("settings");
  }, [setActiveScreen]);

  const handleCloseSettings = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleCloseSupport = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleClosePrivacyPolicy = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleOpenTermsOfUse = useCallback(() => {
    setActiveScreen("termsOfUse");
  }, [setActiveScreen]);

  const handleCloseTermsOfUse = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  return {
    handleClosePrivacyPolicy,
    handleCloseSettings,
    handleCloseSupport,
    handleCloseTermsOfUse,
    handleOpenPrivacyPolicy,
    handleOpenSettings,
    handleOpenSupport,
    handleOpenTermsOfUse,
  };
}

function useAuthSessionController({
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
    async (session: MobileAuthSession) => {
      setAuthSession(session);
      setLocale(session.account.preferredLanguage);
      await writeStoredAuthSession(session);
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
    await clearStoredAuthSession();
    setAuthSession(null);
  }, [setAuthSession]);

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
  }, [applyAuthenticatedSession, setAuthSession, setIsAuthBootstrapping]);

  return {
    handleAuthenticated,
    handleLogout,
    handleSessionDeleted,
    handleUpdateAuthSession,
    handleUpdatePreferredLanguage,
  };
}

export function usePillPathExpoShellState() {
  const { locale, setLocale } = useMobileI18n();
  const childrenScreenContent = useMemo(
    () => buildChildrenScreenContent(locale),
    [locale],
  );
  const fallbackChildrenCards = childrenScreenContent.cards;
  const [authSession, setAuthSession] = useState<MobileAuthSession | null>(
    null,
  );
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const [activeRootTab, setActiveRootTab] =
    useState<MobileBottomTabKey>("children");
  const [activeScreen, setActiveScreen] =
    useState<PillPathActiveScreen>("children");
  const [selectedChildId, setSelectedChildId] = useState(
    childrenScreenContent.cards[0]?.nodeId ?? "",
  );
  const [selectedEpisode, setSelectedEpisode] =
    useState<AnalyticsEpisodeCard | null>(null);
  const [selectedJournalKind, setSelectedJournalKind] =
    useState<JournalEntryKind>("feeding");
  const [selectedIllnessActionKind, setSelectedIllnessActionKind] =
    useState<IllnessQuickActionKind>("temperature");
  const [childrenCards, setChildrenCards] = useState(fallbackChildrenCards);
  const [activeFeedingStartedAtByCardId, setActiveFeedingStartedAtByCardId] =
    useState<Record<string, string | null>>({});
  const [
    activeIllnessObservationsByChildId,
    setActiveIllnessObservationsByChildId,
  ] = useState<Record<string, MobileIllnessObservation | undefined>>({});

  const loadChildren = useCallback(
    async (session: MobileAuthSession, options?: { ignoreErrors?: boolean }) => {
      try {
        const nextChildren = await fetchMobileChildren(session);

        if (nextChildren.length === 0) {
          setChildrenCards([]);
          return [];
        }

        setChildrenCards(buildChildrenCardsFromApi(nextChildren, locale));
        return nextChildren;
      } catch (error) {
        if (!options?.ignoreErrors) {
          setChildrenCards([]);
          throw error;
        }
        return null;
      }
    },
    [locale],
  );

  useEffect(() => {
    if (!authSession?.account.familyId) {
      setChildrenCards(fallbackChildrenCards);
      return;
    }

    let cancelled = false;

    async function syncChildren() {
      try {
        const nextChildren = await fetchMobileChildren(authSession);

        if (cancelled) {
          return;
        }

        if (nextChildren.length === 0) {
          setChildrenCards([]);
          return;
        }

        setChildrenCards(buildChildrenCardsFromApi(nextChildren, locale));
      } catch {
        if (!cancelled) {
          setChildrenCards([]);
        }
      }
    }

    void syncChildren();

    return () => {
      cancelled = true;
    };
  }, [authSession, fallbackChildrenCards, locale]);

  useEffect(() => {
    if (childrenCards.length === 0) {
      setSelectedChildId("");
      return;
    }

    setSelectedChildId((current) =>
      childrenCards.some((card) => card.nodeId === current)
        ? current
        : childrenCards[0]?.nodeId ?? "",
    );
  }, [childrenCards]);

  const rootTabItems = useMemo(
    () => buildChildrenScreenContent(locale, activeRootTab).tabs,
    [activeRootTab, locale],
  );
  const {
    handleAuthenticated,
    handleLogout,
    handleSessionDeleted,
    handleUpdateAuthSession,
    handleUpdatePreferredLanguage,
  } = useAuthSessionController({
    authSession,
    setAuthSession,
    setIsAuthBootstrapping,
    setLocale,
  });
  const {
    handleCloseAnalytics,
    handleCloseAnalyticsEpisode,
    handleCloseChildProfile,
    handleCloseEditProfile,
    handleCloseFeedingHistory,
    handleCloseGrowthHistory,
    handleCloseJournalEntry,
    handleCloseOverview,
    handleCloseSleepHistory,
    handleCloseWeightHistory,
    handleFeedingPress,
    handleOpenAnalytics,
    handleOpenAnalyticsEpisode,
    handleOpenChildProfile,
    handleOpenEditProfile,
    handleOpenJournalEntry,
    handleOpenObservation,
    handleOpenRootJournalEntry,
    handleStartFeedingTimer,
  } = useChildFlowController({
    activeIllnessObservationsByChildId,
    selectedChildId,
    setActiveScreen,
    setSelectedChildId,
    setSelectedEpisode,
    setSelectedJournalKind,
    setActiveFeedingStartedAtByCardId,
  });
  const {
    handleAddIllnessEntry,
    handleCloseIllnessActionPlaceholder,
    handleCloseIllnessJournal,
    handleCloseIllnessOnboarding,
    handleFinishIllnessObservation,
    handleSelectTab,
    handleStartIllnessObservation,
  } = useIllnessFlowController({
    locale,
    selectedChildId,
    setActiveScreen,
    setActiveRootTab,
    setSelectedChildId,
    setSelectedIllnessActionKind,
    setActiveIllnessObservationsByChildId,
  });
  const {
    handleClosePrivacyPolicy,
    handleCloseSettings,
    handleCloseSupport,
    handleCloseTermsOfUse,
    handleOpenPrivacyPolicy,
    handleOpenSettings,
    handleOpenSupport,
    handleOpenTermsOfUse,
  } = useUtilityNavigationController({
    setActiveScreen,
  });

  const handleSelectRootTab = useCallback((key: MobileBottomTabKey) => {
    setActiveRootTab(key);
  }, []);

  const handleOpenChildCreate = useCallback(() => {
    setActiveScreen("childCreate");
  }, []);

  const handleCloseChildCreate = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleSubmitChildCreate = useCallback(
    async (payload: {
      name: string;
      birthDate: string | null;
      avatarKey: string | null;
      gender: string | null;
      babyModeEnabled: boolean;
      weightKg: number | null;
      heightCm: number | null;
      allergies: string | null;
      notes: string | null;
    }) => {
      if (!authSession) {
        return;
      }

      const created = await createMobileChild(authSession, {
        name: payload.name,
        birthDate: payload.birthDate,
        avatarKey: payload.avatarKey,
        gender: payload.gender,
        babyModeEnabled: payload.babyModeEnabled,
        allergies: payload.allergies,
        notes: payload.notes,
      });

      if (payload.weightKg && payload.weightKg > 0) {
        await createMobileWeightEntry(authSession, {
          childId: created.id,
          valueKg: payload.weightKg,
        });
      }

      if (payload.heightCm && payload.heightCm > 0) {
        await createMobileHeightEntry(authSession, {
          childId: created.id,
          valueCm: payload.heightCm,
        });
      }

      const nextChildren = await loadChildren(authSession, { ignoreErrors: true });
      setSelectedChildId(created.id);

      if (!nextChildren || nextChildren.length === 0) {
        setChildrenCards(buildChildrenCardsFromApi([created], locale));
      }

      setActiveScreen("children");
    },
    [authSession, loadChildren, locale],
  );

  const rootTabContentProps: RootTabContentProps = {
    locale,
    activeRootTab,
    authSession,
    childrenCards,
    activeFeedingStartedAtByCardId,
    activeObservationByCardId: Object.fromEntries(
      Object.entries(activeIllnessObservationsByChildId).map(([key, value]) => [key, Boolean(value)]),
    ),
    onOpenChildProfile: handleOpenChildProfile,
    onOpenChildCreate: handleOpenChildCreate,
    onOpenRootJournalEntry: handleOpenRootJournalEntry,
    onOpenObservation: handleOpenObservation,
    onFeedingPress: handleFeedingPress,
    onLogout: handleLogout,
    onOpenSettings: handleOpenSettings,
    onOpenSupport: handleOpenSupport,
    onOpenTermsOfUse: handleOpenTermsOfUse,
    onOpenPrivacyPolicy: handleOpenPrivacyPolicy,
    onUpdateAuthSession: handleUpdateAuthSession,
    screenLayerStyle: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };

  const overlayScreensProps: OverlayScreensProps | null = authSession
    ? {
        locale,
        activeScreen,
        childrenCards,
        selectedChildId,
        selectedEpisode,
        selectedJournalKind,
        selectedIllnessActionKind,
        observationsByChildId: activeIllnessObservationsByChildId,
        authSession,
        childFlow: {
          onOpenChildCreate: handleOpenChildCreate,
          onBackChildCreate: handleCloseChildCreate,
          onSubmitChildCreate: handleSubmitChildCreate,
          onBackChildProfile: handleCloseChildProfile,
          onEditProfile: handleOpenEditProfile,
          onOpenAnalytics: handleOpenAnalytics,
          onOpenJournalEntry: handleOpenJournalEntry,
          onBackEditProfile: handleCloseEditProfile,
          onBackAnalytics: handleCloseAnalytics,
          onOpenEpisode: handleOpenAnalyticsEpisode,
          onBackAnalyticsEpisode: handleCloseAnalyticsEpisode,
          onBackJournalEntry: handleCloseJournalEntry,
          onStartFeedingTimer: handleStartFeedingTimer,
          onBackFeedingHistory: handleCloseFeedingHistory,
          onBackSleepHistory: handleCloseSleepHistory,
          onBackWeightHistory: handleCloseWeightHistory,
          onBackGrowthHistory: handleCloseGrowthHistory,
          onBackOverview: handleCloseOverview,
        },
        illnessFlow: {
          onStartIllnessObservation: handleStartIllnessObservation,
          onAddIllnessEntry: handleAddIllnessEntry,
          selectedIllnessActionKind,
          onBackIllnessActionPlaceholder: handleCloseIllnessActionPlaceholder,
          onFinishIllnessObservation: handleFinishIllnessObservation,
          onBackIllnessJournal: handleCloseIllnessJournal,
          onBackIllnessOnboarding: handleCloseIllnessOnboarding,
          onSelectTab: handleSelectTab,
        },
        utilityFlow: {
          onSessionDeleted: handleSessionDeleted,
          onUpdatePreferredLanguage: handleUpdatePreferredLanguage,
          onBackPrivacyPolicy: handleClosePrivacyPolicy,
          onBackSupport: handleCloseSupport,
          onBackSettings: handleCloseSettings,
          onBackTermsOfUse: handleCloseTermsOfUse,
        },
      }
    : null;

  return {
    authSession,
    isAuthBootstrapping,
    rootTabItems,
    handleAuthenticated,
    handleSelectRootTab,
    rootTabContentProps,
    overlayScreensProps,
  };
}
