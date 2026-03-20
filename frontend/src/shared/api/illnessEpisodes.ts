/**
 * Запросы к API: эпизоды болезни.
 */

import { apiClient } from "./client";
import type { IllnessEpisode } from "@shared/types/api";
import { toIllnessEpisode } from "@shared/types/transform";

interface RawIllnessEpisode {
  id: string;
  child_id: string;
  started_at: string;
  title: string | null;
  status: string;
  medication_mode: string;
  note: string | null;
  closed_at: string | null;
}

export async function fetchIllnessEpisodesByChildId(childId: string): Promise<IllnessEpisode[]> {
  const res = await apiClient.get<RawIllnessEpisode[]>("/illness-episodes", {
    params: { child_id: childId },
  });
  return (res.data ?? []).map(toIllnessEpisode);
}

export async function fetchActiveIllnessEpisodeByChildId(
  childId: string
): Promise<IllnessEpisode | null> {
  const res = await apiClient.get<RawIllnessEpisode | null>(
    `/illness-episodes/child/${childId}/active`
  );
  return res.data ? toIllnessEpisode(res.data) : null;
}

export async function fetchIllnessEpisode(id: string): Promise<IllnessEpisode> {
  const res = await apiClient.get<RawIllnessEpisode>(`/illness-episodes/${id}`);
  return toIllnessEpisode(res.data);
}

export async function createIllnessEpisode(body: {
  child_id: string;
  started_at: string;
  title?: string | null;
  medication_mode?: string;
  note?: string | null;
}): Promise<IllnessEpisode> {
  const res = await apiClient.post<RawIllnessEpisode>("/illness-episodes", body);
  return toIllnessEpisode(res.data);
}

export async function updateIllnessEpisode(
  id: string,
  body: {
    started_at?: string;
    title?: string | null;
    status?: string;
    medication_mode?: string;
    note?: string | null;
    closed_at?: string | null;
  }
): Promise<IllnessEpisode> {
  const res = await apiClient.patch<RawIllnessEpisode>(`/illness-episodes/${id}`, body);
  return toIllnessEpisode(res.data);
}

export async function deleteIllnessEpisode(id: string): Promise<void> {
  await apiClient.delete(`/illness-episodes/${id}`);
}
