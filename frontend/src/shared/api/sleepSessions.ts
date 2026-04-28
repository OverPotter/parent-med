import { apiClient } from "./client.js";
import type { SleepSession } from "../types/api.js";
import { toSleepSession } from "../types/transform.js";
import { getOfflineSleepOverride } from "../utils/offlineCareState.js";

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
  const offline = getOfflineSleepOverride(childId);
  if (offline.hasOverride) {
    return offline.value;
  }
  const res = await apiClient.get<RawSleepSession | null>(
    `/sleep-sessions/child/${childId}/active`
  );
  return res.data ? toSleepSession(res.data) : null;
}

export async function fetchSleepSessionsByChildId(childId: string): Promise<SleepSession[]> {
  const offline = getOfflineSleepOverride(childId);
  try {
    const res = await apiClient.get<RawSleepSession[]>(`/sleep-sessions/child/${childId}`);
    const items = res.data.map(toSleepSession);
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

export async function startSleepSession(
  childId: string,
  payload?: { started_at?: string | null }
): Promise<SleepSession> {
  const res = await apiClient.post<RawSleepSession>("/sleep-sessions", {
    child_id: childId,
    ...(payload?.started_at ? { started_at: payload.started_at } : {}),
  });
  return toSleepSession(res.data);
}

export async function stopSleepSession(
  sessionId: string,
  payload?: { ended_at?: string | null }
): Promise<SleepSession> {
  const res = await apiClient.post<RawSleepSession>(
    `/sleep-sessions/${sessionId}/stop`,
    payload ?? {}
  );
  return toSleepSession(res.data);
}

export async function deleteSleepSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/sleep-sessions/${sessionId}`);
}
