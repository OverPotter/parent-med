/**
 * Запросы к API: приёмы лекарств (с проверкой Safety Engine на бэке).
 */

import { apiClient } from "./client";
import type { AdministrationEvent } from "@shared/types/api";
import { toAdministrationEvent } from "@shared/types/transform";

interface RawAdministrationEvent {
  id: string;
  episode_id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  administered_at: string;
  administered_by_account_id: string | null;
  administered_by_name_snapshot: string | null;
  amount: string;
  unit: string | null;
  reason: string | null;
}

export async function fetchAdministrationEventsByEpisodeId(
  episodeId: string
): Promise<AdministrationEvent[]> {
  const res = await apiClient.get<RawAdministrationEvent[]>("/administration-events", {
    params: { episode_id: episodeId },
  });
  return (res.data ?? []).map(toAdministrationEvent);
}

export async function createAdministrationEvent(body: {
  episode_id: string;
  household_medicine_id?: string | null;
  custom_medicine_name?: string | null;
  administered_at?: string | null;
  amount: string;
  unit?: string | null;
  reason?: string | null;
}): Promise<AdministrationEvent> {
  const res = await apiClient.post<RawAdministrationEvent>("/administration-events", body);
  return toAdministrationEvent(res.data);
}

export async function deleteAdministrationEvent(id: string): Promise<void> {
  await apiClient.delete(`/administration-events/${id}`);
}
