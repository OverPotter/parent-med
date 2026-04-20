type AppLanguage = "ru" | "en";

type ChildDateMonthStyle = "long" | "short";

function getDatePart(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTimePart(value: string | null | undefined, language: AppLanguage): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    const timePart = trimmed.slice(11, 16);
    return /^\d{2}:\d{2}$/.test(timePart) ? timePart : null;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function getTodayDatePart(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getShiftedDatePart(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(datePart: string): Date {
  return new Date(`${datePart}T00:00:00`);
}

function shouldShowYear(datePart: string): boolean {
  return Number(datePart.slice(0, 4)) !== new Date().getFullYear();
}

function formatCalendarDate(
  datePart: string,
  language: AppLanguage,
  month: ChildDateMonthStyle,
  forceYear = false
): string {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month,
    year: forceYear || shouldShowYear(datePart) ? "numeric" : undefined,
  }).format(parseLocalDate(datePart));
}

function formatMonthName(datePart: string, language: AppLanguage): string {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    month: "long",
  }).format(parseLocalDate(datePart));
}

export function formatChildDate(
  value: string | null | undefined,
  language: AppLanguage,
  options: { month?: ChildDateMonthStyle; relative?: boolean; forceYear?: boolean } = {}
): string {
  const datePart = getDatePart(value);
  if (!datePart) return value ?? "";

  if (options.relative !== false) {
    if (datePart === getTodayDatePart()) return language === "ru" ? "Сегодня" : "Today";
    if (datePart === getShiftedDatePart(-1)) return language === "ru" ? "Вчера" : "Yesterday";
  }

  return formatCalendarDate(datePart, language, options.month ?? "long", options.forceYear);
}

export function formatChildDatePlain(
  value: string | null | undefined,
  language: AppLanguage,
  options: { month?: ChildDateMonthStyle; forceYear?: boolean } = {}
): string {
  return formatChildDate(value, language, { ...options, relative: false });
}

export function formatChildDateTime(
  value: string | null | undefined,
  language: AppLanguage,
  options: { month?: ChildDateMonthStyle; relative?: boolean } = {}
): string {
  const timePart = getTimePart(value, language);
  const dateLabel = formatChildDate(value, language, {
    month: options.month ?? "short",
    relative: options.relative,
  });

  if (!timePart) return dateLabel;
  if (!dateLabel) return timePart;

  return `${timePart} · ${dateLabel}`;
}

export function formatChildTime(value: string | null | undefined, language: AppLanguage = "ru"): string {
  return getTimePart(value, language) ?? "";
}

export function formatChildDateRange(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
  language: AppLanguage
): string {
  const startPart = getDatePart(startedAt);
  const endPart = getDatePart(endedAt);

  if (!startPart) return "";
  if (!endPart) {
    return `${language === "ru" ? "с" : "since"} ${formatChildDate(startedAt, language)}`;
  }
  if (startPart === endPart) {
    return formatChildDate(startedAt, language);
  }

  const [startYear, startMonth, startDay] = startPart.split("-");
  const [endYear, endMonth, endDay] = endPart.split("-");
  const sameYear = startYear === endYear;
  const sameMonth = sameYear && startMonth === endMonth;
  const includeYear = !sameYear || shouldShowYear(startPart) || shouldShowYear(endPart);

  if (sameMonth) {
    const monthLabel = formatMonthName(endPart, language);
    const yearLabel = includeYear ? ` ${endYear}` : "";
    if (language === "ru") {
      return `${Number(startDay)}–${Number(endDay)} ${monthLabel}${yearLabel}`;
    }
    return `${monthLabel} ${Number(startDay)}–${Number(endDay)}${yearLabel ? `,${yearLabel}` : ""}`;
  }

  const startLabel = formatCalendarDate(startPart, language, "long", includeYear);
  const endLabel = formatCalendarDate(endPart, language, "long", includeYear);
  return `${startLabel} – ${endLabel}`;
}
