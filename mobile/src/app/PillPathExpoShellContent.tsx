import { View } from "react-native";
import { AnalyticsBreakdownScreen } from "../features/analytics/screens/AnalyticsBreakdownScreen";
import { AnalyticsScreen } from "../features/analytics/screens/AnalyticsScreen";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import { ChildProfileEditScreen } from "../features/child-profile-edit/screens/ChildProfileEditScreen";
import { ChildProfileRedesignScreen } from "../features/child-profile/screens/ChildProfileRedesignScreen";
import { buildChildrenScreenContent } from "../features/children/model/childrenRedesign";
import { ChildrenRedesignScreen } from "../features/children/screens/ChildrenRedesignScreen";
import { FeedingHistoryScreen } from "../features/feeding/screens/FeedingHistoryScreen";
import { GrowthHistoryScreen } from "../features/growth/screens/GrowthHistoryScreen";
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
import type { MobileLocale } from "../shared/i18n/mobileI18n";
import type { MobileBottomTabKey } from "../shared/components/MobileBottomTabBar";
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
  activeFeedingStartedAtByCardId: Record<string, string | null>;
  onOpenChildProfile: (cardId: string) => void;
  onOpenRootJournalEntry: (cardId: string, kind: JournalEntryKind) => void;
  onOpenObservation: (cardId: string) => void;
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

function MoreTabScreen({
  authSession,
  onLogout,
  onOpenSettings,
  onOpenSupport,
  onOpenTermsOfUse,
  onOpenPrivacyPolicy,
  onUpdateAuthSession,
  screenLayerStyle,
}: Pick<
  RootTabContentProps,
  | "authSession"
  | "onLogout"
  | "onOpenSettings"
  | "onOpenSupport"
  | "onOpenTermsOfUse"
  | "onOpenPrivacyPolicy"
  | "onUpdateAuthSession"
  | "screenLayerStyle"
>) {
  if (!authSession) {
    return null;
  }

  return (
    <View style={screenLayerStyle}>
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
  );
}

function ChildrenTabScreen({
  activeFeedingStartedAtByCardId,
  onOpenChildProfile,
  onOpenRootJournalEntry,
  onOpenObservation,
  onFeedingPress,
  screenLayerStyle,
}: Pick<
  RootTabContentProps,
  | "activeFeedingStartedAtByCardId"
  | "onOpenChildProfile"
  | "onOpenRootJournalEntry"
  | "onOpenObservation"
  | "onFeedingPress"
  | "screenLayerStyle"
>) {
  return (
    <View style={screenLayerStyle}>
      <ChildrenRedesignScreen
        onOpenChildProfile={onOpenChildProfile}
        onOpenJournalEntry={onOpenRootJournalEntry}
        onOpenObservation={onOpenObservation}
        activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
        onFeedingPress={onFeedingPress}
      />
    </View>
  );
}

export function RootTabContent({
  locale,
  activeRootTab,
  authSession,
  activeFeedingStartedAtByCardId,
  onOpenChildProfile,
  onOpenRootJournalEntry,
  onOpenObservation,
  onFeedingPress,
  onLogout,
  onOpenSettings,
  onOpenSupport,
  onOpenTermsOfUse,
  onOpenPrivacyPolicy,
  onUpdateAuthSession,
  screenLayerStyle,
}: RootTabContentProps) {
  if (shouldRenderMoreTab(activeRootTab, authSession) && authSession) {
    return (
      <MoreTabScreen
        authSession={authSession}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onOpenSupport={onOpenSupport}
        onOpenTermsOfUse={onOpenTermsOfUse}
        onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        onUpdateAuthSession={onUpdateAuthSession}
        screenLayerStyle={screenLayerStyle}
      />
    );
  }

  if (activeRootTab === "children") {
    return (
      <ChildrenTabScreen
        activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
        onOpenChildProfile={onOpenChildProfile}
        onOpenRootJournalEntry={onOpenRootJournalEntry}
        onOpenObservation={onOpenObservation}
        onFeedingPress={onFeedingPress}
        screenLayerStyle={screenLayerStyle}
      />
    );
  }

  return (
    <View style={screenLayerStyle}>
      <RootModulePlaceholderScreen tabKey={activeRootTab} />
    </View>
  );
}

