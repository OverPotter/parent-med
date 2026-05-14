import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "./illnessApiClient";

type RawAdministrationEventResponse = {
  id: string;
  episode_id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  administered_at: string;
  administered_by_account_id: string | null;
  administered_by_name_snapshot: string | null;
  amount: string;
  unit: string | null;
  reason: string | null;
};

export type MobileAdministrationEvent = {
  id: string;
  episodeId: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  administeredAt: string;
  administeredByAccountId: string | null;
  administeredByNameSnapshot: string | null;
  amount: string;
  unit: string | null;
  reason: string | null;
};

export class MobileAdministrationEventsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileAdministrationEventsApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileAdministrationEvent(
  raw: RawAdministrationEventResponse,
): MobileAdministrationEvent {
  return {
    id: raw.id,
    episodeId: raw.episode_id,
    householdMedicineId: raw.household_medicine_id,
    customMedicineName: raw.custom_medicine_name,
    administeredAt: raw.administered_at,
    administeredByAccountId: raw.administered_by_account_id,
    administeredByNameSnapshot: raw.administered_by_name_snapshot,
    amount: raw.amount,
    unit: raw.unit,
    reason: raw.reason,
  };
}

export async function fetchMobileAdministrationEventsByEpisodeId(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<MobileAdministrationEvent[]> {
  const response = await requestIllnessAuthedJson<
    RawAdministrationEventResponse[]
  >(
    `/administration-events?episode_id=${encodeURIComponent(episodeId)}`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileAdministrationEventsApiError(message, options),
  );

  return response.map(toMobileAdministrationEvent);
}

export async function createMobileAdministrationEvent(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    episodeId: string;
    customMedicineName: string;
    administeredAt?: string | null;
    amount: string;
    unit?: string | null;
    reason?: string | null;
  },
): Promise<MobileAdministrationEvent> {
  const response = await requestIllnessAuthedJson<RawAdministrationEventResponse>(
    "/administration-events",
    {
      method: "POST",
      body: JSON.stringify({
        episode_id: payload.episodeId,
        custom_medicine_name: payload.customMedicineName,
        administered_at: payload.administeredAt ?? null,
        amount: payload.amount,
        unit: payload.unit ?? null,
        reason: payload.reason ?? null,
      }),
    },
    session.accessToken,
    (message, options) => new MobileAdministrationEventsApiError(message, options),
  );

  return toMobileAdministrationEvent(response);
}

export async function deleteMobileAdministrationEvent(
  session: Pick<MobileAuthSession, "accessToken">,
  eventId: string,
): Promise<void> {
  await requestIllnessAuthedJson<null>(
    `/administration-events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
    session.accessToken,
    (message, options) => new MobileAdministrationEventsApiError(message, options),
  );
}
