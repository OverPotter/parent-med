import type { ReminderNumberSheetOption } from "../../illness/screens/reminderNumberOptions";

export type AfterOpeningMode = "14" | "30" | "60" | "custom" | null;

export const afterOpeningShelfOptions: ReminderNumberSheetOption[] = [14, 30, 60].map(
  (value) => ({
    value,
    label: `${value} дн.`,
  }),
);

export function resolveAfterOpeningMode(
  value: string | number | null | undefined,
): AfterOpeningMode {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized === "14" || normalized === "30" || normalized === "60") {
    return normalized;
  }

  return "custom";
}

export function normalizeAfterOpeningCustomValue(value: string) {
  const digitsOnly = value.trim().replace(/[^\d]/g, "");
  return digitsOnly.replace(/^0+/, "");
}
