import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type MobileAuthSession } from "../features/auth/api/authApi";
import { type AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import { prefetchAnalyticsScreenData } from "../features/analytics/screens/useAnalyticsScreenState";
import { type MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import {
  buildChildrenCardsFromApi,
  buildChildrenScreenContent,
  resolveChildAccess,
} from "../features/children/model/childrenRedesign";
import { type IllnessQuickActionKind } from "../features/illness/model/illnessObservation";
import { resolveActiveIllnessChildId } from "../features/illness/model/illnessObservationState";
import { useIllnessFlowController } from "../features/illness/model/useIllnessFlowController";
import { type JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import {
  applyPreferredLanguageToSession,
  updatePreferredLanguage,
} from "../features/settings/api/settingsApi";
import { loadSettingsBundle } from "../features/settings/model/settingsScreenLogic";
import { buildSettingsScreenContent } from "../features/settings/model/settingsScreen";
import { useLiveActivitiesSync } from "../features/live-activities/useLiveActivitiesSync";
import { useMobileI18n, type MobileLocale } from "../shared/i18n/mobileI18n";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import { buildPushBannerState } from "./pushBannerModel";
import { buildRootTabItems, shouldShowJournalRootTab } from "./shellRootTabsModel";
import { usePostAuthOnboardingController } from "./usePostAuthOnboardingController";
import { useShellAuthSessionController } from "./useShellAuthSessionController";
import { useShellChildCrudController } from "./useShellChildCrudController";
import { useCareSessionController } from "./useCareSessionController";
import { useLiveActivitySettingsController } from "./useLiveActivitySettingsController";
import { openChildrenRoot, openIllnessJournalRoot } from "./shellNavigation";
import { useShellChildFlowController } from "./useShellChildFlowController";
import { useShellFamilyState } from "./useShellFamilyState";
import { usePushNotificationNavigation } from "./usePushNotificationNavigation";
import { usePushSubscriptionSync } from "./usePushSubscriptionSync";
import { useShellUtilityNavigationController } from "./useShellUtilityNavigationController";
import { useLiveActivityNavigation } from "./useLiveActivityNavigation";
import { openNativeNotificationSettings } from "../shared/push/nativePushNotifications";
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
  const settingsContent = useMemo(() => buildSettingsScreenContent(locale), [locale]);
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
  const [childrenPaywallVisible, setChildrenPaywallVisible] = useState(false);
  const [familyPaywallVisible, setFamilyPaywallVisible] = useState(false);
  const [cabinetPaywallVisible, setCabinetPaywallVisible] = useState(false);
  const [pillboxPaywallVisible, setPillboxPaywallVisible] = useState(false);
  const [illnessActionReturnScreen, setIllnessActionReturnScreen] = useState<
    "illnessJournal" | "illnessReminders"
  >("illnessJournal");
  const {
    activeFeedingRecordsByCardId,
    activeIllnessObservationsByChildId,
    activeSleepSessionsByCardId,
    canUseLiveActivities,
    children,
    familyCanSeeInviteCard,
    familyPremiumActive,
    familyMembers,
    familyRoutinesCount,
    isShellBootstrapping,
    latestChildMetricsByCardId,
    pushPreferences,
    liveActivityPreferences,
    loadChildren,
    refreshFamilyMembers: handleRefreshFamilyMembers,
    setActiveFeedingRecordsByCardId,
    setActiveIllnessObservationsByChildId,
    setActiveSleepSessionsByCardId,
    setChildren,
    setCanUseLiveActivities,
    setFamilyPremiumActive,
    setFamilyRoutinesCount,
    setLatestChildMetricsByCardId,
    setPushPreferences,
    setLiveActivityPreferences,
  } = useShellFamilyState({
    authSession,
    locale,
  });
  const {
    handleFamilyAccessChanged,
    handleIsIllnessLiveActivityEnabled,
    handlePushPreferencesChanged: handleLiveActivityPushPreferencesChanged,
    handleToggleIllnessLiveActivity,
    illnessLiveActivityPreferenceVersion,
  } = useLiveActivitySettingsController({
    authSession,
    setCanUseLiveActivities,
    setFamilyRoutinesCount,
    setLiveActivityPreferences,
  });

  const handlePushPreferencesChanged = useCallback(
    (preferences: Parameters<
      typeof handleLiveActivityPushPreferencesChanged
    >[0]) => {
      setPushPreferences(preferences);
      handleLiveActivityPushPreferencesChanged(preferences);
    },
    [handleLiveActivityPushPreferencesChanged, setPushPreferences],
  );

  const childAccess = useMemo(
    () =>
      resolveChildAccess({
        children,
        premiumActive: familyPremiumActive,
      }),
    [children, familyPremiumActive],
  );
  const lockedChildIdSet = useMemo(
    () => new Set(childAccess.lockedChildIds),
    [childAccess.lockedChildIds],
  );
  const isChildLocked = useCallback(
    (childId: string) => lockedChildIdSet.has(childId),
    [lockedChildIdSet],
  );
  const hasActiveIllnessObservation = useCallback(
    (childId: string) => Boolean(activeIllnessObservationsByChildId[childId]),
    [activeIllnessObservationsByChildId],
  );

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
      childAccess.lockedChildIds,
    );
  }, [
    authSession?.account.familyId,
    childAccess.lockedChildIds,
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
      if (isChildLocked(childId) && !hasActiveIllnessObservation(childId)) {
        setChildrenPaywallVisible(true);
        return;
      }

      openIllnessJournalRoot({
        childId,
        setActiveRootTab,
        setActiveScreen,
        setSelectedChildId,
      });
    },
    [
      hasActiveIllnessObservation,
      isChildLocked,
      setActiveRootTab,
      setActiveScreen,
      setSelectedChildId,
    ],
  );

  useLiveActivityNavigation({
    authSession,
    children,
    onSelectChild: setSelectedChildId,
    onOpenChildren: handleOpenChildrenRoot,
    onOpenIllnessJournal: handleOpenIllnessJournalRoot,
  });

  const pushSubscriptionState = usePushSubscriptionSync(authSession, {
    permissionPromptTitle: settingsContent.notificationsPermissionPromptTitle,
    permissionPromptBody: settingsContent.notificationsPermissionPromptBody,
    openSettingsLabel: settingsContent.notificationsOpenSettingsLabel,
    cancelLabel: settingsContent.cancelActionLabel,
  });
  const pushBannerState = useMemo(
    () =>
      buildPushBannerState({
        activeRootTab,
        locale,
        pushPreferences,
        pushSubscriptionState,
        settingsContent,
      }),
    [activeRootTab, locale, pushPreferences, pushSubscriptionState, settingsContent],
  );

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
    locale,
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
      childrenCards.some(
        (card) =>
          card.nodeId === current &&
          (!card.isLocked || hasActiveIllnessObservation(card.nodeId)),
      )
        ? current
        : (childAccess.unlockedChildId ?? ""),
    );
  }, [childAccess.unlockedChildId, childrenCards, hasActiveIllnessObservation]);

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
      shouldShowJournalRootTab({
        activeIllnessObservationsByChildId,
        activeRootTab,
        activeScreen,
      }),
    [activeIllnessObservationsByChildId, activeRootTab, activeScreen],
  );
  const rootTabItems = useMemo(
    () =>
      buildRootTabItems({
        locale,
        activeRootTab,
        shouldShowJournalTab,
        journalLabel: copy.childProfile.journalTitle,
      }),
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
  const {
    postAuthOnboardingStep,
    handleSkipDisplayNameOnboarding,
    handleSkipRecoveryCodeOnboarding,
    handleSavePostAuthDisplayName,
    handleSavePostAuthRecoveryCode,
  } = usePostAuthOnboardingController({
    authSession,
    handleUpdateAuthSession,
    handleMarkRecoveryCodeConfigured,
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
  } = useShellChildFlowController({
    activeIllnessObservationsByChildId,
    isChildLocked,
    onOpenLockedChild: () => setChildrenPaywallVisible(true),
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
    selectedChildId: childAccess.unlockedChildId ?? selectedChildId,
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

        if (
          isChildLocked(activeIllnessChildId) &&
          !hasActiveIllnessObservation(activeIllnessChildId)
        ) {
          setChildrenPaywallVisible(true);
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
      hasActiveIllnessObservation,
      isChildLocked,
      selectedChildId,
      setActiveRootTab,
      setActiveScreen,
      setSelectedChildId,
    ],
  );

  const handleOpenChildCreate = useCallback(() => {
    if (children.length >= 1 && !familyPremiumActive) {
      setChildrenPaywallVisible(true);
      return;
    }

    setActiveScreen("childCreate");
  }, [children.length, familyPremiumActive]);

  const handleCloseChildCreate = useCallback(() => {
    setActiveScreen("children");
  }, []);
  const refreshPremiumAccessAfterPurchase = useCallback(async () => {
    if (!authSession) {
      return;
    }

    const nextBundle = await loadSettingsBundle(authSession);
    setFamilyPremiumActive(Boolean(nextBundle.familySummary.premiumActive));
    handlePushPreferencesChanged(nextBundle.pushPreferences);
    handleFamilyAccessChanged(nextBundle.familyAccess);
  }, [
    authSession,
    handleFamilyAccessChanged,
    handlePushPreferencesChanged,
    setFamilyPremiumActive,
  ]);
  const handleChildrenPaywallPurchased = useCallback(async () => {
    await refreshPremiumAccessAfterPurchase();
    setChildrenPaywallVisible(false);
  }, [refreshPremiumAccessAfterPurchase]);
  const handlePillboxPaywallPurchased = useCallback(async () => {
    await refreshPremiumAccessAfterPurchase();
    setPillboxPaywallVisible(false);
  }, [refreshPremiumAccessAfterPurchase]);
  const handleCabinetPaywallPurchased = useCallback(async () => {
    await refreshPremiumAccessAfterPurchase();
    setCabinetPaywallVisible(false);
  }, [refreshPremiumAccessAfterPurchase]);
  const handleFamilyPaywallPurchased = useCallback(async () => {
    await refreshPremiumAccessAfterPurchase();
    setFamilyPaywallVisible(false);
  }, [refreshPremiumAccessAfterPurchase]);
  const {
    handleSubmitChildCreate,
    handleSubmitChildProfileEdit,
    handleDeleteSelectedChild,
  } = useShellChildCrudController({
    authSession,
    selectedChildId,
    loadChildren,
    setSelectedChildId,
    setChildren,
    setLatestChildMetricsByCardId,
    setActiveScreen,
  });

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
    addChildLocked: children.length >= 1 && !familyPremiumActive,
    childrenPaywallVisible,
    onCloseChildrenPaywall: () => setChildrenPaywallVisible(false),
    onChildrenPaywallPurchased: handleChildrenPaywallPurchased,
    onOpenLockedChild: () => setChildrenPaywallVisible(true),
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
    addCabinetFromCatalogLocked: !familyPremiumActive,
    cabinetPaywallVisible,
    onCloseCabinetPaywall: () => setCabinetPaywallVisible(false),
    onCabinetPaywallPurchased: handleCabinetPaywallPurchased,
    onOpenLockedCabinetCatalog: () => setCabinetPaywallVisible(true),
    createPillboxPlanLocked: familyRoutinesCount >= 1 && !familyPremiumActive,
    pillboxPaywallVisible,
    onClosePillboxPaywall: () => setPillboxPaywallVisible(false),
    onPillboxPaywallPurchased: handlePillboxPaywallPurchased,
    onOpenLockedPillboxPlan: () => setPillboxPaywallVisible(true),
    pushNotificationsBannerVisible: pushBannerState.visible,
    pushNotificationsBannerTitle: pushBannerState.title,
    pushNotificationsBannerBody: pushBannerState.body,
    pushNotificationsBannerActionLabel: pushBannerState.actionLabel,
    onOpenPushNotificationSettings:
      pushBannerState.openTarget === "system"
        ? () => {
            void openNativeNotificationSettings();
          }
        : handleOpenSettings,
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
                  preferredLanguage: locale,
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
        familyCanSeeInviteCard,
        familyInviteLocked: !familyPremiumActive,
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
          onOpenLockedChild: () => setChildrenPaywallVisible(true),
          onOpenLockedFamilyInvite: () => setFamilyPaywallVisible(true),
          onOpenPillboxFromFamily: handleOpenPillboxFromFamily,
          onOpenPrivacyPolicy: handleOpenPrivacyPolicy,
          onOpenTermsOfUse: handleOpenTermsOfUse,
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
          familyPaywallVisible,
          onCloseFamilyPaywall: () => setFamilyPaywallVisible(false),
          onFamilyPaywallPurchased: handleFamilyPaywallPurchased,
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
