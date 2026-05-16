import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "../../illness/api/illnessApiClient";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type MobilePillboxMealRule =
  | "before_meal"
  | "with_meal"
  | "after_meal"
  | "not_matter";

export type MobilePillboxCourseMode = "continuous" | "period";

export type MobilePillboxMedicationWrite = {
  id?: string | null;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  mealRule: MobilePillboxMealRule;
  repeatDays: number[];
  times: string[];
  courseMode: MobilePillboxCourseMode;
  courseStartDate: string | null;
  courseEndDate: string | null;
  position: number;
};

export type MobilePillboxPlanWrite = {
  title: string;
  memberAccountIds: string[];
  medications: MobilePillboxMedicationWrite[];
  status?: "active" | "paused" | "archived";
};

export type MobilePillboxMedication = {
  id: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  mealRule: MobilePillboxMealRule;
  repeatDays: number[];
  times: string[];
  courseMode: MobilePillboxCourseMode;
  courseStartDate: string | null;
  courseEndDate: string | null;
  position: number;
};

export type MobilePillboxPlan = {
  id: string;
  familyId: string;
  title: string;
  status: "active" | "paused" | "completed" | "archived";
  memberAccountIds: string[];
  medications: MobilePillboxMedication[];
  createdAt: string;
  updatedAt: string;
};

export type MobilePillboxWritableStatus = "active" | "paused" | "archived";

export type MobilePillboxPlanSummary = {
  id: string;
  title: string;
  status: "active" | "paused" | "completed" | "archived";
  memberAccountIds: string[];
  activeMedicationCount: number;
  nextDoseAt: string | null;
  nextDoseLabel: string | null;
  nextMedicationId: string | null;
  nextMedicationTitle: string | null;
  courseSummaryKind: "continuous" | "period" | "mixed" | null;
  courseProgressRatio: number | null;
  courseDayLabel: string | null;
};

export type MobilePillboxAnalyticsSeriesPoint = {
  label: string;
  value: number;
};

export type MobilePillboxTopMedication = {
  medicationName: string;
  missedSlots: number;
};

export type MobilePillboxHistorySummary = {
  planId: string;
  planTitle: string;
  planStatus: MobilePillboxPlan["status"];
  memberCount: number;
  period: string;
  totalMedications: number;
  scheduledSlots: number;
  takenSlots: number;
  missedSlots: number;
  lateSlots: number;
  onTimeSlots: number;
  adherenceRate: number;
  onTimeRate: number;
  timeline: MobilePillboxAnalyticsSeriesPoint[];
  topMissedMedications: MobilePillboxTopMedication[];
};

type RawMobilePillboxMedication = {
  id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  dose_amount: string;
  meal_rule: MobilePillboxMealRule;
  repeat_days: number[];
  times: string[];
  course_mode: MobilePillboxCourseMode;
  course_start_date: string | null;
  course_end_date: string | null;
  position: number;
};

type RawMobilePillboxPlan = {
  id: string;
  family_id: string;
  title: string;
  status: MobilePillboxPlan["status"];
  member_account_ids: string[];
  medications: RawMobilePillboxMedication[];
  created_at: string;
  updated_at: string;
};

type RawMobilePillboxPlanSummary = {
  id: string;
  title: string;
  status: MobilePillboxPlanSummary["status"];
  member_account_ids: string[];
  active_medication_count: number;
  next_dose_at: string | null;
  next_dose_label: string | null;
  next_medication_id: string | null;
  next_medication_title: string | null;
  course_summary_kind: MobilePillboxPlanSummary["courseSummaryKind"];
  course_progress_ratio: number | null;
  course_day_label: string | null;
};

type RawMobilePillboxAnalyticsSeriesPoint = {
  label: string;
  value: number;
};

type RawMobilePillboxTopMedication = {
  medication_name: string;
  missed_slots: number;
};

