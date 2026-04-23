import { apiClient } from "./client.js";
import type { FeedingRecord } from "../types/api.js";
import { toFeedingRecord } from "../types/transform.js";
import { getOfflineFeedingOverride } from "../utils/offlineCareState.js";

interface RawFeedingRecord {
  id: string;
  child_id: string;
  feeding_type: string;
  breast_side: string | null;
  is_expressed: boolean;
  formula_volume_ml: number | null;
  recorded_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  note: string | null;
  created_by_account_id: string | null;
}

type FeedingType = "breast" | "formula";
type BreastSide = "left" | "right" | "both";

export async function fetchFeedingRecordsByChildId(childId: string): Promise<FeedingRecord[]> {
  const offline = getOfflineFeedingOverride(childId);
  try {
    const res = await apiClient.get<RawFeedingRecord[]>(`/feeding-records/child/${childId}`);
    const items = res.data.map(toFeedingRecord);
    if (!offline.hasOverride || !offline.value) {
      return items;
    }
    return items.some((item) => item.id === offline.value?.id) ? items : [offline.value, ...items];
  } catch (error) {
    if (offline.hasOverride && offline.value) {
      return [offline.value];
    }
    throw error;
  }
}

export async function fetchActiveFeedingRecordByChildId(
  childId: string
): Promise<FeedingRecord | null> {
  const offline = getOfflineFeedingOverride(childId);
  if (offline.hasOverride) {
    return offline.value;
  }
  const res = await apiClient.get<RawFeedingRecord | null>(`/feeding-records/child/${childId}/active`);
  return res.data ? toFeedingRecord(res.data) : null;
}

export async function createFeedingRecord(payload: {
  child_id: string;
  feeding_type: FeedingType;
  breast_side?: BreastSide | null;
  is_expressed?: boolean;
  formula_volume_ml?: number | null;
  recorded_at?: string | null;
  duration_minutes?: number | null;
  note?: string | null;
}): Promise<FeedingRecord> {
  const res = await apiClient.post<RawFeedingRecord>("/feeding-records", payload);
  return toFeedingRecord(res.data);
}

export async function startFeedingRecord(payload: {
  child_id: string;
  feeding_type: FeedingType;
  breast_side?: BreastSide | null;
  is_expressed?: boolean;
  formula_volume_ml?: number | null;
  note?: string | null;
}): Promise<FeedingRecord> {
  const res = await apiClient.post<RawFeedingRecord>("/feeding-records/start", payload);
  return toFeedingRecord(res.data);
}

export async function stopFeedingRecord(
  recordId: string,
  payload?: {
    formula_volume_ml?: number | null;
    note?: string | null;
  }
): Promise<FeedingRecord> {
  const res = await apiClient.post<RawFeedingRecord>(
    `/feeding-records/${recordId}/stop`,
    payload ?? {}
  );
  return toFeedingRecord(res.data);
}

export async function deleteFeedingRecord(recordId: string): Promise<void> {
  await apiClient.delete(`/feeding-records/${recordId}`);
}
