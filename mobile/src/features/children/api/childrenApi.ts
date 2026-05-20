import type { MobileAuthSession } from "../../auth/api/authApi";
import { getMobileApiBaseUrl } from "../../../shared/config/mobileRuntimeConfig";

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

type RawChildActiveSessionSummary = {
  id: string;
  started_at: string;
};

type RawChildSummaryResponse = RawChildResponse & {
  latest_weight_kg?: number | null;
  latest_height_cm?: number | null;
  active_sleep_session?: RawChildActiveSessionSummary | null;
  active_feeding_record?: RawChildActiveSessionSummary | null;
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
  allergies: string | null;
  notes: string | null;
};

export type MobileChildModuleSummary = {
  child: MobileChildSummary;
  latestWeightKg: number | null;
  latestHeightCm: number | null;
  activeSleepSession: {
    id: string;
    startedAt: string;
  } | null;
  activeFeedingRecord: {
    id: string;
    startedAt: string;
  } | null;
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

export type UpdateMobileChildInput = {
  name?: string | null;
  birthDate?: string | null;
  avatarKey?: string | null;
  gender?: string | null;
  babyModeEnabled?: boolean | null;
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

const API_BASE_URL = getMobileApiBaseUrl();

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
    allergies: raw.allergies ?? null,
    notes: raw.notes ?? null,
  };
}

function toMobileChildModuleSummary(
  raw: RawChildSummaryResponse,
): MobileChildModuleSummary {
  return {
    child: toMobileChildSummary(raw),
    latestWeightKg: raw.latest_weight_kg ?? null,
    latestHeightCm: raw.latest_height_cm ?? null,
    activeSleepSession: raw.active_sleep_session
      ? {
          id: raw.active_sleep_session.id,
          startedAt: raw.active_sleep_session.started_at,
        }
      : null,
    activeFeedingRecord: raw.active_feeding_record
      ? {
          id: raw.active_feeding_record.id,
          startedAt: raw.active_feeding_record.started_at,
        }
      : null,
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

export async function fetchMobileChildrenSummary(
  session: Pick<MobileAuthSession, "accessToken" | "account">,
): Promise<MobileChildModuleSummary[]> {
  const response = await requestAuthedJson<RawChildSummaryResponse[]>(
    `/children/summary?family_id=${encodeURIComponent(session.account.familyId)}`,
    { method: "GET" },
    session.accessToken,
  );

  return response.map(toMobileChildModuleSummary);
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

export async function updateMobileChild(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
  input: UpdateMobileChildInput,
): Promise<MobileChildSummary> {
  const body: Record<string, unknown> = {};

  if ("name" in input) {
    body.name = input.name?.trim() || null;
  }

  if ("birthDate" in input) {
    body.birth_date = input.birthDate;
  }

  if ("babyModeEnabled" in input) {
    body.baby_mode_enabled =
      typeof input.babyModeEnabled === "boolean" ? input.babyModeEnabled : null;
  }

  if ("allergies" in input) {
    body.allergies = input.allergies;
  }

  if ("notes" in input) {
    body.notes = input.notes;
  }

  if ("avatarKey" in input) {
    body.avatar_key = input.avatarKey;
  }

  if ("gender" in input) {
    body.gender = input.gender;
  }

  const response = await requestAuthedJson<RawChildResponse>(
    `/children/${encodeURIComponent(childId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    session.accessToken,
  );

  return toMobileChildSummary(response);
}

export async function deleteMobileChild(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<void> {
  await requestAuthedJson<null>(
    `/children/${encodeURIComponent(childId)}`,
    {
      method: "DELETE",
    },
    session.accessToken,
  );
}
