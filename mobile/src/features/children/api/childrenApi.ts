import type { MobileAuthSession } from "../../auth/api/authApi";

type RawChildResponse = {
  id: string;
  family_id: string;
  name: string;
  birth_date: string | null;
  age_label: string | null;
  baby_mode_enabled: boolean;
  avatar_key?: string | null;
  gender?: string | null;
  institution_name: string | null;
  institution_phone: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  allergies: string | null;
  notes: string | null;
};

export type MobileChildSummary = {
  id: string;
  familyId: string;
  name: string;
  birthDate: string | null;
  ageLabel: string | null;
  babyModeEnabled: boolean;
  avatarKey: string | null;
  gender: string | null;
};

export type CreateMobileChildInput = {
  name: string;
  birthDate: string | null;
  avatarKey: string | null;
  gender: string | null;
  babyModeEnabled?: boolean;
  allergies?: string | null;
  notes?: string | null;
};

export class MobileChildrenApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileChildrenApiError";
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
    throw new MobileChildrenApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

function toMobileChildSummary(raw: RawChildResponse): MobileChildSummary {
  return {
    id: raw.id,
    familyId: raw.family_id,
    name: raw.name,
    birthDate: raw.birth_date ?? null,
    ageLabel: raw.age_label ?? null,
    babyModeEnabled: Boolean(raw.baby_mode_enabled),
    avatarKey: raw.avatar_key ?? null,
    gender: raw.gender ?? null,
  };
}

export async function fetchMobileChildren(
  session: Pick<MobileAuthSession, "accessToken" | "account">,
): Promise<MobileChildSummary[]> {
  const response = await requestAuthedJson<RawChildResponse[]>(
    `/children?family_id=${encodeURIComponent(session.account.familyId)}`,
    { method: "GET" },
    session.accessToken,
  );

  return response.map(toMobileChildSummary);
}

export async function createMobileChild(
  session: Pick<MobileAuthSession, "accessToken" | "account">,
  input: CreateMobileChildInput,
): Promise<MobileChildSummary> {
  const response = await requestAuthedJson<RawChildResponse>(
    "/children",
    {
      method: "POST",
      body: JSON.stringify({
        family_id: session.account.familyId,
        name: input.name.trim(),
        birth_date: input.birthDate,
        baby_mode_enabled: Boolean(input.babyModeEnabled),
        allergies: input.allergies ?? null,
        notes: input.notes ?? null,
        avatar_key: input.avatarKey,
        gender: input.gender,
      }),
    },
    session.accessToken,
  );

  return toMobileChildSummary(response);
}
