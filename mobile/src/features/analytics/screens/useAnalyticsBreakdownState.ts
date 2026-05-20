import { useEffect, useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  fetchMobileIllnessEpisodeInsights,
  type MobileIllnessEpisodeInsights,
} from "../../illness/api/illnessAnalyticsApi";

const illnessEpisodeInsightsCache = new Map<string, MobileIllnessEpisodeInsights | null>();

export function resetAnalyticsBreakdownStateCache() {
  illnessEpisodeInsightsCache.clear();
}

type UseAnalyticsBreakdownStateOptions = {
  authSession: Pick<MobileAuthSession, "accessToken">;
  episodeId: string;
};

export function useAnalyticsBreakdownState({
  authSession,
  episodeId,
}: UseAnalyticsBreakdownStateOptions) {
  const [insights, setInsights] = useState<MobileIllnessEpisodeInsights | null>(
    () => illnessEpisodeInsightsCache.get(episodeId) ?? null,
  );

  useEffect(() => {
    const cachedInsights = illnessEpisodeInsightsCache.get(episodeId);
    if (cachedInsights !== undefined) {
      setInsights(cachedInsights);
      return;
    }

    setInsights(null);

    let cancelled = false;

    async function loadInsights() {
      try {
        const nextInsights = await fetchMobileIllnessEpisodeInsights(
          authSession,
          episodeId,
        );

        if (!cancelled) {
          illnessEpisodeInsightsCache.set(episodeId, nextInsights);
          setInsights(nextInsights);
        }
      } catch {
        if (!cancelled) {
          setInsights(null);
        }
      }
    }

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, [authSession, episodeId]);

  return { insights };
}
