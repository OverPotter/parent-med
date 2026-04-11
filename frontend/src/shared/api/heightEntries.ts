import { apiClient } from "./client";
import type { HeightEntry } from "@shared/types/api";
import { toHeightEntry } from "@shared/types/transform";

interface RawHeightEntry {
  id: string;
  child_id: string;
  value_cm: number;
  measured_at: string;
}

interface CreateHeightEntryPayload {
  child_id: string;
  value_cm: number;
  measured_at?: string;
}

export async function fetchLatestHeightEntryByChildId(
  childId: string
): Promise<HeightEntry | null> {
  const res = await apiClient.get<RawHeightEntry | null>(`/height-entries/child/${childId}/latest`);
  return res.data ? toHeightEntry(res.data) : null;
}

export async function fetchHeightEntriesByChildId(childId: string): Promise<HeightEntry[]> {
  const res = await apiClient.get<RawHeightEntry[]>("/height-entries", {
    params: { child_id: childId },
  });
  return res.data.map(toHeightEntry);
}

export async function createHeightEntry(payload: CreateHeightEntryPayload): Promise<HeightEntry> {
  const res = await apiClient.post<RawHeightEntry>("/height-entries", payload);
  return toHeightEntry(res.data);
}
