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
  locale,
  activeRootTab,
  authSession,
  activeFeedingStartedAtByCardId,
  onOpenChildProfile,
  onOpenRootJournalEntry,
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

  if (activeRootTab === "children") {
    return (
      <View style={screenLayerStyle}>
        <ChildrenRedesignScreen
          onOpenChildProfile={onOpenChildProfile}
          onOpenJournalEntry={onOpenRootJournalEntry}
          activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
          onFeedingPress={onFeedingPress}
        />
      </View>
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
  authSession: MobileAuthSession;
  onSessionDeleted: () => Promise<void>;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
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
  onBackPrivacyPolicy: () => void;
  onBackSupport: () => void;
  onBackSettings: () => void;
  onBackTermsOfUse: () => void;
};

export function OverlayScreens({
  locale,
  activeScreen,
  selectedChildId,
  selectedEpisode,
  selectedJournalKind,
  authSession,
  onSessionDeleted,
  onUpdatePreferredLanguage,
  onBackChildProfile,
  onEditProfile,
  onOpenAnalytics,
  onOpenJournalEntry,
  onBackEditProfile,
  onBackAnalytics,
  onOpenEpisode,
  onBackAnalyticsEpisode,
  onBackJournalEntry,
  onStartFeedingTimer,
  onBackFeedingHistory,
  onBackSleepHistory,
  onBackWeightHistory,
  onBackGrowthHistory,
  onBackOverview,
  onBackPrivacyPolicy,
  onBackSupport,
  onBackSettings,
  onBackTermsOfUse,
}: OverlayScreensProps) {
  const childrenScreenContent = buildChildrenScreenContent(locale);
  const selectedChild =
    childrenScreenContent.cards.find((card) => card.nodeId === selectedChildId) ??
    childrenScreenContent.cards[0];

  return (
    <>
      {selectedChild ? (
        <>
          <ChildProfileRedesignScreen
            child={selectedChild}
            visible={isChildProfileVisibleScreen(activeScreen)}
            onBack={onBackChildProfile}
            onEditProfile={onEditProfile}
            onOpenAnalytics={onOpenAnalytics}
            onOpenJournalEntry={onOpenJournalEntry}
          />
          <ChildProfileEditScreen
            child={selectedChild}
            visible={activeScreen === "childProfileEdit"}
            onBack={onBackEditProfile}
          />
          {activeScreen === "analytics" || activeScreen === "analyticsBreakdown" ? (
            <AnalyticsScreen
              visible={activeScreen === "analytics"}
              onBack={onBackAnalytics}
              onOpenEpisode={onOpenEpisode}
            />
          ) : null}
          {selectedEpisode && shouldShowAnalyticsBreakdown(activeScreen, selectedEpisode) ? (
            <AnalyticsBreakdownScreen
              episode={selectedEpisode}
              onBack={onBackAnalyticsEpisode}
            />
          ) : null}
          <JournalEntryScreen
            kind={selectedJournalKind}
            visible={activeScreen === "journalEntry"}
            onBack={onBackJournalEntry}
            onSwipeBack={onBackJournalEntry}
            onStartTimer={onStartFeedingTimer}
          />
          <FeedingHistoryScreen
            child={selectedChild}
            visible={activeScreen === "feedingHistory"}
            onBack={onBackFeedingHistory}
          />
          <SleepHistoryScreen
            child={selectedChild}
            visible={activeScreen === "sleepHistory"}
            onBack={onBackSleepHistory}
          />
          <WeightHistoryScreen
            child={selectedChild}
            visible={activeScreen === "weightHistory"}
            onBack={onBackWeightHistory}
          />
          <GrowthHistoryScreen
            child={selectedChild}
            visible={activeScreen === "growthHistory"}
            onBack={onBackGrowthHistory}
          />
          <ChildOverviewScreen
            child={selectedChild}
            visible={activeScreen === "overview"}
            onBack={onBackOverview}
          />
        </>
      ) : null}
      <LegalDocumentScreen
        documentKey="privacy"
        visible={activeScreen === "privacyPolicy"}
        onBack={onBackPrivacyPolicy}
      />
      <SupportScreen
        visible={activeScreen === "support"}
        onBack={onBackSupport}
        session={authSession}
      />
      <SettingsScreen
        visible={activeScreen === "settings"}
        onBack={onBackSettings}
        onSessionDeleted={onSessionDeleted}
        session={authSession}
        onUpdatePreferredLanguage={onUpdatePreferredLanguage}
      />
      <LegalDocumentScreen
        documentKey="terms"
        visible={activeScreen === "termsOfUse"}
        onBack={onBackTermsOfUse}
      />
    </>
  );
}
