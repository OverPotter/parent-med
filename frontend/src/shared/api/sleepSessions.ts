import { apiClient } from "./client";
import type { SleepSession } from "@shared/types/api";
import { toSleepSession } from "@shared/types/transform";

interface RawSleepSession {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  created_by_account_id: string | null;
}

export async function fetchActiveSleepSessionByChildId(
  childId: string
): Promise<SleepSession | null> {
  const res = await apiClient.get<RawSleepSession | null>(`/sleep-sessions/child/${childId}/active`);
  return res.data ? toSleepSession(res.data) : null;
}

export async function fetchSleepSessionsByChildId(childId: string): Promise<SleepSession[]> {
  const res = await apiClient.get<RawSleepSession[]>(`/sleep-sessions/child/${childId}`);
  return res.data.map(toSleepSession);
}

export async function startSleepSession(childId: string): Promise<SleepSession> {
  const res = await apiClient.post<RawSleepSession>("/sleep-sessions", { child_id: childId });
  return toSleepSession(res.data);
}

export async function stopSleepSession(sessionId: string): Promise<SleepSession> {
  const res = await apiClient.post<RawSleepSession>(`/sleep-sessions/${sessionId}/stop`, {});
  return toSleepSession(res.data);
}

export async function deleteSleepSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/sleep-sessions/${sessionId}`);
}
