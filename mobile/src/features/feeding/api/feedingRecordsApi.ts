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

export class MobileFeedingRecordsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileFeedingRecordsApiError";
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
    throw new MobileFeedingRecordsApiError(detail ?? "Request failed", {
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

export async function fetchActiveMobileFeedingRecord(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileFeedingRecord | null> {
  const response = await requestAuthedJson<RawFeedingRecordResponse | null>(
    `/feeding-records/child/${encodeURIComponent(childId)}/active`,
    { method: "GET" },
    session.accessToken,
  );

  return response ? toMobileFeedingRecord(response) : null;
}

export async function startMobileFeedingRecord(
  session: Pick<MobileAuthSession, "accessToken">,
  input: {
    childId: string;
    feedingType: "breast" | "formula";
    breastSide?: "left" | "right" | "both" | null;
    isExpressed?: boolean;
    formulaVolumeMl?: number | null;
    recordedAt?: string | null;
    startedAt?: string | null;
    note?: string | null;
  },
): Promise<MobileFeedingRecord> {
  const response = await requestAuthedJson<RawFeedingRecordResponse>(
    "/feeding-records/start",
    {
      method: "POST",
      body: JSON.stringify({
        child_id: input.childId,
        feeding_type: input.feedingType,
        breast_side: input.breastSide ?? null,
        is_expressed: Boolean(input.isExpressed),
        formula_volume_ml: input.formulaVolumeMl ?? null,
        recorded_at: input.recordedAt ?? null,
        started_at: input.startedAt ?? null,
        note: input.note ?? null,
      }),
    },
    session.accessToken,
  );

  return toMobileFeedingRecord(response);
}

export async function stopMobileFeedingRecord(
  session: Pick<MobileAuthSession, "accessToken">,
  input: {
    recordId: string;
    endedAt?: string | null;
    formulaVolumeMl?: number | null;
    note?: string | null;
  },
): Promise<MobileFeedingRecord> {
  const response = await requestAuthedJson<RawFeedingRecordResponse>(
    `/feeding-records/${encodeURIComponent(input.recordId)}/stop`,
    {
      method: "POST",
      body: JSON.stringify({
        ended_at: input.endedAt ?? null,
        formula_volume_ml: input.formulaVolumeMl ?? null,
        note: input.note ?? null,
      }),
    },
    session.accessToken,
  );

  return toMobileFeedingRecord(response);
}
