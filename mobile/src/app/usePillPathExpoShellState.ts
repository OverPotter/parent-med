import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type MobileAuthSession } from "../features/auth/api/authApi";
import { type AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import { prefetchAnalyticsScreenData } from "../features/analytics/screens/useAnalyticsScreenState";
import {
  createMobileChild,
  deleteMobileChild,
  updateMobileChild,
} from "../features/children/api/childrenApi";
import { createMobileHeightEntry } from "../features/growth/api/heightEntriesApi";
import { type MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import {
  buildChildrenCardsFromApi,
  buildChildrenScreenContent,
} from "../features/children/model/childrenRedesign";
import { type IllnessQuickActionKind } from "../features/illness/model/illnessObservation";
import {
  hasActiveIllnessObservation,
  resolveActiveIllnessChildId,
} from "../features/illness/model/illnessObservationState";
import { useIllnessFlowController } from "../features/illness/model/useIllnessFlowController";
import { type JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import {
  applyPreferredLanguageToSession,
  updatePreferredLanguage,
} from "../features/settings/api/settingsApi";
import { useLiveActivitiesSync } from "../features/live-activities/useLiveActivitiesSync";
import { createMobileWeightEntry } from "../features/weight/api/weightEntriesApi";
import { useMobileI18n, type MobileLocale } from "../shared/i18n/mobileI18n";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import type { PostAuthOnboardingStep } from "./postAuthOnboardingModel";
import { resolvePostAuthOnboardingStep } from "./postAuthOnboardingModel";
import {
  markDisplayNameOnboardingSkipped,
  markRecoveryCodeOnboardingSkipped,
  readPostAuthOnboardingSkips,
} from "./postAuthOnboardingStorage";
import { useShellAuthSessionController } from "./useShellAuthSessionController";
import { useCareSessionController } from "./useCareSessionController";
import { useLiveActivitySettingsController } from "./useLiveActivitySettingsController";
import { openChildrenRoot, openIllnessJournalRoot } from "./shellNavigation";
import { useShellChildFlowController } from "./useShellChildFlowController";
import { useShellFamilyState } from "./useShellFamilyState";
import { usePushNotificationNavigation } from "./usePushNotificationNavigation";
import { usePushSubscriptionSync } from "./usePushSubscriptionSync";
import { useShellUtilityNavigationController } from "./useShellUtilityNavigationController";
import { useLiveActivityNavigation } from "./useLiveActivityNavigation";
import {
  isRootModuleScreen,
  resolvePostAuthLandingScreen,
  type PillPathActiveScreen,
} from "./pillPathExpoShellModel";

type RootTabContentProps = ComponentProps<typeof RootTabContent>;
type OverlayScreensProps = ComponentProps<typeof OverlayScreens>;

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
  const [didJustAuthenticate, setDidJustAuthenticate] = useState(false);
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
  const [skippedDisplayNameOnboarding, setSkippedDisplayNameOnboarding] =
    useState(false);
  const [skippedRecoveryCodeOnboarding, setSkippedRecoveryCodeOnboarding] =
    useState(false);
  const [forcedPostAuthOnboardingStep, setForcedPostAuthOnboardingStep] =
    useState<PostAuthOnboardingStep>(null);
  const {
    activeFeedingRecordsByCardId,
    activeIllnessObservationsByChildId,
    activeSleepSessionsByCardId,
    canUseLiveActivities,
    children,
    familyCanInviteMembers,
    familyMembers,
    familyRoutinesCount,
    isShellBootstrapping,
    latestChildMetricsByCardId,
    liveActivityPreferences,
    loadChildren,
    refreshFamilyMembers: handleRefreshFamilyMembers,
    setActiveFeedingRecordsByCardId,
    setActiveIllnessObservationsByChildId,
    setActiveSleepSessionsByCardId,
    setChildren,
    setCanUseLiveActivities,
    setFamilyRoutinesCount,
    setLatestChildMetricsByCardId,
    setLiveActivityPreferences,
  } = useShellFamilyState({
    authSession,
    locale,
  });
  const {
    handleFamilyAccessChanged,
    handleIsIllnessLiveActivityEnabled,
    handlePushPreferencesChanged,
    handleToggleIllnessLiveActivity,
    illnessLiveActivityPreferenceVersion,
  } = useLiveActivitySettingsController({
    authSession,
    setCanUseLiveActivities,
    setFamilyRoutinesCount,
    setLiveActivityPreferences,
  });

  const childrenCards = useMemo(() => {
    if (!authSession) {
      return fallbackChildrenCards;
    }

    if (!authSession.account.familyId) {
      return [];
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

  const handleOpenChildrenRoot = useCallback(() => {
    openChildrenRoot(setActiveRootTab, setActiveScreen);
  }, [setActiveRootTab, setActiveScreen]);

  const handleOpenCabinetRoot = useCallback(() => {
    setActiveRootTab("cabinet");
    setActiveScreen("children");
  }, [setActiveRootTab, setActiveScreen]);

  const handleOpenPillboxAnalytics = useCallback(() => {
    setActiveRootTab("pillbox");
    setActiveScreen("pillboxAnalytics");
  }, [setActiveRootTab, setActiveScreen]);

  const handleClosePillboxAnalytics = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleOpenIllnessJournalRoot = useCallback(
    (childId: string) => {
      openIllnessJournalRoot({
        childId,
        setActiveRootTab,
        setActiveScreen,
      });
    },
    [setActiveRootTab, setActiveScreen],
  );

  useLiveActivityNavigation({
    authSession,
    children,
    onSelectChild: setSelectedChildId,
    onOpenChildren: handleOpenChildrenRoot,
    onOpenIllnessJournal: handleOpenIllnessJournalRoot,
  });

  usePushSubscriptionSync(authSession);

  const {
    handleFeedingPress,
    handleSleepPress,
    handleStartFeedingTimer,
  } = useCareSessionController({
    authSession,
    children,
    locale,
    liveActivityPreferences,
    selectedChildId,
    activeSleepSessionsByCardId,
    activeFeedingRecordsByCardId,
    setActiveSleepSessionsByCardId,
    setActiveFeedingRecordsByCardId,
  });

  useLiveActivitiesSync({
    authSession,
    children,
    activeSleepByChildId: activeSleepSessionsByCardId,
    activeFeedingByChildId: activeFeedingRecordsByCardId,
    activeIllnessByChildId: activeIllnessObservationsByChildId,
    preferences: liveActivityPreferences,
    canUseLiveActivities,
    illnessPreferenceVersion: illnessLiveActivityPreferenceVersion,
  });

  useEffect(() => {
    if (!authSession) {
      setDidJustAuthenticate(false);
      return;
    }

    const landingScreen = resolvePostAuthLandingScreen({
      justAuthenticated: didJustAuthenticate,
      hasFamily: Boolean(authSession.account.familyId),
    });

    if (!landingScreen) {
      return;
    }

    setActiveRootTab("children");
    setActiveScreen(landingScreen);
    setDidJustAuthenticate(false);
  }, [authSession, didJustAuthenticate]);

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
    handleAuthenticated: applyAuthenticated,
    handleLogout,
    handleMarkRecoveryCodeConfigured,
    handleSessionDeleted,
    handleUpdateAuthSession,
    handleUpdatePreferredLanguage,
  } = useShellAuthSessionController({
    authSession,
    setAuthSession,
    setIsAuthBootstrapping,
    setLocale,
  });
  const handleAuthenticated = useCallback(
    async (session: MobileAuthSession) => {
      await applyAuthenticated(session);
      setDidJustAuthenticate(true);
    },
    [applyAuthenticated],
  );
  useEffect(() => {
    if (!authSession?.account.id) {
      setSkippedDisplayNameOnboarding(false);
      setSkippedRecoveryCodeOnboarding(false);
      setForcedPostAuthOnboardingStep(null);
      return;
    }

    let cancelled = false;

    void readPostAuthOnboardingSkips(authSession.account.id).then((result) => {
      if (cancelled) {
        return;
      }

      setSkippedDisplayNameOnboarding(result.skippedDisplayName);
      setSkippedRecoveryCodeOnboarding(result.skippedRecoveryCode);
    });

    return () => {
      cancelled = true;
    };
  }, [authSession?.account.id]);

  const resolvedPostAuthOnboardingStep = useMemo(
    () =>
      resolvePostAuthOnboardingStep({
        session: authSession,
        skippedDisplayName: skippedDisplayNameOnboarding,
        skippedRecoveryCode: skippedRecoveryCodeOnboarding,
      }),
    [
      authSession,
      skippedDisplayNameOnboarding,
      skippedRecoveryCodeOnboarding,
    ],
  );
  const postAuthOnboardingStep =
    forcedPostAuthOnboardingStep ?? resolvedPostAuthOnboardingStep;
  const handleSkipDisplayNameOnboarding = useCallback(async () => {
    if (!authSession?.account.id) {
      return;
    }

    if (forcedPostAuthOnboardingStep) {
      setForcedPostAuthOnboardingStep("recovery-code");
      return;
    }

    await markDisplayNameOnboardingSkipped(authSession.account.id);
    setSkippedDisplayNameOnboarding(true);
  }, [authSession?.account.id, forcedPostAuthOnboardingStep]);
  const handleSkipRecoveryCodeOnboarding = useCallback(async () => {
    if (!authSession?.account.id) {
      return;
    }

    if (forcedPostAuthOnboardingStep) {
      setForcedPostAuthOnboardingStep(null);
      return;
    }

    await markRecoveryCodeOnboardingSkipped(authSession.account.id);
    setSkippedRecoveryCodeOnboarding(true);
  }, [authSession?.account.id, forcedPostAuthOnboardingStep]);
  const handleSavePostAuthDisplayName = useCallback(
    async (patch: {
      displayName: string;
      relationshipLabel: string | null;
      phone: string | null;
    }) => {
      await handleUpdateAuthSession(patch);
      if (forcedPostAuthOnboardingStep) {
        setForcedPostAuthOnboardingStep("recovery-code");
      }
    },
    [forcedPostAuthOnboardingStep, handleUpdateAuthSession],
  );
  const handleSavePostAuthRecoveryCode = useCallback(async () => {
    await handleMarkRecoveryCodeConfigured();
    if (forcedPostAuthOnboardingStep) {
      setForcedPostAuthOnboardingStep(null);
    }
  }, [forcedPostAuthOnboardingStep, handleMarkRecoveryCodeConfigured]);
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
  } = useShellChildFlowController({
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
  } = useShellUtilityNavigationController({
    setActiveRootTab,
    setActiveScreen,
  });

  usePushNotificationNavigation({
    authSession,
    selectedChildId,
    onSelectChild: setSelectedChildId,
    onOpenChildren: handleOpenChildrenRoot,
    onOpenIllnessJournal: (childId) => {
      handleOpenIllnessJournalRoot(childId ?? selectedChildId);
    },
    onOpenCabinet: handleOpenCabinetRoot,
    onOpenPillbox: handleOpenPillboxFromFamily,
    onOpenSettings: handleOpenSettings,
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
    familyMembers,
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
    onOpenPillboxAnalytics: handleOpenPillboxAnalytics,
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
          isIllnessLiveActivityEnabled: handleIsIllnessLiveActivityEnabled,
          onToggleIllnessLiveActivity: handleToggleIllnessLiveActivity,
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
          onPushPreferencesChanged: handlePushPreferencesChanged,
          onFamilyAccessChanged: handleFamilyAccessChanged,
          onBackPrivacyPolicy: handleClosePrivacyPolicy,
          onBackSupport: handleCloseSupport,
          onBackSettings: handleCloseSettings,
          onBackTermsOfUse: handleCloseTermsOfUse,
        },
        pillboxFlow: {
          onBackAnalytics: handleClosePillboxAnalytics,
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
    postAuthOnboardingStep,
    handleSkipDisplayNameOnboarding,
    handleSkipRecoveryCodeOnboarding,
    handleSavePostAuthDisplayName,
    handleSavePostAuthRecoveryCode,
    rootTabContentProps,
    overlayScreensProps,
  };
}
