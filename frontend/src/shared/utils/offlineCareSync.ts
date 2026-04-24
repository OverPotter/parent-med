import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { createAdministrationEvent } from "@shared/api/administrationEvents";
import { createEpisodeMedicationPlan } from "@shared/api/episodeMedicationPlans";
import { startFeedingRecord, stopFeedingRecord } from "@shared/api/feedingRecords";
import { createIllnessComment } from "@shared/api/illnessComments";
import { createIllnessEpisode, updateIllnessEpisode } from "@shared/api/illnessEpisodes";
import { startSleepSession, stopSleepSession } from "@shared/api/sleepSessions";
import { createTemperatureEntry } from "@shared/api/temperatureEntries";
import type { FeedingRecord, IllnessEpisode, SleepSession } from "@shared/types/api";
import { appLog } from "@shared/utils/appLog";
import { getCurrentDeviceTimestampIso } from "@shared/utils/date";
import {
  clearOfflineOverride,
  clearOfflineTempServerId,
  getOfflineCareActions,
  getOfflineTempServerId,
  hasOfflineCareActions,
  queueOfflineFeedingStart,
  queueOfflineFeedingStop,
  queueOfflineIllnessStart,
  queueOfflineIllnessStop,
  queueOfflineSleepStart,
  queueOfflineSleepStop,
  removeOfflineAction,
  setOfflineTempServerId,
  type OfflineCareAction,
} from "@shared/utils/offlineCareState";
import { requestLiveActivityRefresh } from "@shared/utils/liveActivityRuntimeEvents";

function isOfflineLikeError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  const axiosError = error as AxiosError | undefined;
  const code = axiosError?.code ?? "";
  return !axiosError?.response && (code === "ERR_NETWORK" || code === "ECONNABORTED" || !code);
}

function isStaleOfflineIllnessStopError(action: OfflineCareAction, error: unknown): boolean {
  if (action.kind !== "illness" || action.op !== "stop") {
    return false;
  }
  const axiosError = error as AxiosError | undefined;
  return axiosError?.response?.status === 404;
}

function discardStaleOfflineAction(action: OfflineCareAction): void {
  removeOfflineAction(action.id);
  clearOfflineOverride(action.kind, action.childId);
  if (action.tempId) {
    clearOfflineTempServerId(action.tempId);
  }
}

function getOfflineIllnessStopTargetId(action: OfflineCareAction): string | null {
  if (action.kind !== "illness" || action.op !== "stop") {
    return null;
  }
  return action.serverId ?? action.tempId;
}

export async function startSleepSessionResilient(input: {
  childId: string;
  currentAccountId: string | null;
}): Promise<SleepSession> {
  try {
    return await startSleepSession(input.childId, {
      started_at: getCurrentDeviceTimestampIso(),
    });
  } catch (error) {
    if (!isOfflineLikeError(error)) {
      throw error;
    }
    return queueOfflineSleepStart(input);
  }
}

export async function stopSleepSessionResilient(input: {
  childId: string;
  sessionId: string;
}): Promise<SleepSession | null> {
  try {
    return await stopSleepSession(input.sessionId, {
      ended_at: getCurrentDeviceTimestampIso(),
    });
  } catch (error) {
    if (!isOfflineLikeError(error)) {
      throw error;
    }
    return queueOfflineSleepStop(input);
  }
}

export async function startFeedingRecordResilient(input: {
  childId: string;
  currentAccountId: string | null;
  payload: {
    feeding_type: "breast" | "formula";
    breast_side?: "left" | "right" | "both" | null;
    is_expressed?: boolean;
    formula_volume_ml?: number | null;
    note?: string | null;
  };
}): Promise<FeedingRecord> {
  try {
    const startedAt = getCurrentDeviceTimestampIso();
    return await startFeedingRecord({
      child_id: input.childId,
      ...input.payload,
      recorded_at: startedAt,
      started_at: startedAt,
    });
  } catch (error) {
    if (!isOfflineLikeError(error)) {
      throw error;
    }
    return queueOfflineFeedingStart(input);
  }
}

export async function stopFeedingRecordResilient(input: {
  childId: string;
  recordId: string;
  payload?: {
    formula_volume_ml?: number | null;
    note?: string | null;
  };
}): Promise<FeedingRecord | null> {
  try {
    return await stopFeedingRecord(input.recordId, {
      ended_at: getCurrentDeviceTimestampIso(),
      ...input.payload,
    });
  } catch (error) {
    if (!isOfflineLikeError(error)) {
      throw error;
    }
    return queueOfflineFeedingStop(input);
  }
}

