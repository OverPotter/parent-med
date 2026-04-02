/** Контракт API семейной таблетницы. */

export type PillboxMealRule = "before_meal" | "with_meal" | "after_meal";
export type PillboxCourseMode = "continuous" | "period";
export type PillboxPlanStatus = "active" | "paused" | "archived";

export interface PillboxMedicationWrite {
  id?: string | null;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  mealRule: PillboxMealRule;
  repeatDays: number[];
  times: string[];
  courseMode: PillboxCourseMode;
  courseStartDate: string | null;
  courseEndDate: string | null;
  position: number;
}

export interface PillboxPlanWrite {
  title: string;
  memberAccountIds: string[];
  medications: PillboxMedicationWrite[];
  status?: PillboxPlanStatus;
}

export interface PillboxPlanSummary {
  id: string;
  title: string;
  status: PillboxPlanStatus;
  memberAccountIds: string[];
  activeMedicationCount: number;
  nextDoseAt: string | null;
  nextDoseLabel: string | null;
  nextMedicationId: string | null;
  nextMedicationTitle: string | null;
  courseSummaryKind: "continuous" | "period" | "mixed" | null;
  courseProgressRatio: number | null;
  courseDayLabel: string | null;
}

export interface PillboxMedication {
  id: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  mealRule: PillboxMealRule;
  repeatDays: number[];
  times: string[];
  courseMode: PillboxCourseMode;
  courseStartDate: string | null;
  courseEndDate: string | null;
  position: number;
}

export interface PillboxPlan {
  id: string;
  familyId: string;
  title: string;
  status: PillboxPlanStatus;
  memberAccountIds: string[];
  medications: PillboxMedication[];
  createdAt: string;
  updatedAt: string;
}
