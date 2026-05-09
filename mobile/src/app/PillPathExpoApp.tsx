import { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AnalyticsScreen } from "../features/analytics/screens/AnalyticsScreen";
import { AnalyticsBreakdownScreen } from "../features/analytics/screens/AnalyticsBreakdownScreen";
import { AuthScreen } from "../features/auth/screens/AuthScreen";
import { ChildProfileEditScreen } from "../features/child-profile-edit/screens/ChildProfileEditScreen";
import { ChildProfileRedesignScreen } from "../features/child-profile/screens/ChildProfileRedesignScreen";
import { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import { FeedingHistoryScreen } from "../features/feeding/screens/FeedingHistoryScreen";
import { GrowthHistoryScreen } from "../features/growth/screens/GrowthHistoryScreen";
import { SleepHistoryScreen } from "../features/sleep/screens/SleepHistoryScreen";
import { WeightHistoryScreen } from "../features/weight/screens/WeightHistoryScreen";
import { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import { JournalEntryScreen } from "../features/journal/screens/JournalEntryScreen";
import { ChildOverviewScreen } from "../features/overview/screens/ChildOverviewScreen";
import { buildChildrenScreenContent } from "../features/children/model/childrenRedesign";
import { ChildrenRedesignScreen } from "../features/children/screens/ChildrenRedesignScreen";
import { MobileI18nProvider, useMobileI18n } from "../shared/i18n/mobileI18n";
import {
  MobileBottomTabBar,
  MobileBottomTabKey,
} from "../shared/components/MobileBottomTabBar";
import { RootModulePlaceholderScreen } from "../shared/components/RootModulePlaceholderScreen";

type ChildProfileDestination = JournalEntryKind | "overview";

export function PillPathExpoApp() {
  return (
    <MobileI18nProvider>
      <PillPathExpoShell />
    </MobileI18nProvider>
  );
}

function PillPathExpoShell() {
  const { locale } = useMobileI18n();
  const childrenScreenContent = buildChildrenScreenContent(locale);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRootTab, setActiveRootTab] = useState<MobileBottomTabKey>("children");
  const rootTabItems = buildChildrenScreenContent(locale, activeRootTab).tabs;
  const [activeScreen, setActiveScreen] = useState<
    | "children"
    | "analytics"
    | "analyticsBreakdown"
    | "childProfile"
    | "childProfileEdit"
    | "feedingHistory"
    | "growthHistory"
    | "overview"
    | "sleepHistory"
    | "weightHistory"
    | "journalEntry"
  >("children");
  const [selectedChildId, setSelectedChildId] = useState(
    childrenScreenContent.cards[0]?.nodeId ?? "",
  );
  const [selectedEpisode, setSelectedEpisode] =
    useState<AnalyticsEpisodeCard | null>(null);
  const [selectedJournalKind, setSelectedJournalKind] =
    useState<JournalEntryKind>("feeding");
  const [activeFeedingStartedAtByCardId, setActiveFeedingStartedAtByCardId] =
    useState<Record<string, string | null>>({});

  const selectedChild =
    childrenScreenContent.cards.find(
      (card) => card.nodeId === selectedChildId,
    ) ?? childrenScreenContent.cards[0];

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
    if (kind === "overview") {
      setActiveScreen("overview");
      return;
    }

    if (kind === "feeding") {
      setActiveScreen("feedingHistory");
      return;
    }

    if (kind === "sleep") {
      setActiveScreen("sleepHistory");
      return;
    }

    if (kind === "weight") {
      setActiveScreen("weightHistory");
      return;
    }

    if (kind === "height") {
      setActiveScreen("growthHistory");
      return;
    }

    setSelectedJournalKind(kind);
    setActiveScreen("journalEntry");
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

  const handleSelectRootTab = useCallback((key: MobileBottomTabKey) => {
    setActiveRootTab(key);
  }, []);

  const handleAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {activeRootTab === "children" ? (
        <View style={styles.screenLayer}>
          <ChildrenRedesignScreen
            onOpenChildProfile={handleOpenChildProfile}
            onOpenJournalEntry={handleOpenRootJournalEntry}
            activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
            onFeedingPress={handleFeedingPress}
          />
        </View>
      ) : (
        <View style={styles.screenLayer}>
          <RootModulePlaceholderScreen tabKey={activeRootTab} />
        </View>
      )}
      <MobileBottomTabBar items={rootTabItems} onSelectTab={handleSelectRootTab} />
      {selectedChild ? (
        <>
          <ChildProfileRedesignScreen
            child={selectedChild}
            visible={
              activeScreen === "childProfile" ||
              activeScreen === "childProfileEdit" ||
              activeScreen === "analytics" ||
              activeScreen === "analyticsBreakdown" ||
              activeScreen === "feedingHistory" ||
              activeScreen === "growthHistory" ||
              activeScreen === "overview" ||
              activeScreen === "sleepHistory" ||
              activeScreen === "weightHistory"
            }
            onBack={handleCloseChildProfile}
            onEditProfile={handleOpenEditProfile}
            onOpenAnalytics={handleOpenAnalytics}
            onOpenJournalEntry={handleOpenJournalEntry}
          />
          <ChildProfileEditScreen
            child={selectedChild}
            visible={activeScreen === "childProfileEdit"}
            onBack={handleCloseEditProfile}
          />
          {activeScreen === "analytics" ||
          activeScreen === "analyticsBreakdown" ? (
            <AnalyticsScreen
              visible={activeScreen === "analytics"}
              onBack={handleCloseAnalytics}
              onOpenEpisode={handleOpenAnalyticsEpisode}
            />
          ) : null}
          {activeScreen === "analyticsBreakdown" && selectedEpisode ? (
            <AnalyticsBreakdownScreen
              episode={selectedEpisode}
              onBack={handleCloseAnalyticsEpisode}
            />
          ) : null}
          <JournalEntryScreen
            kind={selectedJournalKind}
            visible={activeScreen === "journalEntry"}
            onBack={handleCloseJournalEntry}
            onSwipeBack={handleCloseJournalEntry}
            onStartTimer={handleStartFeedingTimer}
          />
          <FeedingHistoryScreen
            child={selectedChild}
            visible={activeScreen === "feedingHistory"}
            onBack={handleCloseFeedingHistory}
          />
          <SleepHistoryScreen
            child={selectedChild}
            visible={activeScreen === "sleepHistory"}
            onBack={handleCloseSleepHistory}
          />
          <WeightHistoryScreen
            child={selectedChild}
            visible={activeScreen === "weightHistory"}
            onBack={handleCloseWeightHistory}
          />
          <GrowthHistoryScreen
            child={selectedChild}
            visible={activeScreen === "growthHistory"}
            onBack={handleCloseGrowthHistory}
          />
          <ChildOverviewScreen
            child={selectedChild}
            visible={activeScreen === "overview"}
            onBack={handleCloseOverview}
          />
        </>
      ) : null}
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
