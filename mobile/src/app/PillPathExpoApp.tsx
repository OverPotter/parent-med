import { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AnalyticsScreen } from "../features/analytics/screens/AnalyticsScreen";
import { AnalyticsBreakdownScreen } from "../features/analytics/screens/AnalyticsBreakdownScreen";
import { ChildProfileEditScreen } from "../features/child-profile-edit/screens/ChildProfileEditScreen";
import { ChildProfileRedesignScreen } from "../features/child-profile/screens/ChildProfileRedesignScreen";
import { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import { FeedingHistoryScreen } from "../features/feeding/screens/FeedingHistoryScreen";
import { GrowthHistoryScreen } from "../features/growth/screens/GrowthHistoryScreen";
import { SleepHistoryScreen } from "../features/sleep/screens/SleepHistoryScreen";
import { WeightHistoryScreen } from "../features/weight/screens/WeightHistoryScreen";
import { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import { JournalEntryScreen } from "../features/journal/screens/JournalEntryScreen";
import { buildChildrenScreenContent } from "../features/children/model/childrenRedesign";
import { ChildrenRedesignScreen } from "../features/children/screens/ChildrenRedesignScreen";
import { MobileI18nProvider, useMobileI18n } from "../shared/i18n/mobileI18n";

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
  const [activeScreen, setActiveScreen] = useState<
    | "children"
    | "analytics"
    | "analyticsBreakdown"
    | "childProfile"
    | "childProfileEdit"
    | "feedingHistory"
    | "growthHistory"
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

  const selectedChild =
    childrenScreenContent.cards.find(
      (card) => card.nodeId === selectedChildId,
    ) ?? childrenScreenContent.cards[0];

  const handleOpenChildProfile = useCallback((cardId: string) => {
    setSelectedChildId(cardId);
    setActiveScreen("childProfile");
  }, []);

  const handleCloseChildProfile = useCallback(() => {
    setActiveScreen("children");
  }, []);

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

  const handleOpenJournalEntry = useCallback((kind: JournalEntryKind) => {
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
    setActiveScreen("childProfile");
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

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.screenLayer}>
        <ChildrenRedesignScreen onOpenChildProfile={handleOpenChildProfile} />
      </View>
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
              activeScreen === "sleepHistory" ||
              activeScreen === "weightHistory" ||
              activeScreen === "journalEntry"
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
          {activeScreen === "journalEntry" ? (
            <JournalEntryScreen
              child={selectedChild}
              kind={selectedJournalKind}
              onBack={handleCloseJournalEntry}
            />
          ) : null}
          {activeScreen === "feedingHistory" ? (
            <FeedingHistoryScreen
              child={selectedChild}
              onBack={handleCloseFeedingHistory}
            />
          ) : null}
          {activeScreen === "sleepHistory" ? (
            <SleepHistoryScreen
              child={selectedChild}
              onBack={handleCloseSleepHistory}
            />
          ) : null}
          {activeScreen === "weightHistory" ? (
            <WeightHistoryScreen
              child={selectedChild}
              onBack={handleCloseWeightHistory}
            />
          ) : null}
          {activeScreen === "growthHistory" ? (
            <GrowthHistoryScreen
              child={selectedChild}
              onBack={handleCloseGrowthHistory}
            />
          ) : null}
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