type OverlayScreensProps = {
  locale: MobileLocale;
  activeScreen: PillPathActiveScreen;
  selectedChildId: string;
  selectedEpisode: AnalyticsEpisodeCard | null;
  selectedJournalKind: JournalEntryKind;
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  authSession: MobileAuthSession;
  childFlow: {
    onBackChildProfile: () => void;
    onEditProfile: () => void;
    onOpenAnalytics: () => void;
    onOpenJournalEntry: (kind: ChildProfileDestination) => void;
    onBackEditProfile: () => void;
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
    onBackIllnessJournal: () => void;
    onBackIllnessOnboarding: () => void;
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
  childFlow: OverlayScreensProps["childFlow"];
  illnessFlow: OverlayScreensProps["illnessFlow"];
  selectedChild: NonNullable<ReturnType<typeof buildChildrenScreenContent>["cards"][number]>;
  selectedEpisode: AnalyticsEpisodeCard | null;
  selectedJournalKind: JournalEntryKind;
};

function SelectedChildOverlays({
  activeScreen,
  childFlow,
  illnessFlow,
  selectedChild,
  selectedEpisode,
  selectedJournalKind,
}: SelectedChildOverlayProps) {
  return (
    <>
      <ChildProfileRedesignScreen
        child={selectedChild}
        visible={isChildProfileVisibleScreen(activeScreen)}
        onBack={childFlow.onBackChildProfile}
        onEditProfile={childFlow.onEditProfile}
        onOpenAnalytics={childFlow.onOpenAnalytics}
        onOpenJournalEntry={childFlow.onOpenJournalEntry}
      />
      <ChildProfileEditScreen
        child={selectedChild}
        visible={activeScreen === "childProfileEdit"}
        onBack={childFlow.onBackEditProfile}
      />
      {activeScreen === "analytics" || activeScreen === "analyticsBreakdown" ? (
        <AnalyticsScreen
          visible={activeScreen === "analytics"}
          onBack={childFlow.onBackAnalytics}
          onOpenEpisode={childFlow.onOpenEpisode}
        />
      ) : null}
      {selectedEpisode && shouldShowAnalyticsBreakdown(activeScreen, selectedEpisode) ? (
        <AnalyticsBreakdownScreen
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
        child={selectedChild}
        visible={activeScreen === "feedingHistory"}
        onBack={childFlow.onBackFeedingHistory}
      />
      <SleepHistoryScreen
        child={selectedChild}
        visible={activeScreen === "sleepHistory"}
        onBack={childFlow.onBackSleepHistory}
      />
      <WeightHistoryScreen
        child={selectedChild}
        visible={activeScreen === "weightHistory"}
        onBack={childFlow.onBackWeightHistory}
      />
      <GrowthHistoryScreen
        child={selectedChild}
        visible={activeScreen === "growthHistory"}
        onBack={childFlow.onBackGrowthHistory}
      />
      <ChildOverviewScreen
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
  childrenCards: ReturnType<typeof buildChildrenScreenContent>["cards"];
  focusedChildId: string;
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  illnessFlow: OverlayScreensProps["illnessFlow"];
};

function IllnessOverlays({
  activeScreen,
  childrenCards,
  focusedChildId,
  observationsByChildId,
  illnessFlow,
}: IllnessOverlayProps) {
  return (
    <IllnessJournalScreen
      children={childrenCards}
      observationsByChildId={observationsByChildId}
      focusedChildId={focusedChildId}
      visible={activeScreen === "illnessJournal"}
      onBack={illnessFlow.onBackIllnessJournal}
      onAddEntry={illnessFlow.onAddIllnessEntry}
      onFinishObservation={illnessFlow.onFinishIllnessObservation}
      onOpenChildren={illnessFlow.onBackIllnessJournal}
    />
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
  locale,
  activeScreen,
  selectedChildId,
  selectedEpisode,
  selectedJournalKind,
  observationsByChildId,
  authSession,
  childFlow,
  illnessFlow,
  utilityFlow,
}: OverlayScreensProps) {
  const childrenScreenContent = buildChildrenScreenContent(locale);
  const selectedChild =
    childrenScreenContent.cards.find((card) => card.nodeId === selectedChildId) ??
    childrenScreenContent.cards[0];

  return (
    <>
      {selectedChild ? (
        <SelectedChildOverlays
          activeScreen={activeScreen}
          childFlow={childFlow}
          illnessFlow={illnessFlow}
          selectedChild={selectedChild}
          selectedEpisode={selectedEpisode}
          selectedJournalKind={selectedJournalKind}
        />
      ) : null}
      <IllnessOverlays
        activeScreen={activeScreen}
        childrenCards={childrenScreenContent.cards}
        focusedChildId={selectedChildId}
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
