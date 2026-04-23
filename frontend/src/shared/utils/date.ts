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

export function isFutureDeviceDate(dateValue: string | null | undefined, now = new Date()): boolean {
  if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
    return false;
  }
  return dateValue.trim() > getLocalIsoDate(now);
}

export function getCurrentDeviceTimestampIso(date = new Date()): string {
  return date.toISOString();
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