export async function createIllnessEpisodeResilient(input: {
  childId: string;
  currentAccountId: string | null;
  payload: {
    started_at: string;
    title?: string | null;
    medication_mode: string;
    note?: string | null;
    member_account_ids?: string[];
    temperatures: Array<{ value_celsius: number }>;
    administrations: Array<{
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      amount: string;
    }>;
    comments: Array<{ text: string }>;
    medication_plans: Array<{
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      dose_amount: string;
      min_interval_minutes: number;
      max_doses_per_day?: number | null;
      weight_kg?: number | null;
      dose_mg_per_kg?: number | null;
      notes?: string | null;
    }>;
  };
}): Promise<IllnessEpisode> {
  try {
    const episode = await createIllnessEpisode({
      child_id: input.childId,
      started_at: input.payload.started_at,
      title: input.payload.title,
      medication_mode: input.payload.medication_mode,
      note: input.payload.note,
      member_account_ids: input.payload.member_account_ids,
    });

    await Promise.all([
      ...input.payload.temperatures.map((item) =>
        createTemperatureEntry({
          episode_id: episode.id,
          value_celsius: item.value_celsius,
          measured_at: getCurrentDeviceTimestampIso(),
        })
      ),
      ...input.payload.administrations.map((item) =>
        createAdministrationEvent({
          episode_id: episode.id,
          household_medicine_id: item.household_medicine_id,
          custom_medicine_name: item.custom_medicine_name,
          administered_at: getCurrentDeviceTimestampIso(),
          amount: item.amount,
        })
      ),
      ...input.payload.comments.map((item) =>
        createIllnessComment({
          episode_id: episode.id,
          text: item.text,
          created_at: getCurrentDeviceTimestampIso(),
        })
      ),
      ...input.payload.medication_plans.map((item) =>
        createEpisodeMedicationPlan({
          episode_id: episode.id,
          household_medicine_id: item.household_medicine_id,
          custom_medicine_name: item.custom_medicine_name,
          dose_amount: item.dose_amount,
          min_interval_minutes: item.min_interval_minutes,
          max_doses_per_day: item.max_doses_per_day ?? null,
          weight_kg: item.weight_kg ?? null,
          dose_mg_per_kg: item.dose_mg_per_kg ?? null,
          notes: item.notes ?? null,
        })
      ),
    ]);

    return episode;
  } catch (error) {
    if (!isOfflineLikeError(error)) {
      throw error;
    }
    return queueOfflineIllnessStart(input);
  }
}

export async function closeIllnessEpisodeResilient(input: {
  childId: string;
  episodeId: string;
}): Promise<IllnessEpisode | null> {
  try {
    return await updateIllnessEpisode(input.episodeId, {
      status: "closed",
      closed_at: getCurrentDeviceTimestampIso(),
    });
  } catch (error) {
    if (!isOfflineLikeError(error)) {
      throw error;
    }
    return queueOfflineIllnessStop(input);
  }
}

let flushPromise: Promise<boolean> | null = null;

