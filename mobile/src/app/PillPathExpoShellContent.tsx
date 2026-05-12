import { View } from "react-native";
import { AnalyticsBreakdownScreen } from "../features/analytics/screens/AnalyticsBreakdownScreen";
import { AnalyticsScreen } from "../features/analytics/screens/AnalyticsScreen";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import { ChildCreateScreen } from "../features/children/screens/ChildCreateScreen";
import { ChildProfileEditScreen } from "../features/child-profile-edit/screens/ChildProfileEditScreen";
import { ChildProfileRedesignScreen } from "../features/child-profile/screens/ChildProfileRedesignScreen";
import {
  getChildAvatarGenderByKey,
  getChildAvatarPresetSources,
  type ChildAvatarPresetKey,
  type ChildCard,
} from "../features/children/model/childrenRedesign";
import { ChildrenRedesignScreen } from "../features/children/screens/ChildrenRedesignScreen";
import { FeedingHistoryScreen } from "../features/feeding/screens/FeedingHistoryScreen";
import { GrowthHistoryScreen } from "../features/growth/screens/GrowthHistoryScreen";
import { illnessAssets } from "../features/illness/assets";
import { IllnessActionPlaceholderScreen } from "../features/illness/screens/IllnessActionPlaceholderScreen";
import { IllnessJournalScreen } from "../features/illness/screens/IllnessJournalScreen";
import { IllnessOnboardingScreen } from "../features/illness/screens/IllnessOnboardingScreen";
import type {
  IllnessQuickActionKind,
  MobileIllnessObservation,
} from "../features/illness/model/illnessObservation";
import type { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import { JournalEntryScreen } from "../features/journal/screens/JournalEntryScreen";
import { LegalDocumentScreen } from "../features/legal/screens/LegalDocumentScreen";
import { MoreScreen } from "../features/more/screens/MoreScreen";
import { ChildOverviewScreen } from "../features/overview/screens/ChildOverviewScreen";
import { RootModulePlaceholderScreen } from "../shared/components/RootModulePlaceholderScreen";
import { SettingsScreen } from "../features/settings/screens/SettingsScreen";
import { SleepHistoryScreen } from "../features/sleep/screens/SleepHistoryScreen";
import { SupportScreen } from "../features/support/screens/SupportScreen";
import { WeightHistoryScreen } from "../features/weight/screens/WeightHistoryScreen";
import { AssetWarmupLayer } from "../shared/components/AssetWarmupLayer";
import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import type { MobileLocale } from "../shared/i18n/mobileI18n";
import type { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import {
  isChildProfileVisibleScreen,
  shouldRenderMoreTab,
  shouldShowAnalyticsBreakdown,
  type PillPathActiveScreen,
  type ChildProfileDestination,
} from "./pillPathExpoShellModel";

type RootTabContentProps = {
  locale: MobileLocale;
  activeRootTab: MobileBottomTabKey;
  authSession: MobileAuthSession | null;
  childrenCards: ChildCard[];
  selectedChildId: string;
  activeSleepStartedAtByCardId: Record<string, string | null>;
  activeFeedingStartedAtByCardId: Record<string, string | null>;
  activeObservationByCardId: Record<string, boolean>;
  onOpenChildProfile: (cardId: string) => void;
  onOpenChildCreate: () => void;
  onOpenRootJournalEntry: (cardId: string, kind: JournalEntryKind) => void;
  onOpenObservation: (cardId: string) => void;
  onSleepPress: (cardId: string) => void;
  onFeedingPress: (cardId: string) => void;
  onLogout: () => Promise<void>;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onOpenTermsOfUse: () => void;
  onOpenPrivacyPolicy: () => void;
  onUpdateAuthSession: (patch: {
    familyName?: string;
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => Promise<void>;
  screenLayerStyle: object;
};

export function RootTabContent({
  activeRootTab,
  authSession,
  childrenCards,
  selectedChildId,
  activeSleepStartedAtByCardId,
  activeFeedingStartedAtByCardId,
  activeObservationByCardId,
  onOpenChildCreate,
  onOpenChildProfile,
  onOpenRootJournalEntry,
  onOpenObservation,
  onSleepPress,
  onFeedingPress,
  onLogout,
  onOpenSettings,
  onOpenSupport,
  onOpenTermsOfUse,
  onOpenPrivacyPolicy,
  onUpdateAuthSession,
  screenLayerStyle,
}: RootTabContentProps) {
  const showMoreTab = shouldRenderMoreTab(activeRootTab, authSession);
  const placeholderTabKey =
    activeRootTab === "cabinet" ||
    activeRootTab === "pillbox" ||
    activeRootTab === "more"
      ? activeRootTab
      : null;

  return (
    <>
      <View
        pointerEvents={activeRootTab === "children" ? "auto" : "none"}
        style={[
          screenLayerStyle,
          activeRootTab === "children"
            ? tabLayerStyles.visible
            : tabLayerStyles.hidden,
        ]}
      >
        <ChildrenRedesignScreen
          cards={childrenCards}
          onOpenChildCreate={onOpenChildCreate}
          onOpenChildProfile={onOpenChildProfile}
          onOpenJournalEntry={onOpenRootJournalEntry}
          onOpenObservation={onOpenObservation}
          activeSleepStartedAtByCardId={activeSleepStartedAtByCardId}
          activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
          activeObservationByCardId={activeObservationByCardId}
          onSleepPress={onSleepPress}
          onFeedingPress={onFeedingPress}
        />
      </View>
      {authSession ? (
        <View
          pointerEvents={showMoreTab ? "auto" : "none"}
          style={[
            screenLayerStyle,
            showMoreTab ? tabLayerStyles.visible : tabLayerStyles.hidden,
          ]}
        >
          <MoreScreen
            session={authSession}
            onLogout={onLogout}
            onOpenSettings={onOpenSettings}
            onOpenSupport={onOpenSupport}
            onOpenTerms={onOpenTermsOfUse}
            onOpenPrivacy={onOpenPrivacyPolicy}
            onUpdateSession={onUpdateAuthSession}
          />
        </View>
      ) : null}
      <View
        pointerEvents={
          activeRootTab !== "children" && !showMoreTab ? "auto" : "none"
        }
        style={[
          screenLayerStyle,
          activeRootTab !== "children" && !showMoreTab
            ? tabLayerStyles.visible
            : tabLayerStyles.hidden,
        ]}
      >
        {placeholderTabKey ? (
          <RootModulePlaceholderScreen tabKey={placeholderTabKey} />
        ) : null}
      </View>
    </>
  );
}

const tabLayerStyles = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
} as const;

type OverlayScreensProps = {
  locale: MobileLocale;
  activeScreen: PillPathActiveScreen;
  childrenCards: ChildCard[];
  selectedChildId: string;
  selectedEpisode: AnalyticsEpisodeCard | null;
  selectedJournalKind: JournalEntryKind;
  selectedIllnessActionKind: IllnessQuickActionKind;
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  authSession: MobileAuthSession;
  childFlow: {
    onOpenChildCreate: () => void;
    onBackChildCreate: () => void;
    onSubmitChildCreate: (payload: {
      name: string;
      birthDate: string | null;
      avatarKey: string | null;
      gender: string | null;
      babyModeEnabled: boolean;
      weightKg: number | null;
      heightCm: number | null;
      allergies: string | null;
      notes: string | null;
    }) => Promise<void>;
    onBackChildProfile: () => void;
    onEditProfile: () => void;
    onOpenAnalytics: () => void;
    onOpenJournalEntry: (kind: ChildProfileDestination) => void;
    onBackEditProfile: () => void;
    onSubmitEditProfile: (payload: {
      name: string;
      birthDate: string | null;
      avatarKey: string | null;
      gender: string | null;
      babyModeEnabled: boolean;
      allergies: string | null;
      notes: string | null;
    }) => void | Promise<void>;
    onDeleteChild: () => void | Promise<void>;
    onBackAnalytics: () => void;
    onOpenEpisode: (episode: AnalyticsEpisodeCard) => void;
    onBackAnalyticsEpisode: () => void;
    onBackJournalEntry: () => void;
    onStartFeedingTimer: () => void;
    onBackFeedingHistory: () => void;
    onBackSleepHistory: () => void;
    onBackWeightHistory: () => void;
    onBackGrowthHistory: () => void;
    onBackOverview: () => void;
  };
  illnessFlow: {
    onStartIllnessObservation: (payload: {
      startedAt: string;
      reason: string;
    }) => void;
    onAddIllnessEntry: (childId: string, kind: IllnessQuickActionKind) => void;
    onFinishIllnessObservation: (childId: string) => void;
    selectedIllnessActionKind: IllnessQuickActionKind;
    onBackIllnessJournal: () => void;
    onBackIllnessActionPlaceholder: () => void;
    onBackIllnessOnboarding: () => void;
    onSelectTab: (key: MobileBottomTabKey) => void;
  };
  utilityFlow: {
    onSessionDeleted: () => Promise<void>;
    onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
    onBackPrivacyPolicy: () => void;
    onBackSupport: () => void;
    onBackSettings: () => void;
    onBackTermsOfUse: () => void;
  };
};

type SelectedChildOverlayProps = {
  activeScreen: PillPathActiveScreen;
  authSession: OverlayScreensProps["authSession"];
  childFlow: OverlayScreensProps["childFlow"];
  illnessFlow: OverlayScreensProps["illnessFlow"];
  selectedChild: ChildCard;
  selectedEpisode: AnalyticsEpisodeCard | null;
  selectedJournalKind: JournalEntryKind;
};

function SelectedChildOverlays({
  activeScreen,
  authSession,
  childFlow,
  illnessFlow,
  selectedChild,
  selectedEpisode,
  selectedJournalKind,
}: SelectedChildOverlayProps) {
  const lockedAvatarGender = getChildAvatarGenderByKey(
    selectedChild.child.avatarKey as ChildAvatarPresetKey | null,
  );
  const shouldWarmAvatarPicker =
    activeScreen === "childProfile" || activeScreen === "childProfileEdit";

  return (
    <>
      <AssetWarmupLayer
        active={shouldWarmAvatarPicker}
        assetModules={getChildAvatarPresetSources(lockedAvatarGender)}
      />
      <ChildProfileRedesignScreen
        child={selectedChild}
        visible={isChildProfileVisibleScreen(activeScreen)}
        onBack={childFlow.onBackChildProfile}
        onEditProfile={childFlow.onEditProfile}
        onOpenAnalytics={childFlow.onOpenAnalytics}
        onOpenJournalEntry={childFlow.onOpenJournalEntry}
      />
      <ChildProfileEditScreen
        key={`child-profile-edit-${selectedChild.nodeId}`}
        child={selectedChild}
        visible={activeScreen === "childProfileEdit"}
        onBack={childFlow.onBackEditProfile}
        onSave={childFlow.onSubmitEditProfile}
        onDelete={childFlow.onDeleteChild}
      />
      <AnalyticsScreen
        key={`analytics-${selectedChild.nodeId}`}
        child={selectedChild}
        authSession={authSession}
        visible={
          activeScreen === "analytics" || activeScreen === "analyticsBreakdown"
        }
        onBack={childFlow.onBackAnalytics}
        onOpenEpisode={childFlow.onOpenEpisode}
      />
      {selectedEpisode &&
      shouldShowAnalyticsBreakdown(activeScreen, selectedEpisode) ? (
        <AnalyticsBreakdownScreen
          key={`analytics-breakdown-${selectedChild.nodeId}-${selectedEpisode.id}`}
          child={selectedChild}
          authSession={authSession}
          episode={selectedEpisode}
          onBack={childFlow.onBackAnalyticsEpisode}
        />
      ) : null}
      <JournalEntryScreen
        kind={selectedJournalKind}
        visible={activeScreen === "journalEntry"}
        onBack={childFlow.onBackJournalEntry}
        onSwipeBack={childFlow.onBackJournalEntry}
        onStartTimer={childFlow.onStartFeedingTimer}
      />
      <FeedingHistoryScreen
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "feedingHistory"}
        onBack={childFlow.onBackFeedingHistory}
      />
      <SleepHistoryScreen
        key={`sleep-history-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "sleepHistory"}
        onBack={childFlow.onBackSleepHistory}
      />
      <WeightHistoryScreen
        key={`weight-history-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "weightHistory"}
        onBack={childFlow.onBackWeightHistory}
      />
      <GrowthHistoryScreen
        key={`growth-history-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "growthHistory"}
        onBack={childFlow.onBackGrowthHistory}
      />
      <ChildOverviewScreen
        key={`overview-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "overview"}
        onBack={childFlow.onBackOverview}
      />
      <IllnessOnboardingScreen
        child={selectedChild}
        visible={activeScreen === "illnessOnboarding"}
        onBack={illnessFlow.onBackIllnessOnboarding}
        onStartObservation={illnessFlow.onStartIllnessObservation}
      />
    </>
  );
}

type IllnessOverlayProps = {
  activeScreen: PillPathActiveScreen;
  childrenCards: ChildCard[];
  focusedChildId: string;
  selectedIllnessActionKind: IllnessQuickActionKind;
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  illnessFlow: OverlayScreensProps["illnessFlow"];
};

function IllnessOverlays({
  activeScreen,
  childrenCards,
  focusedChildId,
  selectedIllnessActionKind,
  observationsByChildId,
  illnessFlow,
}: IllnessOverlayProps) {
  const focusedChild =
    childrenCards.find((child) => child.nodeId === focusedChildId) ?? null;
  const shouldWarmIllnessJournalAssets =
    activeScreen === "illnessOnboarding" ||
    activeScreen === "illnessJournal" ||
    activeScreen === "illnessActionPlaceholder";

  return (
    <>
      <AssetWarmupLayer
        active={shouldWarmIllnessJournalAssets}
        assetModules={[
          illnessAssets.journal.quickTemperature,
          illnessAssets.journal.quickMedicine,
          illnessAssets.journal.quickNote,
          illnessAssets.journal.quickReminder,
        ]}
      />
      <IllnessJournalScreen
        children={childrenCards}
        observationsByChildId={observationsByChildId}
        focusedChildId={focusedChildId}
        visible={
          activeScreen === "illnessJournal" ||
          activeScreen === "illnessActionPlaceholder"
        }
        onAddEntry={illnessFlow.onAddIllnessEntry}
        onFinishObservation={illnessFlow.onFinishIllnessObservation}
        onOpenChildren={illnessFlow.onBackIllnessJournal}
        onSelectTab={illnessFlow.onSelectTab}
      />
      {focusedChild ? (
        <IllnessActionPlaceholderScreen
          key={`illness-action-${focusedChild.nodeId}-${selectedIllnessActionKind}`}
          child={focusedChild}
          kind={selectedIllnessActionKind}
          visible={activeScreen === "illnessActionPlaceholder"}
          onBack={illnessFlow.onBackIllnessActionPlaceholder}
        />
      ) : null}
    </>
  );
}

type UtilityOverlayProps = {
  activeScreen: PillPathActiveScreen;
  authSession: MobileAuthSession;
  utilityFlow: OverlayScreensProps["utilityFlow"];
};

function UtilityOverlays({
  activeScreen,
  authSession,
  utilityFlow,
}: UtilityOverlayProps) {
  return (
    <>
      <LegalDocumentScreen
        documentKey="privacy"
        visible={activeScreen === "privacyPolicy"}
        onBack={utilityFlow.onBackPrivacyPolicy}
      />
      <SupportScreen
        visible={activeScreen === "support"}
        onBack={utilityFlow.onBackSupport}
        session={authSession}
      />
      <SettingsScreen
        visible={activeScreen === "settings"}
        onBack={utilityFlow.onBackSettings}
        onSessionDeleted={utilityFlow.onSessionDeleted}
        session={authSession}
        onUpdatePreferredLanguage={utilityFlow.onUpdatePreferredLanguage}
      />
      <LegalDocumentScreen
        documentKey="terms"
        visible={activeScreen === "termsOfUse"}
        onBack={utilityFlow.onBackTermsOfUse}
      />
    </>
  );
}

export function OverlayScreens({
  activeScreen,
  childrenCards,
  selectedChildId,
  selectedEpisode,
  selectedJournalKind,
  selectedIllnessActionKind,
  observationsByChildId,
  authSession,
  childFlow,
  illnessFlow,
  utilityFlow,
}: OverlayScreensProps) {
  const selectedChild =
    childrenCards.find((card) => card.nodeId === selectedChildId) ?? null;

  return (
    <>
      <ChildCreateScreen
        visible={activeScreen === "childCreate"}
        onBack={childFlow.onBackChildCreate}
        onSubmit={childFlow.onSubmitChildCreate}
      />
      {selectedChild ? (
        <SelectedChildOverlays
          activeScreen={activeScreen}
          authSession={authSession}
          childFlow={childFlow}
          illnessFlow={illnessFlow}
          selectedChild={selectedChild}
          selectedEpisode={selectedEpisode}
          selectedJournalKind={selectedJournalKind}
        />
      ) : null}
      <IllnessOverlays
        activeScreen={activeScreen}
        childrenCards={childrenCards}
        focusedChildId={selectedChildId}
        selectedIllnessActionKind={selectedIllnessActionKind}
        observationsByChildId={observationsByChildId}
        illnessFlow={illnessFlow}
      />
      <UtilityOverlays
        activeScreen={activeScreen}
        authSession={authSession}
        utilityFlow={utilityFlow}
      />
    </>
  );
}
