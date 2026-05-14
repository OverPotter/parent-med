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
import { prefetchAnalyticsScreenData } from "../features/analytics/screens/useAnalyticsScreenState";
import {
  fetchMobileFamilyMembers,
  type MobileFamilyMember,
} from "../features/family/api/familyMembersApi";
import {
  createMobileChild,
  deleteMobileChild,
  fetchMobileChildrenSummary,
  type MobileChildSummary,
  updateMobileChild,
} from "../features/children/api/childrenApi";
import {
  startMobileFeedingRecord,
  stopMobileFeedingRecord,
  type MobileFeedingRecord,
} from "../features/feeding/api/feedingRecordsApi";
import { createMobileHeightEntry } from "../features/growth/api/heightEntriesApi";
import { type MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import {
  buildChildrenCardsFromApi,
  buildChildrenScreenContent,
} from "../features/children/model/childrenRedesign";
import {
  fetchMobileActiveIllnessEpisode,
} from "../features/illness/api/illnessAnalyticsApi";
import {
  type IllnessQuickActionKind,
  type MobileIllnessObservation,
} from "../features/illness/model/illnessObservation";
import {
  hasActiveIllnessObservation,
  hydrateObservationFromEpisode,
  resolveActiveIllnessChildId,
} from "../features/illness/model/illnessObservationState";
import { useIllnessFlowController } from "../features/illness/model/useIllnessFlowController";
import { type JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import {
  applyPreferredLanguageToSession,
  updatePreferredLanguage,
} from "../features/settings/api/settingsApi";
import {
  getCachedSettingsBundle,
  loadSettingsBundle,
} from "../features/settings/model/settingsScreenLogic";
import {
  startMobileSleepSession,
  stopMobileSleepSession,
  type MobileSleepSession,
} from "../features/sleep/api/sleepSessionsApi";
import { createMobileWeightEntry } from "../features/weight/api/weightEntriesApi";
import { useMobileI18n, type MobileLocale } from "../shared/i18n/mobileI18n";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import {
  isRootModuleScreen,
  resolveJournalTargetScreen,
  resolveStoredSessionPreferredLocale,
  type ChildProfileDestination,
  type PillPathActiveScreen,
} from "./pillPathExpoShellModel";

type RootTabContentProps = ComponentProps<typeof RootTabContent>;
type OverlayScreensProps = ComponentProps<typeof OverlayScreens>;

function openChildrenRoot(
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>,
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>,
) {
  setActiveRootTab("children");
  setActiveScreen("children");
}

function openIllnessJournalRoot({
  childId,
  setActiveRootTab,
  setActiveScreen,
  setSelectedChildId,
}: {
  childId?: string | null;
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
  setSelectedChildId?: Dispatch<SetStateAction<string>>;
}) {
  if (childId && setSelectedChildId) {
    setSelectedChildId(childId);
  }

  setActiveRootTab("journal");
  setActiveScreen("illnessJournal");
}

function useChildFlowController({
  activeIllnessObservationsByChildId,
  setActiveRootTab,
  setActiveScreen,
  setSelectedChildId,
  setSelectedEpisode,
  setSelectedJournalKind,
}: {
  activeIllnessObservationsByChildId: Record<
    string,
    MobileIllnessObservation | undefined
  >;
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
  setSelectedChildId: Dispatch<SetStateAction<string>>;
  setSelectedEpisode: Dispatch<SetStateAction<AnalyticsEpisodeCard | null>>;
  setSelectedJournalKind: Dispatch<SetStateAction<JournalEntryKind>>;
}) {
  const handleOpenChildProfile = useCallback(
    (cardId: string) => {
      setSelectedChildId(cardId);
      setActiveScreen("childProfile");
    },
    [setActiveScreen, setSelectedChildId],
  );

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
      if (activeIllnessObservationsByChildId[cardId]) {
        openIllnessJournalRoot({
          childId: cardId,
          setActiveRootTab,
          setActiveScreen,
        });
        return;
      }

      setActiveRootTab("children");
      setActiveScreen("illnessOnboarding");
    },
    [
      activeIllnessObservationsByChildId,
      setActiveRootTab,
      setActiveScreen,
      setSelectedChildId,
    ],
  );

  const handleCloseChildProfile = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

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

  const handleOpenAnalyticsEpisode = useCallback(
    (episode: AnalyticsEpisodeCard) => {
      setSelectedEpisode(episode);
      setActiveScreen("analyticsBreakdown");
    },
    [setActiveScreen, setSelectedEpisode],
  );

  const handleCloseAnalyticsEpisode = useCallback(() => {
    setActiveScreen("analytics");
  }, [setActiveScreen]);

  const handleOpenJournalEntry = useCallback(
    (kind: ChildProfileDestination) => {
      if (
        kind === "feeding" ||
        kind === "sleep" ||
        kind === "weight" ||
        kind === "height"
      ) {
        setSelectedJournalKind(kind);
      }

      setActiveScreen(resolveJournalTargetScreen(kind));
    },
    [setActiveScreen, setSelectedJournalKind],
  );

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
    handleOpenAnalytics,
    handleOpenAnalyticsEpisode,
    handleOpenChildProfile,
    handleOpenEditProfile,
    handleOpenJournalEntry,
    handleOpenObservation,
    handleOpenRootJournalEntry,
  };
}

