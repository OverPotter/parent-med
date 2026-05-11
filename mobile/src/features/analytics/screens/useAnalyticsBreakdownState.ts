import { useEffect, useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  fetchMobileIllnessEpisodeInsights,
  type MobileIllnessEpisodeInsights,
} from "../../illness/api/illnessAnalyticsApi";

type UseAnalyticsBreakdownStateOptions = {
  authSession: Pick<MobileAuthSession, "accessToken">;
  episodeId: string;
};

export function useAnalyticsBreakdownState({
  authSession,
  episodeId,
}: UseAnalyticsBreakdownStateOptions) {
  const [insights, setInsights] = useState<MobileIllnessEpisodeInsights | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      try {
        const nextInsights = await fetchMobileIllnessEpisodeInsights(
          authSession,
          episodeId,
        );

        if (!cancelled) {
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
