/**
 * Нормализация значений из HTML date inputs перед отправкой в API.
 */

function isIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parts = value.split("-").map(Number);
  const [year, month, day] = parts;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function normalizeIsoDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return isIsoDateString(trimmed) ? trimmed : null;
}
