export function getCurrentLocalDateTimeInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getCurrentLocalDateInputValue() {
  return getCurrentLocalDateTimeInputValue().slice(0, 10);
}

export function getCurrentLocalTimeInputValue() {
  return getCurrentLocalDateTimeInputValue().slice(11, 16);
}

export function toApiDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) {
    return null;
  }
  return `${dateValue}T${timeValue}:00`;
}

function normalizeTimePart(raw: string, max: number) {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  const bounded = Math.min(Number(digits), max);
  return String(bounded).padStart(2, "0");
}

export function normalizeTimeInput(raw: string) {
  const cleaned = raw.replace(/[^\d:]/g, "");
  const hasColon = cleaned.includes(":");
  const digits = cleaned.replace(/:/g, "").slice(0, 4);

  if (!digits) return "";

  const hourDigits = digits.slice(0, 2);
  const minuteDigits = digits.slice(2, 4);

  if (hasColon) {
    return `${hourDigits}${cleaned.endsWith(":") && !minuteDigits ? ":" : minuteDigits ? `:${minuteDigits}` : ""}`;
  }

  if (digits.length <= 2) {
    return hourDigits;
  }

  return `${hourDigits}:${minuteDigits}`;
}

export function finalizeTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);

  if (!digits) return "08:30";
  if (digits.length <= 2) return `${normalizeTimePart(digits, 23) || "08"}:00`;

  return `${normalizeTimePart(digits.slice(0, 2), 23) || "08"}:${normalizeTimePart(digits.slice(2), 59) || "00"}`;
}
