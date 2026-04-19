/**
 * Запросы к API: записи температуры.
 */

import { apiClient } from "./client";
import type { TemperatureEntry } from "@shared/types/api";
import { toTemperatureEntry } from "@shared/types/transform";

interface RawTemperatureEntry {
  id: string;
  episode_id: string;
  value_celsius: number;
  measured_at: string;
  method: string | null;
  comment: string | null;
  created_by_account_id: string | null;
  created_by_name_snapshot: string | null;
}

export async function fetchTemperatureEntriesByEpisodeId(
  episodeId: string
): Promise<TemperatureEntry[]> {
  const res = await apiClient.get<RawTemperatureEntry[]>("/temperature-entries", {
    params: { episode_id: episodeId },
  });
  return (res.data ?? []).map(toTemperatureEntry);
}

export async function createTemperatureEntry(body: {
  episode_id: string;
  value_celsius: number;
  measured_at?: string | null;
  method?: string | null;
  comment?: string | null;
}): Promise<TemperatureEntry> {
  const res = await apiClient.post<RawTemperatureEntry>("/temperature-entries", body);
  return toTemperatureEntry(res.data);
}
