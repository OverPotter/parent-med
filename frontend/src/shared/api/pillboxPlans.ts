import { apiClient } from "./client";
import type {
  PillboxMedication,
  PillboxMedicationWrite,
  PillboxPlan,
  PillboxPlanSummary,
  PillboxPlanWrite,
} from "./pillboxPlans.contract";
import type {
  PillboxAnalyticsSeriesPoint,
  PillboxHistorySummary,
  PillboxTopMedication,
} from "@shared/types/api";

interface RawPillboxMedication {
  id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  dose_amount: string;
  meal_rule: PillboxMedication["mealRule"];
  repeat_days: number[];
  times: string[];
  course_mode: PillboxMedication["courseMode"];
  course_start_date: string | null;
  course_end_date: string | null;
  position: number;
}

interface RawPillboxPlanSummary {
  id: string;
  title: string;
  status: PillboxPlanSummary["status"];
  member_account_ids: string[];
  active_medication_count: number;
  next_dose_at: string | null;
  next_dose_label: string | null;
  next_medication_id: string | null;
  next_medication_title: string | null;
  course_summary_kind: PillboxPlanSummary["courseSummaryKind"];
  course_progress_ratio: number | null;
  course_day_label: string | null;
}

interface RawPillboxPlan {
  id: string;
  family_id: string;
  title: string;
  status: PillboxPlan["status"];
  member_account_ids: string[];
  medications: RawPillboxMedication[];
  created_at: string;
  updated_at: string;
}

interface RawPillboxAnalyticsSeriesPoint {
  label: string;
  value: number;
}

interface RawPillboxTopMedication {
  medication_name: string;
  missed_slots: number;
}

interface RawPillboxHistorySummary {
  period: string;
  total_plans: number;
  active_plans: number;
  paused_plans: number;
  archived_plans: number;
  total_medications: number;
  scheduled_slots: number;
  taken_slots: number;
  missed_slots: number;
  late_slots: number;
  on_time_slots: number;
  adherence_rate: number;
  on_time_rate: number;
  timeline: RawPillboxAnalyticsSeriesPoint[];
  top_missed_medications: RawPillboxTopMedication[];
}

function normalizeApiTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.slice(0, 5);
}

function toPillboxMedication(raw: RawPillboxMedication): PillboxMedication {
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

function toPillboxPlanSummary(raw: RawPillboxPlanSummary): PillboxPlanSummary {
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

function toPillboxPlan(raw: RawPillboxPlan): PillboxPlan {
  return {
    id: raw.id,
    familyId: raw.family_id,
    title: raw.title,
    status: raw.status,
    memberAccountIds: raw.member_account_ids ?? [],
    medications: (raw.medications ?? []).map(toPillboxMedication),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toPillboxSeriesPoint(raw: RawPillboxAnalyticsSeriesPoint): PillboxAnalyticsSeriesPoint {
  return {
    label: raw.label,
    value: raw.value,
  };
}

function toPillboxTopMedication(raw: RawPillboxTopMedication): PillboxTopMedication {
  return {
    medicationName: raw.medication_name,
    missedSlots: raw.missed_slots,
  };
}

function toPillboxHistorySummary(raw: RawPillboxHistorySummary): PillboxHistorySummary {
  return {
    period: raw.period,
    totalPlans: raw.total_plans,
    activePlans: raw.active_plans,
    pausedPlans: raw.paused_plans,
    archivedPlans: raw.archived_plans,
    totalMedications: raw.total_medications,
    scheduledSlots: raw.scheduled_slots,
    takenSlots: raw.taken_slots,
    missedSlots: raw.missed_slots,
    lateSlots: raw.late_slots,
    onTimeSlots: raw.on_time_slots,
    adherenceRate: raw.adherence_rate,
    onTimeRate: raw.on_time_rate,
    timeline: (raw.timeline ?? []).map(toPillboxSeriesPoint),
    topMissedMedications: (raw.top_missed_medications ?? []).map(toPillboxTopMedication),
  };
}

function toWritePayload(plan: PillboxPlanWrite) {
  return {
    title: plan.title,
    member_account_ids: plan.memberAccountIds,
    medications: plan.medications.map((item: PillboxMedicationWrite) => ({
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
    ...(plan.status ? { status: plan.status } : {}),
  };
}

export async function fetchPillboxPlans(): Promise<PillboxPlanSummary[]> {
  const res = await apiClient.get<RawPillboxPlanSummary[]>("/pillbox-plans");
  return (res.data ?? []).map(toPillboxPlanSummary);
}

export async function fetchPillboxPlan(planId: string): Promise<PillboxPlan> {
  const res = await apiClient.get<RawPillboxPlan>(`/pillbox-plans/${planId}`);
  return toPillboxPlan(res.data);
}

export async function fetchPillboxHistorySummary(
  period: "month" | "quarter" | "half_year" | "year" | "all"
): Promise<PillboxHistorySummary> {
  const res = await apiClient.get<RawPillboxHistorySummary>("/pillbox-plans/history-summary", {
    params: { period },
  });
  return toPillboxHistorySummary(res.data);
}

export async function createPillboxPlan(payload: PillboxPlanWrite): Promise<PillboxPlan> {
  const res = await apiClient.post<RawPillboxPlan>("/pillbox-plans", toWritePayload(payload));
  return toPillboxPlan(res.data);
}

export async function updatePillboxPlan(
  planId: string,
  payload: PillboxPlanWrite
): Promise<PillboxPlan> {
  const res = await apiClient.patch<RawPillboxPlan>(
    `/pillbox-plans/${planId}`,
    toWritePayload(payload)
  );
  return toPillboxPlan(res.data);
}

export async function deletePillboxPlan(planId: string): Promise<void> {
  await apiClient.delete(`/pillbox-plans/${planId}`);
}

export async function takePillboxDose(
  planId: string,
  medicationId: string,
  payload?: {
    scheduled_for?: string | null;
    taken_at?: string;
    source?: "manual" | "reminder";
    notes?: string | null;
  }
): Promise<PillboxPlanSummary> {
  const res = await apiClient.post<RawPillboxPlanSummary>(
    `/pillbox-plans/${planId}/medications/${medicationId}/take`,
    payload ?? { source: "manual" }
  );
  return toPillboxPlanSummary(res.data);
}
