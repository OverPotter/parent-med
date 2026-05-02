function parseDateValue(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    const date = new Date(year || 1970, (month || 1) - 1, day || 1);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLocalizedDate(
  value: string | null | undefined,
  language: "ru" | "en" = "ru"
): string {
  if (!value) return "";
  const parsed = parseDateValue(value);
  if (!parsed) return value;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return language === "ru" ? `${day}.${month}.${year}` : `${month}/${day}/${year}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseDateValue(value);
  if (!parsed) return value;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}-${month}-${year}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseDateValue(value);
  const formattedDate = formatDate(value);
  if (!parsed) return formattedDate;
  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
  return `${formattedDate} ${formattedTime}`;
}

export function getLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isFutureDeviceDate(
  dateValue: string | null | undefined,
  now = new Date()
): boolean {
  if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
    return false;
  }
  return dateValue.trim() > getLocalIsoDate(now);
}

function padDatePart(value: number, length = 2): string {
  return String(Math.trunc(Math.abs(value))).padStart(length, "0");
}

export function getCurrentDeviceTimestampIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());
  const milliseconds = padDatePart(date.getMilliseconds(), 3);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = padDatePart(Math.floor(absoluteOffsetMinutes / 60));
  const offsetRemainderMinutes = padDatePart(absoluteOffsetMinutes % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetRemainderMinutes}`;
}

export function toDeviceDateTimeIso(
  dateValue: string | null | undefined,
  timeValue: string | null | undefined
): string | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hours === undefined ||
    minutes === undefined ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (Number.isNaN(localDate.getTime())) {
    return null;
  }

  return localDate.toISOString();
}
