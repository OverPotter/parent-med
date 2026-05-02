import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { requestLiveActivityRefresh } from "@shared/utils/liveActivityRuntimeEvents";
import type { IllnessEpisode } from "@shared/types/api";
import {
  isIllnessLiveWidgetEnabled,
  setIllnessLiveWidgetEnabled,
} from "@shared/utils/illnessLiveWidgetPreference";

type ToggleInput = Pick<IllnessEpisode, "id" | "childId" | "createdByAccountId">;

export function useIllnessLiveObservationToggle({
  accountId,
  navigateOnSuccess,
}: {
  accountId?: string | null;
  navigateOnSuccess?: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (episode: ToggleInput) => {
      if (!accountId) {
        return episode;
      }

      const nextEnabled = !isIllnessLiveWidgetEnabled(episode, accountId);
      setIllnessLiveWidgetEnabled({
        episodeId: episode.id,
        accountId,
        enabled: nextEnabled,
      });
      return episode;
    },
    onSuccess: (episode) => {
      void queryClient.invalidateQueries({ queryKey: ["illness-episode-active", episode.childId] });
      requestLiveActivityRefresh();
      if (navigateOnSuccess) {
        navigate(`/children/${episode.childId}/illness`);
      }
    },
  });

  return {
    toggleLiveObservation: mutation.mutate,
    isPending: mutation.isPending,
    isLiveObservationEnabled: (episode?: ToggleInput | null) =>
      isIllnessLiveWidgetEnabled(episode, accountId),
    isTogglingEpisode: (episodeId?: string | null) =>
      mutation.isPending && mutation.variables?.id === episodeId,
  };
}
