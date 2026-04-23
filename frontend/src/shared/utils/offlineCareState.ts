import type { FeedingRecord, IllnessEpisode, SleepSession } from "../types/api.js";

const OFFLINE_CARE_STORAGE_KEY = "pillpath-offline-care-v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

type SleepStartAction = {
  id: string;
  kind: "sleep";
  op: "start";
  childId: string;
  tempId: string;
  createdAt: string;
  currentAccountId: string | null;
};

type SleepStopAction = {
  id: string;
  kind: "sleep";
  op: "stop";
  childId: string;
  tempId: string | null;
  serverId: string | null;
  createdAt: string;
};

type FeedingStartAction = {
  id: string;
  kind: "feeding";
  op: "start";
  childId: string;
  tempId: string;
  createdAt: string;
  currentAccountId: string | null;
  payload: {
    feeding_type: "breast" | "formula";
    breast_side?: "left" | "right" | "both" | null;
    is_expressed?: boolean;
    formula_volume_ml?: number | null;
    note?: string | null;
  };
};

type FeedingStopAction = {
  id: string;
  kind: "feeding";
  op: "stop";
  childId: string;
  tempId: string | null;
  serverId: string | null;
  createdAt: string;
  payload: {
    formula_volume_ml?: number | null;
    note?: string | null;
  } | null;
};

type IllnessStartAction = {
  id: string;
  kind: "illness";
  op: "start";
  childId: string;
  tempId: string;
  createdAt: string;
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
};

type IllnessStopAction = {
  id: string;
  kind: "illness";
  op: "stop";
  childId: string;
  tempId: string | null;
  serverId: string | null;
  createdAt: string;
};

export type OfflineCareAction =
  | SleepStartAction
  | SleepStopAction
  | FeedingStartAction
  | FeedingStopAction
  | IllnessStartAction
  | IllnessStopAction;

type ActiveOverrides = {
  sleep: Record<string, SleepSession | null | undefined>;
  feeding: Record<string, FeedingRecord | null | undefined>;
  illness: Record<string, IllnessEpisode | null | undefined>;
};

type OfflineCareState = {
  version: 1;
  actions: OfflineCareAction[];
  active: ActiveOverrides;
  tempToServerId: Record<string, string>;
};

const emptyState = (): OfflineCareState => ({
  version: 1,
  actions: [],
  active: { sleep: {}, feeding: {}, illness: {} },
  tempToServerId: {},
});

function hasWindow(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as { window?: unknown }).window !== "undefined";
}

function getStorage(): StorageLike | null {
  if (!hasWindow()) {
    return null;
  }
  const host = globalThis as { window?: { localStorage?: StorageLike } };
  return host.window?.localStorage ?? null;
}

