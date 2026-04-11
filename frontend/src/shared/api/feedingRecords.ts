import { apiClient } from "./client";
import type { FeedingRecord } from "@shared/types/api";
import { toFeedingRecord } from "@shared/types/transform";

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
  const res = await apiClient.get<RawFeedingRecord[]>(`/feeding-records/child/${childId}`);
  return res.data.map(toFeedingRecord);
}

export async function fetchActiveFeedingRecordByChildId(
  childId: string
): Promise<FeedingRecord | null> {
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
