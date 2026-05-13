import type { MobileAuthSession } from "../../auth/api/authApi";

type RawSleepSessionResponse = {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  created_by_account_id: string | null;
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

export class MobileSleepSessionsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileSleepSessionsApiError";
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
    throw new MobileSleepSessionsApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
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

export async function fetchActiveMobileSleepSession(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileSleepSession | null> {
  const response = await requestAuthedJson<RawSleepSessionResponse | null>(
    `/sleep-sessions/child/${encodeURIComponent(childId)}/active`,
    { method: "GET" },
    session.accessToken,
  );

  return response ? toMobileSleepSession(response) : null;
}

export async function fetchMobileSleepSessions(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileSleepSession[]> {
  const response = await requestAuthedJson<RawSleepSessionResponse[]>(
    `/sleep-sessions/child/${encodeURIComponent(childId)}`,
    { method: "GET" },
    session.accessToken,
  );

  return response.map(toMobileSleepSession);
}

export async function startMobileSleepSession(
  session: Pick<MobileAuthSession, "accessToken">,
  input: { childId: string; startedAt?: string | null },
): Promise<MobileSleepSession> {
  const response = await requestAuthedJson<RawSleepSessionResponse>(
    "/sleep-sessions",
    {
      method: "POST",
      body: JSON.stringify({
        child_id: input.childId,
        started_at: input.startedAt ?? null,
      }),
    },
    session.accessToken,
  );

  return toMobileSleepSession(response);
}

export async function stopMobileSleepSession(
  session: Pick<MobileAuthSession, "accessToken">,
  input: { sessionId: string; endedAt?: string | null },
): Promise<MobileSleepSession> {
  const response = await requestAuthedJson<RawSleepSessionResponse>(
    `/sleep-sessions/${encodeURIComponent(input.sessionId)}/stop`,
    {
      method: "POST",
      body: JSON.stringify({
        ended_at: input.endedAt ?? null,
      }),
    },
    session.accessToken,
  );

  return toMobileSleepSession(response);
}

export async function deleteMobileSleepSession(
  session: Pick<MobileAuthSession, "accessToken">,
  sessionId: string,
): Promise<void> {
  await requestAuthedJson<void>(
    `/sleep-sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
    },
    session.accessToken,
  );
}