function useUtilityNavigationController({
  setActiveRootTab,
  setActiveScreen,
}: {
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
}) {
  const handleOpenFamily = useCallback(() => {
    setActiveScreen("family");
  }, [setActiveScreen]);

  const handleCloseFamily = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleOpenChildrenFromFamily = useCallback(() => {
    openChildrenRoot(setActiveRootTab, setActiveScreen);
  }, [setActiveRootTab, setActiveScreen]);

  const handleOpenPillboxFromFamily = useCallback(() => {
    setActiveRootTab("pillbox");
    setActiveScreen("children");
  }, [setActiveRootTab, setActiveScreen]);

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
    handleCloseFamily,
    handleClosePrivacyPolicy,
    handleCloseSettings,
    handleCloseSupport,
    handleCloseTermsOfUse,
    handleOpenFamily,
    handleOpenChildrenFromFamily,
    handleOpenPillboxFromFamily,
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
  const { copy, locale, setLocale } = useMobileI18n();
  const childrenScreenContent = useMemo(
    () => buildChildrenScreenContent(locale),
    [locale],
  );
  const fallbackChildrenCards = childrenScreenContent.cards;
  const [authSession, setAuthSession] = useState<MobileAuthSession | null>(
    null,
  );
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const [isShellBootstrapping, setIsShellBootstrapping] = useState(false);
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
  const [illnessActionReturnScreen, setIllnessActionReturnScreen] = useState<
    "illnessJournal" | "illnessReminders"
  >("illnessJournal");
  const [children, setChildren] = useState<MobileChildSummary[]>([]);
  const [familyMembers, setFamilyMembers] = useState<MobileFamilyMember[]>([]);
  const [latestChildMetricsByCardId, setLatestChildMetricsByCardId] = useState<
    Record<string, { weightKg?: number | null; heightCm?: number | null }>
  >({});
  const [activeSleepSessionsByCardId, setActiveSleepSessionsByCardId] =
    useState<Record<string, MobileSleepSession | null>>({});
  const [activeFeedingRecordsByCardId, setActiveFeedingRecordsByCardId] =
    useState<Record<string, MobileFeedingRecord | null>>({});
  const [
    activeIllnessObservationsByChildId,
    setActiveIllnessObservationsByChildId,
  ] = useState<Record<string, MobileIllnessObservation | undefined>>({});
  const [familyCanInviteMembers, setFamilyCanInviteMembers] = useState(false);
  const [familyRoutinesCount, setFamilyRoutinesCount] = useState(0);

  const applyFamilySettingsMeta = useCallback(
    (
      session: MobileAuthSession,
      bundle: {
        familySummary: { premiumActive: boolean };
        familyAccess: { currentPillboxPlanCount: number };
      },
    ) => {
      setFamilyCanInviteMembers(
        session.family.ownerAccountId === session.account.id &&
          Boolean(bundle.familySummary.premiumActive),
      );
      setFamilyRoutinesCount(bundle.familyAccess.currentPillboxPlanCount);
    },
    [],
  );

  const hydrateActiveIllnessObservations = useCallback(
    async (session: MobileAuthSession, childIds: string[]) => {
      if (childIds.length === 0) {
        setActiveIllnessObservationsByChildId({});
        return;
      }

      const activeEpisodeResults = await Promise.allSettled(
        childIds.map((childId) => fetchMobileActiveIllnessEpisode(session, childId)),
      );
      const activeEpisodeHydrationResults = await Promise.allSettled(
        activeEpisodeResults.map(async (result) => {
          if (result.status !== "fulfilled" || !result.value) {
            return null;
          }

          return hydrateObservationFromEpisode(session, result.value, locale);
        }),
      );
      const nextIllnessObservations = Object.fromEntries(
        childIds.map((childId, index) => {
          const result = activeEpisodeHydrationResults[index];
          const observation = result?.status === "fulfilled" ? result.value : null;

          return [childId, observation ?? undefined];
        }),
      );

      setActiveIllnessObservationsByChildId(nextIllnessObservations);
    },
    [locale],
  );

  const loadFamilyMembers = useCallback(async (session: MobileAuthSession) => {
    try {
      const nextFamilyMembers = await fetchMobileFamilyMembers(session);
      setFamilyMembers(nextFamilyMembers);
    } catch {
      setFamilyMembers([]);
    }
  }, []);

  const handleRefreshFamilyMembers = useCallback(async () => {
    if (!authSession) {
      return;
    }

    await loadFamilyMembers(authSession);
  }, [authSession, loadFamilyMembers]);

  const loadChildren = useCallback(
    async (
      session: MobileAuthSession,
      options?: { ignoreErrors?: boolean },
    ) => {
      try {
        const summary = await fetchMobileChildrenSummary(session);
        const nextChildren = summary.map((item) => item.child);

        if (nextChildren.length === 0) {
          setChildren([]);
          setFamilyMembers([]);
          setLatestChildMetricsByCardId({});
          setActiveSleepSessionsByCardId({});
          setActiveFeedingRecordsByCardId({});
          setActiveIllnessObservationsByChildId({});
          return [];
        }

        const nextMetrics = Object.fromEntries(
          summary.map((item) => [
            item.child.id,
            {
              weightKg: item.latestWeightKg,
              heightCm: item.latestHeightCm,
            },
          ]),
        );
        const nextSleepSessions = Object.fromEntries(
          summary.map((item) => [
            item.child.id,
            item.activeSleepSession
              ? ({
                  id: item.activeSleepSession.id,
                  childId: item.child.id,
                  startedAt: item.activeSleepSession.startedAt,
                  endedAt: null,
                  durationMinutes: null,
                  status: "active",
                  createdByAccountId: null,
                } satisfies MobileSleepSession)
              : null,
          ]),
        );
        const nextFeedingRecords = Object.fromEntries(
          summary.map((item) => [
            item.child.id,
            item.activeFeedingRecord
              ? ({
                  id: item.activeFeedingRecord.id,
                  childId: item.child.id,
                  feedingType: "breast",
                  breastSide: null,
                  isExpressed: false,
                  formulaVolumeMl: null,
                  recordedAt: item.activeFeedingRecord.startedAt,
                  startedAt: item.activeFeedingRecord.startedAt,
                  endedAt: null,
                  durationMinutes: null,
                  status: "active",
                  note: null,
                  createdByAccountId: null,
                } satisfies MobileFeedingRecord)
              : null,
          ]),
        );
        setChildren(nextChildren);
        void loadFamilyMembers(session);
        setLatestChildMetricsByCardId(nextMetrics);
        setActiveSleepSessionsByCardId(nextSleepSessions);
        setActiveFeedingRecordsByCardId(nextFeedingRecords);
        setActiveIllnessObservationsByChildId({});
        void hydrateActiveIllnessObservations(
          session,
          nextChildren.map((child) => child.id),
        );
        return nextChildren;
      } catch (error) {
        if (!options?.ignoreErrors) {
          setChildren([]);
          setLatestChildMetricsByCardId({});
          setActiveSleepSessionsByCardId({});
          setActiveFeedingRecordsByCardId({});
          setActiveIllnessObservationsByChildId({});
          throw error;
        }
        return null;
      }
    },
    [hydrateActiveIllnessObservations, loadFamilyMembers],
  );

  const childrenCards = useMemo(() => {
    if (!authSession?.account.familyId) {
      return fallbackChildrenCards;
    }

    if (children.length === 0) {
      return [];
    }

    return buildChildrenCardsFromApi(
      children,
      locale,
      latestChildMetricsByCardId,
    );
  }, [
    authSession?.account.familyId,
    children,
    fallbackChildrenCards,
    latestChildMetricsByCardId,
    locale,
  ]);

  useEffect(() => {
    if (!authSession?.account.familyId) {
      setIsShellBootstrapping(false);
      setChildren([]);
      setFamilyMembers([]);
      setFamilyCanInviteMembers(false);
      setFamilyRoutinesCount(0);
      setLatestChildMetricsByCardId({});
      setActiveSleepSessionsByCardId({});
      setActiveFeedingRecordsByCardId({});
      setActiveIllnessObservationsByChildId({});
      return;
    }

    let cancelled = false;
    const session = authSession;

    async function syncChildren() {
      setIsShellBootstrapping(true);

      try {
        const nextChildren = await loadChildren(session, {
          ignoreErrors: true,
        });

        if (cancelled) {
          return;
        }

        if (!nextChildren || nextChildren.length === 0) {
          setChildren([]);
          setFamilyMembers([]);
          setFamilyCanInviteMembers(false);
          setFamilyRoutinesCount(0);
          setLatestChildMetricsByCardId({});
          setActiveSleepSessionsByCardId({});
          setActiveFeedingRecordsByCardId({});
          setActiveIllnessObservationsByChildId({});
          setIsShellBootstrapping(false);
          return;
        }

        const bootstrapChildId = nextChildren[0]?.id;
        const settingsBundle = await loadSettingsBundle(session).catch(() => null);

        if (!cancelled && settingsBundle) {
          applyFamilySettingsMeta(session, settingsBundle);
        }

        if (bootstrapChildId) {
          void prefetchAnalyticsScreenData(
            session,
            bootstrapChildId,
            "halfYear",
          );
        }
      } catch {
        if (!cancelled) {
          setChildren([]);
          setFamilyMembers([]);
          setFamilyCanInviteMembers(false);
          setFamilyRoutinesCount(0);
          setLatestChildMetricsByCardId({});
          setActiveSleepSessionsByCardId({});
          setActiveFeedingRecordsByCardId({});
          setActiveIllnessObservationsByChildId({});
        }
      } finally {
        if (!cancelled) {
          setIsShellBootstrapping(false);
        }
      }
    }

    void syncChildren();

    return () => {
      cancelled = true;
    };
  }, [applyFamilySettingsMeta, authSession, loadChildren]);

  useEffect(() => {
    if (!authSession) {
      setFamilyCanInviteMembers(false);
      setFamilyRoutinesCount(0);
      return;
    }

    const cachedSettingsBundle = getCachedSettingsBundle(authSession.accessToken);
    if (!cachedSettingsBundle) {
      return;
    }

    applyFamilySettingsMeta(authSession, cachedSettingsBundle);
  }, [applyFamilySettingsMeta, authSession]);

  useEffect(() => {
    if (childrenCards.length === 0) {
      setSelectedChildId("");
      return;
    }

    setSelectedChildId((current) =>
      childrenCards.some((card) => card.nodeId === current)
        ? current
        : (childrenCards[0]?.nodeId ?? ""),
    );
  }, [childrenCards]);

  useEffect(() => {
    if (!authSession || !selectedChildId) {
      return;
    }

    void prefetchAnalyticsScreenData(authSession, selectedChildId, "halfYear");
  }, [authSession, selectedChildId]);

  const activeSleepStartedAtByCardId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(activeSleepSessionsByCardId).map(([key, value]) => [
          key,
          value?.status === "active" ? value.startedAt : null,
        ]),
      ),
    [activeSleepSessionsByCardId],
  );

  const activeFeedingStartedAtByCardId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(activeFeedingRecordsByCardId).map(([key, value]) => [
          key,
          value?.status === "active" ? value.startedAt : null,
        ]),
      ),
    [activeFeedingRecordsByCardId],
  );

  const shouldShowJournalTab = useMemo(
    () =>
      hasActiveIllnessObservation(activeIllnessObservationsByChildId) ||
      activeRootTab === "journal" ||
      activeScreen === "illnessJournal" ||
      activeScreen === "illnessReminders" ||
      activeScreen === "illnessActionPlaceholder",
    [activeIllnessObservationsByChildId, activeRootTab, activeScreen],
  );
  const rootTabItems = useMemo(
    () => {
      const baseTabs = buildChildrenScreenContent(locale, activeRootTab).tabs;
      const journalTab = {
        key: "journal" as const,
        label: copy.childProfile.journalTitle,
        active: activeRootTab === "journal",
      };

      const tabsWithoutMore = baseTabs.filter((tab) => tab.key !== "more");
      const moreTab = baseTabs.find((tab) => tab.key === "more");

      return [
        ...(shouldShowJournalTab ? [journalTab] : []),
        ...tabsWithoutMore,
        ...(moreTab ? [moreTab] : []),
      ];
    },
    [activeRootTab, copy.childProfile.journalTitle, locale, shouldShowJournalTab],
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
    handleOpenAnalytics,
    handleOpenAnalyticsEpisode,
    handleOpenChildProfile,
    handleOpenEditProfile,
    handleOpenJournalEntry,
    handleOpenObservation,
    handleOpenRootJournalEntry,
  } = useChildFlowController({
    activeIllnessObservationsByChildId,
    setActiveRootTab,
    setActiveScreen,
    setSelectedChildId,
    setSelectedEpisode,
    setSelectedJournalKind,
  });
  const {
    handleAddIllnessEntry,
    handleCloseIllnessReminders,
    handleCloseIllnessJournal,
    handleCloseIllnessOnboarding,
    handleDeleteIllnessEntry,
    handleFinishIllnessObservation,
    handleOpenIllnessReminders,
    handleOpenReminderComposer,
    handleSaveAdministrationEntry,
    handleSaveIllnessNoteEntry,
    handleTakeReminderDose,
    handleSaveReminderRecipients,
    handleSaveReminderEntry,
    handleUpdateReminderEntry,
    handleSaveTemperatureEntry,
    handleStartIllnessObservation,
  } = useIllnessFlowController({
    authSession,
    activeIllnessObservationsByChildId,
    locale,
    selectedChildId,
    setSelectedChildId,
    setSelectedIllnessActionKind,
    setIllnessActionReturnScreen,
    setActiveIllnessObservationsByChildId,
    navigateToChildrenRoot: () => openChildrenRoot(setActiveRootTab, setActiveScreen),
    navigateToIllnessJournalRoot: (childId) =>
      openIllnessJournalRoot({
        childId,
        setActiveRootTab,
        setActiveScreen,
        setSelectedChildId,
      }),
    navigateToIllnessReminders: () => setActiveScreen("illnessReminders"),
    navigateToIllnessAction: () => setActiveScreen("illnessActionPlaceholder"),
  });
  const {
    handleCloseFamily,
    handleClosePrivacyPolicy,
    handleCloseSettings,
    handleCloseSupport,
    handleCloseTermsOfUse,
    handleOpenFamily,
    handleOpenChildrenFromFamily,
    handleOpenPillboxFromFamily,
    handleOpenPrivacyPolicy,
    handleOpenSettings,
    handleOpenSupport,
    handleOpenTermsOfUse,
  } = useUtilityNavigationController({
    setActiveRootTab,
    setActiveScreen,
  });

  const handleSelectRootTab = useCallback(
    (key: MobileBottomTabKey) => {
      if (key === "journal") {
        const activeIllnessChildId = resolveActiveIllnessChildId(
          activeIllnessObservationsByChildId,
          selectedChildId,
        );

        if (!activeIllnessChildId) {
          openChildrenRoot(setActiveRootTab, setActiveScreen);
          return;
        }

        openIllnessJournalRoot({
          childId: activeIllnessChildId,
          setActiveRootTab,
          setActiveScreen,
          setSelectedChildId,
        });
        return;
      }

      setActiveRootTab(key);
      setActiveScreen("children");
    },
    [
      activeIllnessObservationsByChildId,
      selectedChildId,
      setActiveRootTab,
      setActiveScreen,
      setSelectedChildId,
    ],
  );

  const handleOpenChildCreate = useCallback(() => {
    setActiveScreen("childCreate");
  }, []);

  const handleCloseChildCreate = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleSleepPress = useCallback(
    async (cardId: string) => {
      if (!authSession) {
        return;
      }

      const activeSession = activeSleepSessionsByCardId[cardId];

      if (activeSession?.status === "active") {
        const stoppedSession = await stopMobileSleepSession(authSession, {
          sessionId: activeSession.id,
        });
        setActiveSleepSessionsByCardId((current) => ({
          ...current,
          [cardId]: stoppedSession.status === "active" ? stoppedSession : null,
        }));
        return;
      }

      const startedSession = await startMobileSleepSession(authSession, {
        childId: cardId,
      });
      setActiveSleepSessionsByCardId((current) => ({
        ...current,
        [cardId]: startedSession,
      }));
    },
    [activeSleepSessionsByCardId, authSession],
  );

  const handleFeedingPress = useCallback(
    async (cardId: string) => {
      if (!authSession) {
        return;
      }

      const activeRecord = activeFeedingRecordsByCardId[cardId];

      if (activeRecord?.status === "active") {
        const stoppedRecord = await stopMobileFeedingRecord(authSession, {
          recordId: activeRecord.id,
        });
        setActiveFeedingRecordsByCardId((current) => ({
          ...current,
          [cardId]: stoppedRecord.status === "active" ? stoppedRecord : null,
        }));
        return;
      }

      const startedRecord = await startMobileFeedingRecord(authSession, {
        childId: cardId,
        feedingType: "breast",
        breastSide: "left",
        isExpressed: false,
      });
      setActiveFeedingRecordsByCardId((current) => ({
        ...current,
        [cardId]: startedRecord,
      }));
    },
    [activeFeedingRecordsByCardId, authSession],
  );

  const handleStartFeedingTimer = useCallback(async () => {
    if (!authSession || !selectedChildId) {
      return;
    }

    const activeRecord = activeFeedingRecordsByCardId[selectedChildId];

    if (activeRecord?.status === "active") {
      return;
    }

    const startedRecord = await startMobileFeedingRecord(authSession, {
      childId: selectedChildId,
      feedingType: "breast",
      breastSide: "left",
      isExpressed: false,
    });
    setActiveFeedingRecordsByCardId((current) => ({
      ...current,
      [selectedChildId]: startedRecord,
    }));
  }, [activeFeedingRecordsByCardId, authSession, selectedChildId]);

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

      const nextChildren = await loadChildren(authSession, {
        ignoreErrors: true,
      });
      setSelectedChildId(created.id);

      if (!nextChildren || nextChildren.length === 0) {
        setChildren([created]);
        setLatestChildMetricsByCardId((current) => ({
          ...current,
          [created.id]: {
            weightKg: payload.weightKg ?? null,
            heightCm: payload.heightCm ?? null,
          },
        }));
      }

      setActiveScreen("children");
    },
    [authSession, loadChildren],
  );

  const handleSubmitChildProfileEdit = useCallback(
    async (payload: {
      name: string;
      birthDate: string | null;
      avatarKey: string | null;
      gender: string | null;
      babyModeEnabled: boolean;
      allergies: string | null;
      notes: string | null;
    }) => {
      if (!authSession || !selectedChildId) {
        return;
      }

      await updateMobileChild(authSession, selectedChildId, {
        name: payload.name,
        birthDate: payload.birthDate,
        avatarKey: payload.avatarKey,
        gender: payload.gender,
        babyModeEnabled: payload.babyModeEnabled,
        allergies: payload.allergies,
        notes: payload.notes,
      });

      await loadChildren(authSession, { ignoreErrors: true });
      setActiveScreen("childProfile");
    },
    [authSession, loadChildren, selectedChildId],
  );

  const handleDeleteSelectedChild = useCallback(async () => {
    if (!authSession || !selectedChildId) {
      return;
    }

    await deleteMobileChild(authSession, selectedChildId);
    await loadChildren(authSession, { ignoreErrors: true });
    setActiveScreen("children");
  }, [authSession, loadChildren, selectedChildId]);

  const rootTabContentProps: RootTabContentProps = {
    locale,
    activeRootTab,
    authSession,
    childrenCards,
    selectedChildId,
    activeSleepStartedAtByCardId,
    activeFeedingStartedAtByCardId,
    activeObservationByCardId: Object.fromEntries(
      Object.entries(activeIllnessObservationsByChildId).map(([key, value]) => [
        key,
        Boolean(value),
      ]),
    ),
    onOpenChildProfile: handleOpenChildProfile,
    onOpenChildCreate: handleOpenChildCreate,
    onOpenRootJournalEntry: handleOpenRootJournalEntry,
    onOpenObservation: handleOpenObservation,
    onSleepPress: handleSleepPress,
    onFeedingPress: handleFeedingPress,
    onLogout: handleLogout,
    onOpenFamily: handleOpenFamily,
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
        familyMembers:
          familyMembers.length > 0
            ? familyMembers
            : [
                {
                  id: authSession.account.id,
                  email: authSession.account.email,
                  familyId: authSession.account.familyId,
                  displayName: authSession.account.displayName,
                  relationshipLabel: authSession.account.relationshipLabel,
                  phone: authSession.account.phone,
                  preferredLanguage:
                    authSession.account.preferredLanguage === "ru"
                      ? "ru"
                      : "en",
                  familyRole: authSession.account.familyRole,
                  accessPolicy: {
                    allChildren: true,
                    childIds: [],
                    childrenAccess: "edit",
                    cabinetAccess: "edit",
                    pillboxAccess: "edit",
                    cabinetPushEnabled: true,
                  },
                },
              ],
        familyCanInviteMembers,
        familyRoutinesCount,
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
          onSubmitEditProfile: handleSubmitChildProfileEdit,
          onDeleteChild: handleDeleteSelectedChild,
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
          onDeleteIllnessEntry: handleDeleteIllnessEntry,
          onSaveAdministrationEntry: handleSaveAdministrationEntry,
          onTakeReminderDose: handleTakeReminderDose,
          onUpdateReminderEntry: handleUpdateReminderEntry,
          onSaveIllnessNoteEntry: handleSaveIllnessNoteEntry,
          onSaveReminderEntry: handleSaveReminderEntry,
          onOpenIllnessReminders: handleOpenIllnessReminders,
          onOpenReminderComposer: handleOpenReminderComposer,
          onSaveReminderRecipients: handleSaveReminderRecipients,
          onSaveTemperatureEntry: handleSaveTemperatureEntry,
          selectedIllnessActionKind,
          onBackIllnessActionPlaceholder: () =>
            setActiveScreen(illnessActionReturnScreen),
          onFinishIllnessObservation: handleFinishIllnessObservation,
          onBackIllnessJournal: handleCloseIllnessJournal,
          onBackIllnessReminders: handleCloseIllnessReminders,
          onBackIllnessOnboarding: handleCloseIllnessOnboarding,
        },
        utilityFlow: {
          onBackFamily: handleCloseFamily,
          onOpenChildrenFromFamily: handleOpenChildrenFromFamily,
          onOpenPillboxFromFamily: handleOpenPillboxFromFamily,
          onRefreshFamilyMembers: handleRefreshFamilyMembers,
          onUpdateCurrentProfile: handleUpdateAuthSession,
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
    isShellBootstrapping,
    rootTabItems,
    shouldShowRootTabBar: isRootModuleScreen(activeScreen),
    handleAuthenticated,
    handleSelectRootTab,
    rootTabContentProps,
    overlayScreensProps,
  };
}