async function flushAction(action: OfflineCareAction): Promise<void> {
  if (action.kind === "sleep" && action.op === "start") {
    const session = await startSleepSession(action.childId, {
      started_at: action.createdAt,
    });
    setOfflineTempServerId(action.tempId, session.id);
    removeOfflineAction(action.id);
    clearOfflineOverride("sleep", action.childId);
    clearOfflineTempServerId(action.tempId);
    return;
  }

  if (action.kind === "sleep" && action.op === "stop") {
    const resolvedId = action.serverId ?? getOfflineTempServerId(action.tempId);
    if (!resolvedId) {
      removeOfflineAction(action.id);
      clearOfflineOverride("sleep", action.childId);
      return;
    }
    await stopSleepSession(resolvedId, {
      ended_at: action.createdAt,
    });
    removeOfflineAction(action.id);
    clearOfflineOverride("sleep", action.childId);
    if (action.tempId) {
      clearOfflineTempServerId(action.tempId);
    }
    return;
  }

  if (action.kind === "feeding" && action.op === "start") {
    const feeding = await startFeedingRecord({
      child_id: action.childId,
      ...action.payload,
      recorded_at: action.createdAt,
      started_at: action.createdAt,
    });
    setOfflineTempServerId(action.tempId, feeding.id);
    removeOfflineAction(action.id);
    clearOfflineOverride("feeding", action.childId);
    clearOfflineTempServerId(action.tempId);
    return;
  }

  if (action.kind === "feeding" && action.op === "stop") {
    const resolvedId = action.serverId ?? getOfflineTempServerId(action.tempId);
    if (!resolvedId) {
      removeOfflineAction(action.id);
      clearOfflineOverride("feeding", action.childId);
      return;
    }
    await stopFeedingRecord(resolvedId, {
      ended_at: action.createdAt,
      ...(action.payload ?? {}),
    });
    removeOfflineAction(action.id);
    clearOfflineOverride("feeding", action.childId);
    if (action.tempId) {
      clearOfflineTempServerId(action.tempId);
    }
    return;
  }

  if (action.kind === "illness" && action.op === "start") {
    const episode = await createIllnessEpisode({
      child_id: action.childId,
      started_at: action.payload.started_at,
      title: action.payload.title,
      medication_mode: action.payload.medication_mode,
      note: action.payload.note,
      member_account_ids: action.payload.member_account_ids,
    });

    await Promise.all([
      ...action.payload.temperatures.map((item) =>
        createTemperatureEntry({
          episode_id: episode.id,
          value_celsius: item.value_celsius,
          measured_at: action.createdAt,
        })
      ),
      ...action.payload.administrations.map((item) =>
        createAdministrationEvent({
          episode_id: episode.id,
          household_medicine_id: item.household_medicine_id,
          custom_medicine_name: item.custom_medicine_name,
          administered_at: action.createdAt,
          amount: item.amount,
        })
      ),
      ...action.payload.comments.map((item) =>
        createIllnessComment({
          episode_id: episode.id,
          text: item.text,
          created_at: action.createdAt,
        })
      ),
      ...action.payload.medication_plans.map((item) =>
        createEpisodeMedicationPlan({
          episode_id: episode.id,
          household_medicine_id: item.household_medicine_id,
          custom_medicine_name: item.custom_medicine_name,
          dose_amount: item.dose_amount,
          min_interval_minutes: item.min_interval_minutes,
          max_doses_per_day: item.max_doses_per_day ?? null,
          weight_kg: item.weight_kg ?? null,
          dose_mg_per_kg: item.dose_mg_per_kg ?? null,
          notes: item.notes ?? null,
        })
      ),
    ]);

    setOfflineTempServerId(action.tempId, episode.id);
    removeOfflineAction(action.id);
    clearOfflineOverride("illness", action.childId);
    clearOfflineTempServerId(action.tempId);
    return;
  }

  if (action.kind === "illness" && action.op === "stop") {
    const resolvedId = action.serverId ?? getOfflineTempServerId(action.tempId);
    if (!resolvedId) {
      removeOfflineAction(action.id);
      clearOfflineOverride("illness", action.childId);
      return;
    }
    await updateIllnessEpisode(resolvedId, {
      status: "closed",
      closed_at: action.createdAt,
    });
    removeOfflineAction(action.id);
    clearOfflineOverride("illness", action.childId);
    if (action.tempId) {
      clearOfflineTempServerId(action.tempId);
    }
  }
}

export async function flushOfflineCareActions(): Promise<boolean> {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return false;
    }

    const actions = getOfflineCareActions();
    if (actions.length === 0) {
      return false;
    }

    let changed = false;
    for (const action of actions) {
      try {
        await flushAction(action);
        changed = true;
      } catch (error) {
        if (isOfflineLikeError(error)) {
          break;
        }
        if (isStaleOfflineIllnessStopError(action, error)) {
          appLog.warn("Discarding stale offline illness stop action after 404", {
            actionId: action.id,
            childId: action.childId,
            episodeId: getOfflineIllnessStopTargetId(action),
          });
          discardStaleOfflineAction(action);
          changed = true;
          continue;
        }
        appLog.error("Offline care action flush failed", error);
        break;
      }
    }
    return changed;
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function OfflineCareSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const refreshQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-session-active"] });
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["sleep-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["feeding-records"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
      requestLiveActivityRefresh();
    };

    const run = () => {
      void flushOfflineCareActions().then((changed) => {
        if (!cancelled && changed) {
          refreshQueries();
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasOfflineCareActions()) {
        run();
      }
    };

    run();
    window.addEventListener("online", run);
    window.addEventListener("pageshow", run);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("online", run);
      window.removeEventListener("pageshow", run);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  return null;
}
