import type { HouseholdMedicine } from "../../../shared/types/api.js";

const APP_BTN_FILLED_CLASS =
  "illness-action-shell soft-pill-primary app-profile-action app-profile-action--selected";

export type MedicationPlanPayload = {
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay: number | null;
  weightKg: number | null;
  doseMgPerKg: number | null;
  calculatedDoseMg: number | null;
  calculatedDoseValue: number | null;
  calculatedDoseUnit: string | null;
  doseCalcMode: string | null;
  doseCalcWarning: string | null;
  manualDoseOverride: boolean;
  notes: string | null;
  firstDoseStatus?: "already_given" | "not_given";
  firstDoseAt?: string | null;
};

export function formatMedicineCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "препарат";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "препарата";
  }
  return "препаратов";
}

export function getMedicineStatusLabel(
  medicine: Pick<HouseholdMedicine, "status" | "statusLabel">,
  language: "ru" | "en"
) {
  if (language === "ru") {
    return medicine.statusLabel;
  }

  const labels: Record<string, string> = {
    expired: "Expired",
    expired_after_opening: "Expired after opening",
    expiring_after_opening: "Expiring after opening",
    expiring_soon: "Expiring soon",
    ok: "Ready to use",
  };

  return labels[medicine.status] ?? medicine.statusLabel;
}

export function intervalMinutesToInputValue(intervalMinutes: number, unit: "hours" | "minutes") {
  if (unit === "minutes") {
    return String(intervalMinutes);
  }
  const hours = intervalMinutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

export function parseIntervalInputToMinutes(
  value: string,
  unit: "hours" | "minutes"
): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return unit === "minutes" ? Math.round(parsed) : Math.round(parsed * 60);
}

export function parseNullableInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseNullableNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) {
    return null;
  }

  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function hasDoseUnitHint(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && !/[A-Za-zА-Яа-я]/.test(trimmed);
}

export function canSubmitMedicationPlanComposer(params: {
  isPending: boolean;
  planMode: "cabinet" | "manual";
  selectedMedicineId: string;
  customMedicineName: string;
  doseAmount: string;
  minIntervalInput: string;
  parsedIntervalMinutes: number | null;
  hasFutureFirstDoseSelection: boolean;
}) {
  if (params.isPending) {
    return false;
  }

  if (
    params.planMode === "cabinet" ? !params.selectedMedicineId : !params.customMedicineName.trim()
  ) {
    return false;
  }

  if (!params.doseAmount.trim()) {
    return false;
  }

  if (!params.minIntervalInput || params.parsedIntervalMinutes === null) {
    return false;
  }

  if (params.hasFutureFirstDoseSelection) {
    return false;
  }

  return true;
}

export function reminderModeButtonClass(isActive: boolean, secondaryClass: string) {
  return isActive
    ? `${APP_BTN_FILLED_CLASS} min-h-[2.65rem] px-3.5 text-[0.82rem] tracking-[-0.025em] sm:min-h-[2.75rem] sm:text-[0.84rem]`
    : `${secondaryClass} min-h-[2.65rem] px-3.5 text-[0.82rem] tracking-[-0.025em] sm:min-h-[2.75rem] sm:text-[0.84rem]`;
}
