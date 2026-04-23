export function toLocalDateTime(dateValue: string, timeValue: string) {
  const [parsedYear, parsedMonth, parsedDay] = dateValue
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const [parsedHours, parsedMinutes] = timeValue
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  const year = parsedYear ?? 0;
  const month = parsedMonth ?? 1;
  const day = parsedDay ?? 1;
  const hours = parsedHours ?? 0;
  const minutes = parsedMinutes ?? 0;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFutureFirstAdministrationSelection(
  dateValue: string,
  timeValue: string,
  now = new Date()
) {
  const selectedAt = toLocalDateTime(dateValue, timeValue);
  if (!selectedAt) {
    return false;
  }
  return selectedAt.getTime() > now.getTime();
}
