export const childActionPrimaryClass =
  "soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] shadow-[0_14px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(15,23,42,0.16)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45 disabled:shadow-none sm:min-h-[2.6rem] sm:text-[0.82rem]";

export const childActionSecondaryClass =
  "soft-pill app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";

export const childActionSuccessClass =
  "soft-pill-success app-profile-action app-profile-action--active min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";

export function formatWeightValue(valueKg: number, language: "ru" | "en"): string {
  const unit = language === "ru" ? "кг" : "kg";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} ${unit}`;
}

export function commonLoading(language: "ru" | "en") {
  return language === "ru" ? "Открываем…" : "Opening…";
}

export function formatTimeOnly(value: string | number, language: "ru" | "en") {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDurationMinutesHuman(
  durationMinutes: number | null,
  language: "ru" | "en",
  options: { emptyLabel?: string } = {}
) {
  if (durationMinutes === null || !Number.isFinite(durationMinutes)) {
    return options.emptyLabel ?? "—";
  }

  const rounded = Math.max(0, Math.floor(durationMinutes));
  if (rounded <= 0) {
    return language === "ru" ? "меньше минуты" : "under a minute";
  }

  const hours = Math.floor(rounded / 60);
  const days = Math.floor(hours / 24);
  const hoursWithinDay = hours % 24;
  const minutes = rounded % 60;
  if (language === "ru") {
    if (days > 0 && hoursWithinDay > 0) return `${days} д ${hoursWithinDay} ч`;
    if (days > 0) return `${days} д`;
    if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`;
    if (hours > 0) return `${hours} ч`;
    return `${minutes} мин`;
  }
  if (days > 0 && hoursWithinDay > 0) return `${days} d ${hoursWithinDay} h`;
  if (days > 0) return `${days} d`;
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

export function formatElapsedDuration(startedAt: string, now: number, language: "ru" | "en") {
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
    if (language === "ru") {
      return hoursWithinDay > 0 ? `${totalDays} д ${hoursWithinDay} ч` : `${totalDays} д`;
    }
    return hoursWithinDay > 0 ? `${totalDays} d ${hoursWithinDay} h` : `${totalDays} d`;
  }

  if (totalHours > 0) {
    const minutesWithinHour = totalMinutes % 60;
    return `${totalHours}:${String(minutesWithinHour).padStart(2, "0")}`;
  }

  const secondsWithinMinute = totalSeconds % 60;
  return `${String(totalMinutes).padStart(2, "0")}:${String(secondsWithinMinute).padStart(2, "0")}`;
}

export function formatIllnessDuration(startedAt: string, now: number, language: "ru" | "en") {
  if (/^\d{4}-\d{2}-\d{2}$/.test(startedAt.trim())) {
    const [year, month, day] = startedAt.split("-").map(Number);
    if (
      year !== undefined &&
      month !== undefined &&
      day !== undefined &&
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      const startDate = new Date(year, month - 1, day);
      const currentDate = new Date(now);
      const startMidnight = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      ).getTime();
      const currentMidnight = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ).getTime();
      const totalDays = Math.max(1, Math.floor((currentMidnight - startMidnight) / 86_400_000) + 1);

      if (language === "ru") {
        const mod10 = totalDays % 10;
        const mod100 = totalDays % 100;
        if (mod10 === 1 && mod100 !== 11) return `${totalDays} день`;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${totalDays} дня`;
        return `${totalDays} дней`;
      }

      return `${totalDays} ${totalDays === 1 ? "day" : "days"}`;
    }
  }

  const startedAtMs = Date.parse(startedAt);
  if (Number.isNaN(startedAtMs)) {
    return language === "ru" ? "1 день" : "1 day";
  }

  const totalMinutes = Math.max(0, Math.floor((now - startedAtMs) / 60_000));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.max(1, Math.floor(totalHours / 24) + 1);

  if (language === "ru") {
    const mod10 = totalDays % 10;
    const mod100 = totalDays % 100;
    if (mod10 === 1 && mod100 !== 11) return `${totalDays} день`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${totalDays} дня`;
    return `${totalDays} дней`;
  }

  return `${totalDays} ${totalDays === 1 ? "day" : "days"}`;
}

export function formatIllnessActiveLabel(startedAt: string, now: number, language: "ru" | "en") {
  if (/^\d{4}-\d{2}-\d{2}$/.test(startedAt.trim())) {
    const duration = formatIllnessDuration(startedAt, now, language);
    if (duration === (language === "ru" ? "1 день" : "1 day")) {
      return language === "ru" ? "Наблюдение" : "Observation";
    }
    return language === "ru" ? `Наблюдение · ${duration}` : `Observation · ${duration}`;
  }

  const startedAtMs = Date.parse(startedAt);
  if (Number.isNaN(startedAtMs)) {
    return language === "ru" ? "Наблюдение" : "Observation";
  }

  const totalMinutes = Math.max(0, Math.floor((now - startedAtMs) / 60_000));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    const duration = formatIllnessDuration(startedAt, now, language);
    return language === "ru" ? `Наблюдение · ${duration}` : `Observation · ${duration}`;
  }

  if (totalHours > 0) {
    return language === "ru"
      ? `Наблюдение · ${totalHours} ч`
      : `Observation · ${totalHours} h`;
  }

  const minutes = Math.max(1, totalMinutes);
  return language === "ru"
    ? `Наблюдение · ${minutes} мин`
    : `Observation · ${minutes} min`;
}
