import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function formatReminderIntervalForUnit(
  minutes: number,
  unit: "hours" | "minutes",
  locale: MobileLocale,
) {
  if (unit === "hours") {
    const hours = Math.round((minutes / 60) * 10) / 10;
    const formatted = Number.isInteger(hours)
      ? String(hours)
      : String(hours).replace(".", ",");
    return locale === "ru"
      ? `${formatted} ч`
      : locale === "de"
        ? `${formatted} Std.`
        : locale === "pl"
          ? `${formatted} godz.`
          : `${formatted} h`;
  }

  return locale === "ru"
    ? `${minutes} мин`
    : locale === "de"
      ? `${minutes} Min.`
      : locale === "pl"
        ? `${minutes} min`
        : `${minutes} min`;
}