type RawMobilePillboxHistorySummary = {
  plan_id: string;
  plan_title: string;
  plan_status: MobilePillboxPlan["status"];
  member_count: number;
  period: string;
  total_medications: number;
  scheduled_slots: number;
  taken_slots: number;
  missed_slots: number;
  late_slots: number;
  on_time_slots: number;
  adherence_rate: number;
  on_time_rate: number;
  timeline: RawMobilePillboxAnalyticsSeriesPoint[];
  top_missed_medications: RawMobilePillboxTopMedication[];
};

export class MobilePillboxPlansApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobilePillboxPlansApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function normalizeApiTime(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 5) : trimmed;
}

function toMobilePillboxMedication(
  raw: RawMobilePillboxMedication,
): MobilePillboxMedication {
  return {
    id: raw.id,
    householdMedicineId: raw.household_medicine_id ?? null,
    customMedicineName: raw.custom_medicine_name ?? null,
    doseAmount: raw.dose_amount,
    mealRule: raw.meal_rule,
    repeatDays: raw.repeat_days ?? [],
    times: (raw.times ?? []).map(normalizeApiTime),
    courseMode: raw.course_mode,
    courseStartDate: raw.course_start_date ?? null,
    courseEndDate: raw.course_end_date ?? null,
    position: raw.position,
  };
}

