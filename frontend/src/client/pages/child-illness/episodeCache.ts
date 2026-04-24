import type { QueryClient } from "@tanstack/react-query";
import type { IllnessEpisode } from "@shared/types/api";

export function getActiveEpisodeFromList(episodes: IllnessEpisode[] | null | undefined) {
  return (episodes ?? []).find((episode) => episode.status === "active") ?? null;
}

export function setIllnessEpisodesForChild(
  queryClient: QueryClient,
  childId: string,
  updater: (current: IllnessEpisode[]) => IllnessEpisode[]
) {
  let nextEpisodes: IllnessEpisode[] = [];

  queryClient.setQueryData<IllnessEpisode[]>(["illness-episodes", childId], (current) => {
    nextEpisodes = updater(current ?? []);
    return nextEpisodes;
  });

  queryClient.setQueryData(["illness-episode-active", childId], getActiveEpisodeFromList(nextEpisodes));
  return nextEpisodes;
}

export function upsertIllnessEpisodeForChild(
  queryClient: QueryClient,
  childId: string,
  episode: IllnessEpisode
) {
  return setIllnessEpisodesForChild(queryClient, childId, (current) => {
    if (current.some((item) => item.id === episode.id)) {
      return current.map((item) => (item.id === episode.id ? episode : item));
    }

    return [episode, ...current];
  });
}

export function invalidateIllnessQueriesForChild(queryClient: QueryClient, childId: string) {
  queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
  queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
  queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
  queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
  queryClient.invalidateQueries({ queryKey: ["children"] });
}
