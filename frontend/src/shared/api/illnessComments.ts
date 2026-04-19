/**
 * Запросы к API: комментарии эпизода болезни.
 */

import { apiClient } from "./client";
import type { IllnessComment } from "@shared/types/api";
import { toIllnessComment } from "@shared/types/transform";

interface RawIllnessComment {
  id: string;
  episode_id: string;
  created_at: string;
  text: string;
  created_by_account_id: string | null;
  created_by_name_snapshot: string | null;
}

export async function fetchIllnessCommentsByEpisodeId(
  episodeId: string
): Promise<IllnessComment[]> {
  const res = await apiClient.get<RawIllnessComment[]>("/illness-comments", {
    params: { episode_id: episodeId },
  });
  return (res.data ?? []).map(toIllnessComment);
}

export async function createIllnessComment(body: {
  episode_id: string;
  text: string;
  created_at?: string | null;
}): Promise<IllnessComment> {
  const res = await apiClient.post<RawIllnessComment>("/illness-comments", body);
  return toIllnessComment(res.data);
}
