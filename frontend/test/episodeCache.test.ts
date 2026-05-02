import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import {
  setIllnessEpisodesForChild,
  upsertIllnessEpisodeForChild,
} from "../src/client/pages/child-illness/episodeCache.js";
import type { IllnessEpisode } from "../src/shared/types/api.js";

function makeEpisode(
  overrides: Partial<IllnessEpisode> & Pick<IllnessEpisode, "id" | "childId" | "status">
): IllnessEpisode {
  return {
    id: overrides.id,
    childId: overrides.childId,
    status: overrides.status,
    startedAt: overrides.startedAt ?? "2026-05-01T10:00:00.000Z",
    closedAt: overrides.closedAt ?? null,
    title: overrides.title ?? null,
    note: overrides.note ?? null,
    medicationMode: overrides.medicationMode ?? "guided",
    createdByAccountId: overrides.createdByAccountId ?? "account-1",
    notificationRecipientAccountIds: overrides.notificationRecipientAccountIds ?? [],
  } as IllnessEpisode;
}

test("setIllnessEpisodesForChild clears active illness cache when active episode closes", () => {
  const queryClient = new QueryClient();
  const childId = "child-1";
  const activeEpisode = makeEpisode({
    id: "episode-1",
    childId,
    status: "active",
  });

  queryClient.setQueryData(["illness-episodes", childId], [activeEpisode]);
  queryClient.setQueryData(["illness-episode-active", childId], activeEpisode);

  setIllnessEpisodesForChild(queryClient, childId, (current) =>
    current.map((episode) =>
      episode.id === activeEpisode.id
        ? {
            ...episode,
            status: "closed" as const,
            closedAt: "2026-05-01T11:00:00.000Z",
          }
        : episode
    )
  );

  assert.equal(queryClient.getQueryData(["illness-episode-active", childId]), null);
  assert.deepEqual(queryClient.getQueryData(["illness-episodes", childId]), [
    {
      ...activeEpisode,
      status: "closed",
      closedAt: "2026-05-01T11:00:00.000Z",
    },
  ]);
});

test("upsertIllnessEpisodeForChild replaces stale active cache with closed server payload", () => {
  const queryClient = new QueryClient();
  const childId = "child-2";
  const activeEpisode = makeEpisode({
    id: "episode-2",
    childId,
    status: "active",
  });
  const closedEpisode = makeEpisode({
    ...activeEpisode,
    status: "closed",
    closedAt: "2026-05-01T12:00:00.000Z",
  });

  queryClient.setQueryData(["illness-episodes", childId], [activeEpisode]);
  queryClient.setQueryData(["illness-episode-active", childId], activeEpisode);

  upsertIllnessEpisodeForChild(queryClient, childId, closedEpisode);

  assert.equal(queryClient.getQueryData(["illness-episode-active", childId]), null);
  assert.deepEqual(queryClient.getQueryData(["illness-episodes", childId]), [closedEpisode]);
});
