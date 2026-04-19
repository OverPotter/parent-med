export const childActionPrimaryClass =
  "soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";

export const childActionSecondaryClass =
  "soft-pill app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";

export const childActionSuccessClass =
  "soft-pill-success app-profile-action app-profile-action--active min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";

export const childActionWarningClass =
  "soft-pill-warning app-profile-action app-profile-action--active min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";

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

export function formatElapsedDuration(startedAt: string, now: number, _language: "ru" | "en") {
  const startedAtMs = Date.parse(startedAt);
  if (Number.isNaN(startedAtMs)) {
    return "00:00";
  }
  const totalSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