function toMobilePillboxPlan(raw: RawMobilePillboxPlan): MobilePillboxPlan {
  return {
    id: raw.id,
    familyId: raw.family_id,
    title: raw.title,
    status: raw.status,
    memberAccountIds: raw.member_account_ids ?? [],
    medications: (raw.medications ?? []).map(toMobilePillboxMedication),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toMobilePillboxPlanSummary(
  raw: RawMobilePillboxPlanSummary,
): MobilePillboxPlanSummary {
  return {
    id: raw.id,
    title: raw.title,
    status: raw.status,
    memberAccountIds: raw.member_account_ids ?? [],
    activeMedicationCount: raw.active_medication_count,
    nextDoseAt: raw.next_dose_at ?? null,
    nextDoseLabel: raw.next_dose_label ?? null,
    nextMedicationId: raw.next_medication_id ?? null,
    nextMedicationTitle: raw.next_medication_title ?? null,
    courseSummaryKind: raw.course_summary_kind ?? null,
    courseProgressRatio: raw.course_progress_ratio ?? null,
    courseDayLabel: raw.course_day_label ?? null,
  };
}

function toWritePayload(payload: MobilePillboxPlanWrite) {
  return {
    title: payload.title,
    member_account_ids: payload.memberAccountIds,
    medications: payload.medications.map((item) => ({
      id: item.id ?? null,
      household_medicine_id: item.householdMedicineId,
      custom_medicine_name: item.customMedicineName,
      dose_amount: item.doseAmount,
      meal_rule: item.mealRule,
      repeat_days: item.repeatDays,
      times: item.times,
      course_mode: item.courseMode,
      course_start_date: item.courseStartDate,
      course_end_date: item.courseEndDate,
      position: item.position,
    })),
    ...(payload.status ? { status: payload.status } : {}),
  };
}

function toMobilePillboxHistorySummary(
  raw: RawMobilePillboxHistorySummary,
): MobilePillboxHistorySummary {
  return {
    planId: raw.plan_id,
    planTitle: raw.plan_title,
    planStatus: raw.plan_status,
    memberCount: raw.member_count,
    period: raw.period,
    totalMedications: raw.total_medications,
    scheduledSlots: raw.scheduled_slots,
    takenSlots: raw.taken_slots,
    missedSlots: raw.missed_slots,
    lateSlots: raw.late_slots,
    onTimeSlots: raw.on_time_slots,
    adherenceRate: raw.adherence_rate,
    onTimeRate: raw.on_time_rate,
    timeline: (raw.timeline ?? []).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    topMissedMedications: (raw.top_missed_medications ?? []).map((item) => ({
      medicationName: item.medication_name,
      missedSlots: item.missed_slots,
    })),
  };
}

export function toMobilePillboxPlanWrite(plan: MobilePillboxPlan): MobilePillboxPlanWrite {
  return {
    title: plan.title,
    memberAccountIds: plan.memberAccountIds,
    medications: plan.medications.map((item) => ({
      id: item.id,
      householdMedicineId: item.householdMedicineId,
      customMedicineName: item.customMedicineName,
      doseAmount: item.doseAmount,
      mealRule: item.mealRule,
      repeatDays: item.repeatDays,
      times: item.times,
      courseMode: item.courseMode,
      courseStartDate: item.courseStartDate,
      courseEndDate: item.courseEndDate,
      position: item.position,
    })),
  };
}

export async function createMobilePillboxPlan(payload: {
  accessToken: string | null;
  plan: MobilePillboxPlanWrite;
}): Promise<MobilePillboxPlan> {
  const response = await requestIllnessAuthedJson<RawMobilePillboxPlan>(
    "/pillbox-plans",
    {
      method: "POST",
      body: JSON.stringify(toWritePayload(payload.plan)),
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );

  return toMobilePillboxPlan(response);
}

export async function listMobilePillboxPlans(payload: {
  accessToken: string | null;
}): Promise<MobilePillboxPlanSummary[]> {
  const response = await requestIllnessAuthedJson<RawMobilePillboxPlanSummary[]>(
    "/pillbox-plans",
    {
      method: "GET",
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );

  return (response ?? []).map(toMobilePillboxPlanSummary);
}

export async function getMobilePillboxPlan(payload: {
  accessToken: string | null;
  planId: string;
}): Promise<MobilePillboxPlan> {
  const response = await requestIllnessAuthedJson<RawMobilePillboxPlan>(
    `/pillbox-plans/${payload.planId}`,
    {
      method: "GET",
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );

  return toMobilePillboxPlan(response);
}

export async function getMobilePillboxHistorySummary(payload: {
  accessToken: string | null;
  planId: string;
  period: "month" | "quarter" | "half_year" | "year" | "all";
  language?: MobileLocale;
}): Promise<MobilePillboxHistorySummary> {
  const params = new URLSearchParams({ period: payload.period });
  if (payload.language) {
    params.set("language", payload.language);
  }

  const response = await requestIllnessAuthedJson<RawMobilePillboxHistorySummary>(
    `/pillbox-plans/${payload.planId}/history-summary?${params.toString()}`,
    {
      method: "GET",
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );

  return toMobilePillboxHistorySummary(response);
}

export async function deleteMobilePillboxPlan(payload: {
  accessToken: string | null;
  planId: string;
}): Promise<void> {
  await requestIllnessAuthedJson<null>(
    `/pillbox-plans/${payload.planId}`,
    {
      method: "DELETE",
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );
}

export async function updateMobilePillboxPlan(payload: {
  accessToken: string | null;
  planId: string;
  plan: MobilePillboxPlanWrite;
}): Promise<MobilePillboxPlan> {
  const response = await requestIllnessAuthedJson<RawMobilePillboxPlan>(
    `/pillbox-plans/${payload.planId}`,
    {
      method: "PATCH",
      body: JSON.stringify(toWritePayload(payload.plan)),
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );

  return toMobilePillboxPlan(response);
}

export async function takeMobilePillboxDose(payload: {
  accessToken: string | null;
  planId: string;
  medicationId: string;
  scheduledFor?: string | null;
  takenAt?: string;
}): Promise<MobilePillboxPlanSummary> {
  const response = await requestIllnessAuthedJson<RawMobilePillboxPlanSummary>(
    `/pillbox-plans/${payload.planId}/medications/${payload.medicationId}/take`,
    {
      method: "POST",
      body: JSON.stringify({
        source: "manual",
        ...(payload.scheduledFor ? { scheduled_for: payload.scheduledFor } : {}),
        ...(payload.takenAt ? { taken_at: payload.takenAt } : {}),
      }),
    },
    payload.accessToken,
    (message, options) => new MobilePillboxPlansApiError(message, options),
  );

  return toMobilePillboxPlanSummary(response);
}
