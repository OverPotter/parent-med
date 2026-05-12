import type { MobileAuthSession } from "../../auth/api/authApi";

type RawHeightEntryResponse = {
  id: string;
  child_id: string;
  value_cm: number;
  measured_at: string;
};

export type MobileHeightEntry = {
  id: string;
  childId: string;
  valueCm: number;
  measuredAt: string;
};

export class MobileHeightEntriesApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileHeightEntriesApiError";
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
    throw new MobileHeightEntriesApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

function toMobileHeightEntry(raw: RawHeightEntryResponse): MobileHeightEntry {
  return {
    id: raw.id,
    childId: raw.child_id,
    valueCm: raw.value_cm,
    measuredAt: raw.measured_at,
  };
}

export async function fetchLatestMobileHeightEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileHeightEntry | null> {
  const response = await requestAuthedJson<RawHeightEntryResponse | null>(
    `/height-entries/child/${encodeURIComponent(childId)}/latest`,
    {
      method: "GET",
    },
    session.accessToken,
  );

  return response ? toMobileHeightEntry(response) : null;
}

export async function fetchMobileHeightEntries(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileHeightEntry[]> {
  const response = await requestAuthedJson<RawHeightEntryResponse[]>(
    `/height-entries?child_id=${encodeURIComponent(childId)}`,
    {
      method: "GET",
    },
    session.accessToken,
  );

  return response.map(toMobileHeightEntry);
}

export async function createMobileHeightEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    childId: string;
    valueCm: number;
    measuredAt?: string | null;
  },
) {
  const response = await requestAuthedJson<RawHeightEntryResponse>(
    "/height-entries",
    {
      method: "POST",
      body: JSON.stringify({
        child_id: payload.childId,
        value_cm: payload.valueCm,
        measured_at: payload.measuredAt ?? null,
      }),
    },
    session.accessToken,
  );

  return toMobileHeightEntry(response);
}

export async function deleteMobileHeightEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  entryId: string,
): Promise<void> {
  await requestAuthedJson<void>(
    `/height-entries/${encodeURIComponent(entryId)}`,
    {
      method: "DELETE",
    },
    session.accessToken,
  );
}
