import type { MobileAuthSession } from "../../auth/api/authApi";

type RawWeightEntryResponse = {
  id: string;
  child_id: string;
  value_kg: number;
  measured_at: string;
};

export type MobileWeightEntry = {
  id: string;
  childId: string;
  valueKg: number;
  measuredAt: string;
};

export class MobileWeightEntriesApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileWeightEntriesApiError";
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
    throw new MobileWeightEntriesApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

function toMobileWeightEntry(raw: RawWeightEntryResponse): MobileWeightEntry {
  return {
    id: raw.id,
    childId: raw.child_id,
    valueKg: raw.value_kg,
    measuredAt: raw.measured_at,
  };
}

export async function fetchLatestMobileWeightEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileWeightEntry | null> {
  const response = await requestAuthedJson<RawWeightEntryResponse | null>(
    `/weight-entries/child/${encodeURIComponent(childId)}/latest`,
    {
      method: "GET",
    },
    session.accessToken,
  );

  return response ? toMobileWeightEntry(response) : null;
}

export async function createMobileWeightEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    childId: string;
    valueKg: number;
    measuredAt?: string | null;
  },
) {
  const response = await requestAuthedJson<RawWeightEntryResponse>(
    "/weight-entries",
    {
      method: "POST",
      body: JSON.stringify({
        child_id: payload.childId,
        value_kg: payload.valueKg,
        measured_at: payload.measuredAt ?? null,
      }),
    },
    session.accessToken,
  );

  return toMobileWeightEntry(response);
}
