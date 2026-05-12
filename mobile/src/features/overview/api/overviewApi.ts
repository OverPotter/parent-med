import type { MobileAuthSession } from "../../auth/api/authApi";

type RawFeedingRecordResponse = {
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
};

type RawSleepSessionResponse = {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  created_by_account_id: string | null;
};

type RawWeightEntryResponse = {
  id: string;
  child_id: string;
  value_kg: number;
  measured_at: string;
};

type RawHeightEntryResponse = {
  id: string;
  child_id: string;
  value_cm: number;
  measured_at: string;
};

type RawIllnessEpisodeResponse = {
  id: string;
  child_id: string;
  started_at: string;
  title: string | null;
  status: string;
  medication_mode: string;
  note: string | null;
  created_by_account_id: string | null;
  closed_at: string | null;
};

type RawMobileChildOverviewResponse = {
  feeding_records: RawFeedingRecordResponse[];
  sleep_sessions: RawSleepSessionResponse[];
  weight_entries: RawWeightEntryResponse[];
  height_entries: RawHeightEntryResponse[];
  illness_episodes: RawIllnessEpisodeResponse[];
};

export type MobileFeedingRecord = {
  id: string;
  childId: string;
  feedingType: string;
  breastSide: string | null;
  isExpressed: boolean;
  formulaVolumeMl: number | null;
  recordedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  status: string;
  note: string | null;
  createdByAccountId: string | null;
};

export type MobileSleepSession = {
  id: string;
  childId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  status: string;
  createdByAccountId: string | null;
};

export type MobileWeightEntry = {
  id: string;
  childId: string;
  valueKg: number;
  measuredAt: string;
};

export type MobileHeightEntry = {
  id: string;
  childId: string;
  valueCm: number;
  measuredAt: string;
};

export type MobileIllnessEpisode = {
  id: string;
  childId: string;
  startedAt: string;
  title: string | null;
  status: string;
  medicationMode: string;
  note: string | null;
  createdByAccountId: string | null;
  closedAt: string | null;
};

export type MobileChildOverview = {
  feedingRecords: MobileFeedingRecord[];
  sleepSessions: MobileSleepSession[];
  weightEntries: MobileWeightEntry[];
  heightEntries: MobileHeightEntry[];
  illnessEpisodes: MobileIllnessEpisode[];
};

export class MobileOverviewApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileOverviewApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

const PROD_API_ORIGIN = "https://parent-med-production.up.railway.app";
const DEV_API_ORIGIN = "http://localhost:8000";

function normalizeApiOrigin(raw: string | undefined) {
  const value = raw?.trim().replace(/\/+$/, "") ?? "";

  if (!value) {
    return __DEV__ ? DEV_API_ORIGIN : PROD_API_ORIGIN;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

const API_BASE_URL = `${normalizeApiOrigin(process.env.EXPO_PUBLIC_API_URL)}/api/v1`;

function parseErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const candidate = payload as {
    code?: unknown;
    detail?: unknown;
    message?: unknown;
  };

  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    detail:
      typeof candidate.detail === "string"
        ? candidate.detail
        : typeof candidate.message === "string"
          ? candidate.message
          : undefined,
  };
}

async function requestAuthedJson<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const { code, detail } = parseErrorPayload(payload);
    throw new MobileOverviewApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

function toMobileFeedingRecord(raw: RawFeedingRecordResponse): MobileFeedingRecord {
  return {
    id: raw.id,
    childId: raw.child_id,
    feedingType: raw.feeding_type,
    breastSide: raw.breast_side ?? null,
    isExpressed: Boolean(raw.is_expressed),
    formulaVolumeMl: raw.formula_volume_ml ?? null,
    recordedAt: raw.recorded_at,
    startedAt: raw.started_at ?? null,
    endedAt: raw.ended_at ?? null,
    durationMinutes: raw.duration_minutes ?? null,
    status: raw.status,
    note: raw.note ?? null,
    createdByAccountId: raw.created_by_account_id ?? null,
  };
}

function toMobileSleepSession(raw: RawSleepSessionResponse): MobileSleepSession {
  return {
    id: raw.id,
    childId: raw.child_id,
    startedAt: raw.started_at,
    endedAt: raw.ended_at ?? null,
    durationMinutes: raw.duration_minutes ?? null,
    status: raw.status,
    createdByAccountId: raw.created_by_account_id ?? null,
  };
}

function toMobileWeightEntry(raw: RawWeightEntryResponse): MobileWeightEntry {
  return {
    id: raw.id,
    childId: raw.child_id,
    valueKg: raw.value_kg,
    measuredAt: raw.measured_at,
  };
}

function toMobileHeightEntry(raw: RawHeightEntryResponse): MobileHeightEntry {
  return {
    id: raw.id,
    childId: raw.child_id,
    valueCm: raw.value_cm,
    measuredAt: raw.measured_at,
  };
}

function toMobileIllnessEpisode(raw: RawIllnessEpisodeResponse): MobileIllnessEpisode {
  return {
    id: raw.id,
    childId: raw.child_id,
    startedAt: raw.started_at,
    title: raw.title,
    status: raw.status,
    medicationMode: raw.medication_mode,
    note: raw.note,
    createdByAccountId: raw.created_by_account_id,
    closedAt: raw.closed_at,
  };
}

export async function fetchMobileChildOverview(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileChildOverview> {
  const response = await requestAuthedJson<RawMobileChildOverviewResponse>(
    `/children/${encodeURIComponent(childId)}/overview`,
    { method: "GET" },
    session.accessToken,
  );

  return {
    feedingRecords: response.feeding_records.map(toMobileFeedingRecord),
    sleepSessions: response.sleep_sessions.map(toMobileSleepSession),
    weightEntries: response.weight_entries.map(toMobileWeightEntry),
    heightEntries: response.height_entries.map(toMobileHeightEntry),
    illnessEpisodes: response.illness_episodes.map(toMobileIllnessEpisode),
  };
}
