export function formatElapsedDuration(startedAt: string, now: number) {
  const startedAtMs = Date.parse(startedAt);

  if (Number.isNaN(startedAtMs)) {
    return "—";
  }

  const totalSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    const hoursWithinDay = totalHours % 24;
    return hoursWithinDay > 0
      ? `${totalDays} д ${hoursWithinDay} ч`
      : `${totalDays} д`;
  }

  if (totalHours > 0) {
    const minutesWithinHour = totalMinutes % 60;
    return `${totalHours}:${String(minutesWithinHour).padStart(2, "0")}`;
  }

  const secondsWithinMinute = totalSeconds % 60;
  return `${String(totalMinutes).padStart(2, "0")}:${String(secondsWithinMinute).padStart(2, "0")}`;
}