function readState(): OfflineCareState {
  if (!hasWindow()) {
    return emptyState();
  }

  try {
    const raw = getStorage()?.getItem(OFFLINE_CARE_STORAGE_KEY) ?? null;
    if (!raw) {
      return emptyState();
    }
    const parsed = JSON.parse(raw) as Partial<OfflineCareState> | null;
    if (!parsed || parsed.version !== 1) {
      return emptyState();
    }
    return {
      version: 1,
      actions: Array.isArray(parsed.actions) ? (parsed.actions as OfflineCareAction[]) : [],
      active: {
        sleep: parsed.active?.sleep ?? {},
        feeding: parsed.active?.feeding ?? {},
        illness: parsed.active?.illness ?? {},
      },
      tempToServerId: parsed.tempToServerId ?? {},
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: OfflineCareState): void {
  if (!hasWindow()) {
    return;
  }
  getStorage()?.setItem(OFFLINE_CARE_STORAGE_KEY, JSON.stringify(state));
}

function updateState(mutator: (state: OfflineCareState) => void): OfflineCareState {
  const state = readState();
  mutator(state);
  writeState(state);
  return state;
}

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

function hasOwn<K extends string, V>(record: Record<K, V>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export function getOfflineCareActions(): OfflineCareAction[] {
  return readState().actions;
}

export function hasOfflineCareActions(): boolean {
  return readState().actions.length > 0;
}

export function getOfflineSleepOverride(childId: string): {
  hasOverride: boolean;
  value: SleepSession | null;
} {
  const state = readState();
  if (!hasOwn(state.active.sleep, childId)) {
    return { hasOverride: false, value: null };
  }
  return { hasOverride: true, value: state.active.sleep[childId] ?? null };
}

export function getOfflineFeedingOverride(childId: string): {
  hasOverride: boolean;
  value: FeedingRecord | null;
} {
  const state = readState();
  if (!hasOwn(state.active.feeding, childId)) {
    return { hasOverride: false, value: null };
  }
  return { hasOverride: true, value: state.active.feeding[childId] ?? null };
}

export function getOfflineIllnessOverride(childId: string): {
  hasOverride: boolean;
  value: IllnessEpisode | null;
} {
  const state = readState();
  if (!hasOwn(state.active.illness, childId)) {
    return { hasOverride: false, value: null };
  }
  return { hasOverride: true, value: state.active.illness[childId] ?? null };
}

export function queueOfflineSleepStart(input: {
  childId: string;
  currentAccountId: string | null;
}): SleepSession {
  const startedAt = new Date().toISOString();
  const tempId = makeId("offline-sleep");
  const session: SleepSession = {
    id: tempId,
    childId: input.childId,
    startedAt,
    endedAt: null,
    durationMinutes: null,
    status: "active",
    createdByAccountId: input.currentAccountId,
  };

  updateState((state) => {
    state.active.sleep[input.childId] = session;
    state.actions.push({
      id: makeId("action"),
      kind: "sleep",
      op: "start",
      childId: input.childId,
      tempId,
      createdAt: startedAt,
      currentAccountId: input.currentAccountId,
    });
  });

  return session;
}

export function queueOfflineSleepStop(input: {
  childId: string;
  sessionId: string;
}): SleepSession | null {
  const override = getOfflineSleepOverride(input.childId);
  const existing = override.value;
  const endedAt = new Date().toISOString();
  const completed =
    existing && existing.id === input.sessionId
      ? {
          ...existing,
          endedAt,
          status: "completed",
        }
      : null;

  updateState((state) => {
    state.active.sleep[input.childId] = null;
    state.actions.push({
      id: makeId("action"),
      kind: "sleep",
      op: "stop",
      childId: input.childId,
      tempId: input.sessionId.startsWith("offline-sleep") ? input.sessionId : null,
      serverId: input.sessionId.startsWith("offline-sleep") ? null : input.sessionId,
      createdAt: endedAt,
    });
  });

  return completed;
}

export function queueOfflineFeedingStart(input: {
  childId: string;
  currentAccountId: string | null;
  payload: FeedingStartAction["payload"];
}): FeedingRecord {
  const now = new Date().toISOString();
  const tempId = makeId("offline-feeding");
  const record: FeedingRecord = {
    id: tempId,
    childId: input.childId,
    feedingType: input.payload.feeding_type,
    breastSide: input.payload.breast_side ?? null,
    isExpressed: input.payload.is_expressed ?? false,
    formulaVolumeMl: input.payload.formula_volume_ml ?? null,
    recordedAt: now,
    startedAt: now,
    endedAt: null,
    durationMinutes: null,
    status: "active",
    note: input.payload.note ?? null,
    createdByAccountId: input.currentAccountId,
  };

  updateState((state) => {
    state.active.feeding[input.childId] = record;
    state.actions.push({
      id: makeId("action"),
      kind: "feeding",
      op: "start",
      childId: input.childId,
      tempId,
      createdAt: now,
      currentAccountId: input.currentAccountId,
      payload: input.payload,
    });
  });

  return record;
}

export function queueOfflineFeedingStop(input: {
  childId: string;
  recordId: string;
  payload?: FeedingStopAction["payload"];
}): FeedingRecord | null {
  const override = getOfflineFeedingOverride(input.childId);
  const existing = override.value;
  const endedAt = new Date().toISOString();
  const completed =
    existing && existing.id === input.recordId
      ? {
          ...existing,
          endedAt,
          status: "completed",
        }
      : null;

  updateState((state) => {
    state.active.feeding[input.childId] = null;
    state.actions.push({
      id: makeId("action"),
      kind: "feeding",
      op: "stop",
      childId: input.childId,
      tempId: input.recordId.startsWith("offline-feeding") ? input.recordId : null,
      serverId: input.recordId.startsWith("offline-feeding") ? null : input.recordId,
      createdAt: endedAt,
      payload: input.payload ?? null,
    });
  });

  return completed;
}

export function queueOfflineIllnessStart(input: {
  childId: string;
  currentAccountId: string | null;
  payload: IllnessStartAction["payload"];
}): IllnessEpisode {
  const tempId = makeId("offline-illness");
  const episode: IllnessEpisode = {
    id: tempId,
    childId: input.childId,
    startedAt: input.payload.started_at,
    title: input.payload.title ?? null,
    status: "active",
    medicationMode: input.payload.medication_mode,
    note: input.payload.note ?? null,
    memberAccountIds: input.payload.member_account_ids ?? [],
    closedAt: null,
  };

  updateState((state) => {
    state.active.illness[input.childId] = episode;
    state.actions.push({
      id: makeId("action"),
      kind: "illness",
      op: "start",
      childId: input.childId,
      tempId,
      createdAt: new Date().toISOString(),
      currentAccountId: input.currentAccountId,
      payload: input.payload,
    });
  });

  return episode;
}

export function queueOfflineIllnessStop(input: {
  childId: string;
  episodeId: string;
}): IllnessEpisode | null {
  const override = getOfflineIllnessOverride(input.childId);
  const existing = override.value;
  const closedAt = new Date().toISOString();
  const completed =
    existing && existing.id === input.episodeId
      ? {
          ...existing,
          status: "closed",
          closedAt,
        }
      : null;

  updateState((state) => {
    state.active.illness[input.childId] = null;
    state.actions.push({
      id: makeId("action"),
      kind: "illness",
      op: "stop",
      childId: input.childId,
      tempId: input.episodeId.startsWith("offline-illness") ? input.episodeId : null,
      serverId: input.episodeId.startsWith("offline-illness") ? null : input.episodeId,
      createdAt: closedAt,
    });
  });

  return completed;
}

export function setOfflineTempServerId(tempId: string, serverId: string): void {
  updateState((state) => {
    state.tempToServerId[tempId] = serverId;
  });
}

export function getOfflineTempServerId(tempId: string | null | undefined): string | null {
  if (!tempId) {
    return null;
  }
  return readState().tempToServerId[tempId] ?? null;
}

export function removeOfflineAction(actionId: string): void {
  updateState((state) => {
    state.actions = state.actions.filter((item) => item.id !== actionId);
  });
}

export function clearOfflineOverride(kind: keyof ActiveOverrides, childId: string): void {
  updateState((state) => {
    delete state.active[kind][childId];
  });
}

export function replaceOfflineOverrideWithServerEntity(
  kind: keyof ActiveOverrides,
  childId: string,
  entity: SleepSession | FeedingRecord | IllnessEpisode
): void {
  updateState((state) => {
    if (kind === "sleep") {
      state.active.sleep[childId] = entity as SleepSession;
    } else if (kind === "feeding") {
      state.active.feeding[childId] = entity as FeedingRecord;
    } else {
      state.active.illness[childId] = entity as IllnessEpisode;
    }
  });
}

export function clearOfflineTempServerId(tempId: string): void {
  updateState((state) => {
    delete state.tempToServerId[tempId];
  });
}
