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

const illnessSummaryCache = new Map<string, MobileIllnessHistorySummary | null>();
const illnessEpisodesCache = new Map<string, MobileIllnessEpisode[] | null>();

export function resetAnalyticsScreenStateCache() {
  illnessSummaryCache.clear();
  illnessEpisodesCache.clear();
}

export async function prefetchAnalyticsScreenData(
  authSession: Pick<MobileAuthSession, "accessToken">,
  childId: string,
  periodId: AnalyticsPeriodOption["id"] = "halfYear",
) {
  const summaryCacheKey = `${childId}:${periodMap[periodId]}`;
  const episodesCacheKey = childId;

  const tasks: Promise<unknown>[] = [];

  if (!illnessSummaryCache.has(summaryCacheKey)) {
    tasks.push(
      fetchMobileIllnessHistorySummary(
        authSession,
        childId,
        periodMap[periodId],
      ).then((summary) => {
        illnessSummaryCache.set(summaryCacheKey, summary);
      }),
    );
  }

  if (!illnessEpisodesCache.has(episodesCacheKey)) {
    tasks.push(
      fetchMobileIllnessEpisodes(authSession, childId).then((episodes) => {
        illnessEpisodesCache.set(episodesCacheKey, episodes);
      }),
    );
  }

  if (tasks.length === 0) {
    return;
  }

  await Promise.allSettled(tasks);
}

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
  const childId = child.child.id;
  const [selectedPeriodId, setSelectedPeriodId] =
    useState<AnalyticsPeriodOption["id"]>("halfYear");
  const summaryCacheKey = `${childId}:${periodMap[selectedPeriodId]}`;
  const episodesCacheKey = childId;
  const [summary, setSummary] = useState<MobileIllnessHistorySummary | null>(
    () => illnessSummaryCache.get(summaryCacheKey) ?? null,
  );
  const [episodes, setEpisodes] = useState<MobileIllnessEpisode[] | null>(
    () => illnessEpisodesCache.get(episodesCacheKey) ?? null,
  );
  const [openSwipeEpisodeId, setOpenSwipeEpisodeId] = useState<string | null>(null);
  const [pendingDeleteEpisode, setPendingDeleteEpisode] =
    useState<AnalyticsEpisodeCard | null>(null);

  const loadSummary = useCallback(async () => {
    return fetchMobileIllnessHistorySummary(
      authSession,
      childId,
      periodMap[selectedPeriodId],
    );
  }, [authSession, childId, selectedPeriodId]);

  const loadEpisodes = useCallback(async () => {
    return fetchMobileIllnessEpisodes(authSession, childId);
  }, [authSession, childId]);

  useEffect(() => {
    setSelectedPeriodId("halfYear");
  }, [locale]);

  useEffect(() => {
    setSummary(illnessSummaryCache.get(summaryCacheKey) ?? null);
    setOpenSwipeEpisodeId(null);
    setPendingDeleteEpisode(null);
  }, [summaryCacheKey]);

  useEffect(() => {
    setEpisodes(illnessEpisodesCache.get(episodesCacheKey) ?? null);
    setOpenSwipeEpisodeId(null);
    setPendingDeleteEpisode(null);
  }, [episodesCacheKey]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const cachedSummary = illnessSummaryCache.get(summaryCacheKey);
    if (cachedSummary !== undefined) {
      setSummary(cachedSummary);
      return;
    }

    let cancelled = false;

    async function syncSummary() {
      try {
        const nextSummary = await loadSummary();

        if (cancelled) {
          return;
        }

        illnessSummaryCache.set(summaryCacheKey, nextSummary);
        setSummary(nextSummary);
      } catch {
        // Keep the previous summary on fetch failure to avoid visible UI flicker.
      }
    }

    void syncSummary();

    return () => {
      cancelled = true;
    };
  }, [loadSummary, summaryCacheKey, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const cachedEpisodes = illnessEpisodesCache.get(episodesCacheKey);
    if (cachedEpisodes !== undefined) {
      setEpisodes(cachedEpisodes);
      return;
    }

    let cancelled = false;

    async function syncEpisodes() {
      try {
        const nextEpisodes = await loadEpisodes();

        if (cancelled) {
          return;
        }

        illnessEpisodesCache.set(episodesCacheKey, nextEpisodes);
        setEpisodes(nextEpisodes);
      } catch {
        // Keep the previous episodes on fetch failure to avoid visible UI flicker.
      }
    }

    void syncEpisodes();

    return () => {
      cancelled = true;
    };
  }, [episodesCacheKey, loadEpisodes, visible]);

  const handleDeleteEpisode = useCallback(
    async (episodeId: string) => {
      await deleteMobileIllnessEpisode(authSession, episodeId);
      const [nextSummary, nextEpisodes] = await Promise.all([
        loadSummary(),
        loadEpisodes(),
      ]);
      illnessSummaryCache.set(summaryCacheKey, nextSummary);
      illnessEpisodesCache.set(episodesCacheKey, nextEpisodes);
      setSummary(nextSummary);
      setEpisodes(nextEpisodes);
      setOpenSwipeEpisodeId(null);
      setPendingDeleteEpisode(null);
    },
    [authSession, episodesCacheKey, loadEpisodes, loadSummary, summaryCacheKey],
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
