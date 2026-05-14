import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import type { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import type { MobileIllnessObservation } from "../features/illness/model/illnessObservation";
import { type JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import { type MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import { openIllnessJournalRoot } from "./shellNavigation";
import {
  resolveJournalTargetScreen,
  type ChildProfileDestination,
  type PillPathActiveScreen,
} from "./pillPathExpoShellModel";

export function useShellChildFlowController({
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
