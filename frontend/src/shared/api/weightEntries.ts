/**
 * Запросы к API: вес ребёнка.
 */

import { apiClient } from "./client";
import type { WeightEntry } from "@shared/types/api";
import { toWeightEntry } from "@shared/types/transform";

interface RawWeightEntry {
  id: string;
  child_id: string;
  value_kg: number;
  measured_at: string;
}

interface CreateWeightEntryPayload {
  child_id: string;
  value_kg: number;
  measured_at?: string;
}

export async function fetchLatestWeightEntryByChildId(
  childId: string
): Promise<WeightEntry | null> {
  const res = await apiClient.get<RawWeightEntry | null>(`/weight-entries/child/${childId}/latest`);
  return res.data ? toWeightEntry(res.data) : null;
}

export async function fetchWeightEntriesByChildId(childId: string): Promise<WeightEntry[]> {
  const res = await apiClient.get<RawWeightEntry[]>("/weight-entries", {
    params: { child_id: childId },
  });
  return res.data.map(toWeightEntry);
}

export async function createWeightEntry(payload: CreateWeightEntryPayload): Promise<WeightEntry> {
  const res = await apiClient.post<RawWeightEntry>("/weight-entries", payload);
  return toWeightEntry(res.data);
}
