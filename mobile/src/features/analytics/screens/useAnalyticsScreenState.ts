import { useCallback, useEffect, useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { ChildCard } from "../../children/model/childrenRedesign";
import {
  deleteMobileIllnessEpisode,
  fetchMobileIllnessEpisodes,
  fetchMobileIllnessHistorySummary,
  type MobileIllnessEpisode,
  type MobileIllnessHistorySummary,
} from "../../illness/api/illnessAnalyticsApi";
import type { AnalyticsEpisodeCard, AnalyticsPeriodOption } from "../model/analyticsScreen";

const periodMap = {
  month: "month",
  quarter: "quarter",
  halfYear: "half_year",
  year: "year",
  allTime: "all",
} as const;

type UseAnalyticsScreenStateOptions = {
  authSession: Pick<MobileAuthSession, "accessToken">;
  child: ChildCard;
  locale: string;
  visible: boolean;
};

export function useAnalyticsScreenState({
  authSession,
  child,
  locale,
  visible,
}: UseAnalyticsScreenStateOptions) {
  const [selectedPeriodId, setSelectedPeriodId] =
    useState<AnalyticsPeriodOption["id"]>("halfYear");
  const [summary, setSummary] = useState<MobileIllnessHistorySummary | null>(null);
  const [episodes, setEpisodes] = useState<MobileIllnessEpisode[] | null>(null);
  const [openSwipeEpisodeId, setOpenSwipeEpisodeId] = useState<string | null>(null);
  const [pendingDeleteEpisode, setPendingDeleteEpisode] =
    useState<AnalyticsEpisodeCard | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    const [nextSummary, nextEpisodes] = await Promise.all([
      fetchMobileIllnessHistorySummary(
        authSession,
        child.child.id,
        periodMap[selectedPeriodId],
      ),
      fetchMobileIllnessEpisodes(authSession, child.child.id),
    ]);

    return { nextSummary, nextEpisodes };
  }, [authSession, child.child.id, selectedPeriodId]);

  useEffect(() => {
    setSelectedPeriodId("halfYear");
  }, [locale]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    async function syncAnalytics() {
      try {
        const { nextSummary, nextEpisodes } = await loadAnalyticsData();

        if (cancelled) {
          return;
        }

        setSummary(nextSummary);
        setEpisodes(nextEpisodes);
      } catch {
        if (!cancelled) {
          setSummary(null);
          setEpisodes(null);
        }
      }
    }

    void syncAnalytics();

    return () => {
      cancelled = true;
    };
  }, [loadAnalyticsData, visible]);

  const handleDeleteEpisode = useCallback(
    async (episodeId: string) => {
      await deleteMobileIllnessEpisode(authSession, episodeId);
      const { nextSummary, nextEpisodes } = await loadAnalyticsData();
      setSummary(nextSummary);
      setEpisodes(nextEpisodes);
      setOpenSwipeEpisodeId(null);
      setPendingDeleteEpisode(null);
    },
    [authSession, loadAnalyticsData],
  );

  const handleCloseDeleteDialog = useCallback(() => {
    setPendingDeleteEpisode(null);
    setOpenSwipeEpisodeId(null);
  }, []);

  const handleRequestDeleteEpisode = useCallback((episode: AnalyticsEpisodeCard) => {
    setOpenSwipeEpisodeId(episode.id);
    setPendingDeleteEpisode(episode);
  }, []);

  return {
    selectedPeriodId,
    setSelectedPeriodId,
    summary,
    episodes,
    openSwipeEpisodeId,
    setOpenSwipeEpisodeId,
    pendingDeleteEpisode,
    handleDeleteEpisode,
    handleCloseDeleteDialog,
    handleRequestDeleteEpisode,
  };
}
