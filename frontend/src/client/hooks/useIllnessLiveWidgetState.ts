import { useSyncExternalStore } from "react";
import type { IllnessEpisode } from "@shared/types/api";
import {
  isIllnessLiveWidgetEnabled,
  subscribeIllnessLiveWidgetPreferences,
} from "@shared/utils/illnessLiveWidgetPreference";

type IllnessLiveWidgetEpisode = Pick<IllnessEpisode, "id" | "createdByAccountId"> | null | undefined;

export function useIllnessLiveWidgetState(
  episode: IllnessLiveWidgetEpisode,
  accountId?: string | null
) {
  return useSyncExternalStore(
    subscribeIllnessLiveWidgetPreferences,
    () => isIllnessLiveWidgetEnabled(episode, accountId),
    () => isIllnessLiveWidgetEnabled(episode, accountId)
  );
}
