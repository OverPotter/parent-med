import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MedicationIntervalUnit } from "../../settings/session/mobileSettingsPreferencesStorage";
import { formatReminderIntervalForUnit } from "./useReminderActionState";

export type ReminderNumberSheetOption = {
  value: number;
  label: string;
  hint?: string;
};

export function getReminderIntervalCustomLabel(locale: MobileLocale) {
  return locale === "ru"
    ? "Свое время"
    : locale === "de"
      ? "Eigene Zeit"
      : locale === "pl"
        ? "Własny czas"
        : "Custom time";
}

export function getReminderLimitCustomLabel(locale: MobileLocale) {
  return locale === "ru"
    ? "Свой лимит"
    : locale === "de"
      ? "Eigenes Limit"
      : locale === "pl"
        ? "Własny limit"
        : "Custom limit";
}

export function buildReminderIntervalSheetOptions(
  unit: MedicationIntervalUnit,
  locale: MobileLocale,
): ReminderNumberSheetOption[] {
  return [180, 240, 360, 480, 720].map((value) => ({
    value,
    label: formatReminderIntervalForUnit(value, unit, locale),
    hint: unit === "hours" ? `${value} мин` : undefined,
  }));
}

export function buildReminderLimitSheetOptions(): ReminderNumberSheetOption[] {
  return [1, 2, 3, 4, 5, 6, 8].map((value) => ({
    value,
    label: String(value),
  }));
}

export function toReminderIntervalCustomValue(
  minutes: number,
  unit: MedicationIntervalUnit,
) {
  if (unit === "hours" && minutes > 0) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return Number.isInteger(hours) ? String(hours) : String(hours);
  }

  return String(minutes);
}

export function getReminderCustomIntervalPlaceholder(
  unit: MedicationIntervalUnit,
  locale: MobileLocale,
) {
  if (unit === "hours") {
    return locale === "ru"
      ? "Например: 3"
      : locale === "de"
        ? "Zum Beispiel: 3"
        : locale === "pl"
          ? "Na przykład: 3"
          : "For example: 3";
  }

  return "180";
}
