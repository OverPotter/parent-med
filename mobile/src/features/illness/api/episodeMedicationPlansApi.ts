import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "./illnessApiClient";

type RawEpisodeMedicationPlanResponse = {
  id: string;
  episode_id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  dose_amount: string;
  min_interval_minutes: number;
  max_doses_per_day: number | null;
  notes: string | null;
  member_account_ids: string[];
  created_at: string;
};

export type MobileEpisodeMedicationPlan = {
  id: string;
  episodeId: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay: number | null;
  notes: string | null;
  memberAccountIds: string[];
  createdAt: string;
};

export class MobileEpisodeMedicationPlansApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileEpisodeMedicationPlansApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileEpisodeMedicationPlan(
  raw: RawEpisodeMedicationPlanResponse,
): MobileEpisodeMedicationPlan {
  return {
    id: raw.id,
    episodeId: raw.episode_id,
    householdMedicineId: raw.household_medicine_id,
    customMedicineName: raw.custom_medicine_name,
    doseAmount: raw.dose_amount,
    minIntervalMinutes: raw.min_interval_minutes,
    maxDosesPerDay: raw.max_doses_per_day,
    notes: raw.notes,
    memberAccountIds: raw.member_account_ids,
    createdAt: raw.created_at,
  };
}

export async function fetchMobileEpisodeMedicationPlansByEpisodeId(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<MobileEpisodeMedicationPlan[]> {
  const response = await requestIllnessAuthedJson<RawEpisodeMedicationPlanResponse[]>(
    `/episode-medication-plans?episode_id=${encodeURIComponent(episodeId)}`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileEpisodeMedicationPlansApiError(message, options),
  );

  return response.map(toMobileEpisodeMedicationPlan);
}

export async function createMobileEpisodeMedicationPlan(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    episodeId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    memberAccountIds?: string[];
    notes?: string | null;
  },
): Promise<MobileEpisodeMedicationPlan> {
  const response = await requestIllnessAuthedJson<RawEpisodeMedicationPlanResponse>(
    "/episode-medication-plans",
    {
      method: "POST",
      body: JSON.stringify({
        episode_id: payload.episodeId,
        custom_medicine_name: payload.customMedicineName,
        dose_amount: payload.doseAmount,
        min_interval_minutes: payload.minIntervalMinutes,
        max_doses_per_day: payload.maxDosesPerDay ?? null,
        notes: payload.notes ?? null,
        member_account_ids: payload.memberAccountIds ?? [],
      }),
    },
    session.accessToken,
    (message, options) => new MobileEpisodeMedicationPlansApiError(message, options),
  );

  return toMobileEpisodeMedicationPlan(response);
}

export async function updateMobileEpisodeMedicationPlan(
  session: Pick<MobileAuthSession, "accessToken">,
  planId: string,
  patch: {
    customMedicineName?: string | null;
    doseAmount?: string | null;
    minIntervalMinutes?: number | null;
    maxDosesPerDay?: number | null;
    notes?: string | null;
    memberAccountIds?: string[] | null;
  },
): Promise<MobileEpisodeMedicationPlan> {
  const body: Record<string, unknown> = {};

  if (patch.customMedicineName !== undefined) {
    body.custom_medicine_name = patch.customMedicineName;
  }
  if (patch.doseAmount !== undefined) {
    body.dose_amount = patch.doseAmount;
  }
  if (patch.minIntervalMinutes !== undefined) {
    body.min_interval_minutes = patch.minIntervalMinutes;
  }
  if (patch.maxDosesPerDay !== undefined) {
    body.max_doses_per_day = patch.maxDosesPerDay;
  }
  if (patch.notes !== undefined) {
    body.notes = patch.notes;
  }
  if (patch.memberAccountIds !== undefined) {
    body.member_account_ids = patch.memberAccountIds;
  }

  const response = await requestIllnessAuthedJson<RawEpisodeMedicationPlanResponse>(
    `/episode-medication-plans/${encodeURIComponent(planId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    session.accessToken,
    (message, options) => new MobileEpisodeMedicationPlansApiError(message, options),
  );

  return toMobileEpisodeMedicationPlan(response);
}

export async function deleteMobileEpisodeMedicationPlan(
  session: Pick<MobileAuthSession, "accessToken">,
  planId: string,
): Promise<void> {
  await requestIllnessAuthedJson<null>(
    `/episode-medication-plans/${encodeURIComponent(planId)}`,
    { method: "DELETE" },
    session.accessToken,
    (message, options) => new MobileEpisodeMedicationPlansApiError(message, options),
  );
}
