import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "./illnessApiClient";

type RawTemperatureEntryResponse = {
  id: string;
  episode_id: string;
  value_celsius: number;
  measured_at: string;
  method: string | null;
  comment: string | null;
  created_by_account_id: string | null;
  created_by_name_snapshot: string | null;
};

export type MobileTemperatureEntry = {
  id: string;
  episodeId: string;
  valueCelsius: number;
  measuredAt: string;
  method: string | null;
  comment: string | null;
  createdByAccountId: string | null;
  createdByNameSnapshot: string | null;
};

export class MobileTemperatureEntriesApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileTemperatureEntriesApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileTemperatureEntry(
  raw: RawTemperatureEntryResponse,
): MobileTemperatureEntry {
  return {
    id: raw.id,
    episodeId: raw.episode_id,
    valueCelsius: raw.value_celsius,
    measuredAt: raw.measured_at,
    method: raw.method,
    comment: raw.comment,
    createdByAccountId: raw.created_by_account_id,
    createdByNameSnapshot: raw.created_by_name_snapshot,
  };
}

export async function fetchMobileTemperatureEntriesByEpisodeId(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<MobileTemperatureEntry[]> {
  const response = await requestIllnessAuthedJson<RawTemperatureEntryResponse[]>(
    `/temperature-entries?episode_id=${encodeURIComponent(episodeId)}`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileTemperatureEntriesApiError(message, options),
  );

  return response.map(toMobileTemperatureEntry);
}

export async function createMobileTemperatureEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    episodeId: string;
    valueCelsius: number;
    measuredAt?: string | null;
    method?: string | null;
    comment?: string | null;
  },
): Promise<MobileTemperatureEntry> {
  const response = await requestIllnessAuthedJson<RawTemperatureEntryResponse>(
    "/temperature-entries",
    {
      method: "POST",
      body: JSON.stringify({
        episode_id: payload.episodeId,
        value_celsius: payload.valueCelsius,
        measured_at: payload.measuredAt ?? null,
        method: payload.method ?? null,
        comment: payload.comment ?? null,
      }),
    },
    session.accessToken,
    (message, options) => new MobileTemperatureEntriesApiError(message, options),
  );

  return toMobileTemperatureEntry(response);
}

export async function deleteMobileTemperatureEntry(
  session: Pick<MobileAuthSession, "accessToken">,
  entryId: string,
): Promise<void> {
  await requestIllnessAuthedJson<null>(
    `/temperature-entries/${encodeURIComponent(entryId)}`,
    { method: "DELETE" },
    session.accessToken,
    (message, options) => new MobileTemperatureEntriesApiError(message, options),
  );
}
