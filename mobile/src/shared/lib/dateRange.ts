import type { MobileLocale } from "../i18n/mobileI18n";

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

export function toDateOnlyIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnlyIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return new Date();
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

export function formatDateRangeLabel(
  range: DateRangeValue,
  locale: MobileLocale,
) {
  const start = parseDateOnlyIso(range.startDate);
  const end = parseDateOnlyIso(range.endDate);
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function localizeCustomDateRangeLabel(locale: MobileLocale) {
  if (locale === "ru") return "Свои даты";
  if (locale === "de") return "Eigene Daten";
  if (locale === "pl") return "Własne daty";
  return "Custom dates";
}

export function localizeCustomDateRangeSubtitle(locale: MobileLocale) {
  if (locale === "ru") return "за выбранные даты";
  if (locale === "de") return "für die gewählten Daten";
  if (locale === "pl") return "dla wybranych dat";
  return "for the selected dates";
}

export function normalizeDateRange(range: DateRangeValue): DateRangeValue {
  if (range.startDate <= range.endDate) {
    return range;
  }

  return {
    startDate: range.endDate,
    endDate: range.startDate,
  };
}

export function buildRangeFromTrailingDays(dayCount: number): DateRangeValue {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(dayCount - 1, 0));

  return {
    startDate: toDateOnlyIso(start),
    endDate: toDateOnlyIso(end),
  };
}

export function buildRangeFromAllTime(values: string[]): DateRangeValue {
  const dates = values
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (dates.length === 0) {
    return buildRangeFromTrailingDays(30);
  }

  const start = dates[0];
  const end = dates[dates.length - 1];
  return {
    startDate: toDateOnlyIso(start),
    endDate: toDateOnlyIso(end),
  };
}

export function getInclusiveDaySpan(range: DateRangeValue) {
  const start = parseDateOnlyIso(range.startDate);
  const end = parseDateOnlyIso(range.endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1, 1);
}

export function isDateWithinRange(value: string, range: DateRangeValue) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const start = parseDateOnlyIso(range.startDate);
  const end = parseDateOnlyIso(range.endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function resolveLocale(locale: MobileLocale) {
  if (locale === "ru") return "ru-RU";
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  return "en-US";
}
