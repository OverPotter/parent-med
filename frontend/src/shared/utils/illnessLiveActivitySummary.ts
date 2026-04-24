import type { IllnessEpisodeInsights } from "../types/api.js";

function formatTimeLabel(value: string | null | undefined, language: "ru" | "en"): string | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatTemperatureValue(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toFixed(1)}°`;
}

function parseLiveActivityDate(value: string | null | undefined): Date | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp);
}

function formatDoseClock(value: string | Date | null | undefined, language: "ru" | "en") {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeDoseLabel(
  value: string | Date | null | undefined,
  language: "ru" | "en",
  nowMs = Date.now()
) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = date.getTime() - nowMs;
  if (diffMs <= 0) {
    return language === "ru" ? "Можно дать" : "Ready now";
  }

  const timeLabel = formatDoseClock(date, language);
  if (!timeLabel) {
    return null;
  }

  return language === "ru" ? `Дать в ${timeLabel}` : `Give at ${timeLabel}`;
}

export function getIllnessDurationMeta(
  startedAt: string | null | undefined,
  language: "ru" | "en",
  now = new Date()
): {
  value: string;
  caption: string;
} {
  const startedDate = parseLiveActivityDate(startedAt);
  if (!startedDate) {
    return {
      value: language === "ru" ? "Сейчас" : "Now",
      caption: language === "ru" ? "Началось" : "Started",
    };
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startedDayStart = new Date(
    startedDate.getFullYear(),
    startedDate.getMonth(),
    startedDate.getDate()
  );
  const diffDays = Math.max(
    0,
    Math.floor((todayStart.getTime() - startedDayStart.getTime()) / 86_400_000)
  );

  if (diffDays === 0) {
    return {
      value: language === "ru" ? "Сегодня" : "Today",
      caption: language === "ru" ? "Началось" : "Started",
    };
  }

  if (language === "ru") {
    const mod10 = diffDays % 10;
    const mod100 = diffDays % 100;
    let suffix = "дней";
    if (mod10 === 1 && mod100 !== 11) {
      suffix = "день";
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      suffix = "дня";
    }

    return {
      value: `${diffDays} ${suffix}`,
      caption: "Длится",
    };
  }

  return {
    value: diffDays === 1 ? "1 day" : `${diffDays} days`,
    caption: "Duration",
  };
}

export function buildIllnessMedicationLines(
  insights: Pick<IllnessEpisodeInsights, "lastAdministrationAt" | "medicineNames"> | null | undefined,
  nextDose:
    | {
        nextDoseAt: Date;
        medicineName: string | null;
      }
    | null
    | undefined,
  latestAdministrationMedicineName: string | null | undefined,
  language: "ru" | "en",
  now = new Date()
): {
  primaryLine: string | null;
  secondaryLine: string | null;
} {
  const lastAdministrationTime = formatTimeLabel(insights?.lastAdministrationAt, language);
  const nextDoseMedicineName =
    nextDose?.medicineName?.trim() || insights?.medicineNames?.[0]?.trim() || null;
  const lastAdministrationMedicine =
    latestAdministrationMedicineName?.trim() ||
    insights?.medicineNames?.[0]?.trim() ||
    nextDose?.medicineName?.trim() ||
    null;
  const nextDoseTime = formatDoseClock(nextDose?.nextDoseAt, language);
  const canGiveNow =
    !!nextDose?.nextDoseAt && new Date(nextDose.nextDoseAt).getTime() <= now.getTime();
  const medicineFallback = language === "ru" ? "лекарство" : "medicine";
  const nextDoseMedicineLabel = nextDoseMedicineName ?? medicineFallback;
  const lastDoseMedicineLabel = lastAdministrationMedicine ?? medicineFallback;

  const primaryLine = nextDose?.nextDoseAt
    ? canGiveNow
      ? language === "ru"
        ? `Можно дать ${nextDoseMedicineLabel}`
        : `Can give ${nextDoseMedicineLabel}`
      : nextDoseTime
        ? language === "ru"
          ? `Дать ${nextDoseMedicineLabel} в ${nextDoseTime}`
          : `Give ${nextDoseMedicineLabel} at ${nextDoseTime}`
        : null
    : null;

  const secondaryLine = lastAdministrationTime
    ? language === "ru"
      ? `Дали ${lastDoseMedicineLabel} в ${lastAdministrationTime}`
      : `Gave ${lastDoseMedicineLabel} at ${lastAdministrationTime}`
    : null;

  return { primaryLine, secondaryLine };
}

export function buildIllnessLiveActivitySummary(
  insights: Pick<
    IllnessEpisodeInsights,
    "lastTemperatureCelsius" | "lastAdministrationAt" | "medicineNames" | "lastEventAt"
  > | null | undefined,
  _nextDose:
    | {
        nextDoseAt: Date;
        medicineName: string | null;
      }
    | null
    | undefined,
  startedAt: string | null | undefined,
  language: "ru" | "en",
  now = new Date()
): {
  primaryValue?: string | null;
  primaryCaption?: string | null;
  secondaryValue?: string | null;
  secondaryCaption?: string | null;
} {
  const lastTemperature = formatTemperatureValue(insights?.lastTemperatureCelsius);
  const lastAdministrationTime = formatTimeLabel(insights?.lastAdministrationAt, language);
  const lastEventTime = formatTimeLabel(insights?.lastEventAt, language);
  const firstMedicineName = insights?.medicineNames?.[0]?.trim() || null;
  const durationMeta = getIllnessDurationMeta(startedAt, language, now);
  const temperatureCaption = lastEventTime
    ? language === "ru"
      ? `Была в ${lastEventTime}`
      : `At ${lastEventTime}`
    : language === "ru"
      ? "Температура"
      : "Temperature";
  if (lastTemperature) {
    return {
      primaryValue: lastTemperature,
      primaryCaption: temperatureCaption,
      secondaryValue: null,
      secondaryCaption: null,
    };
  }

  if (lastAdministrationTime) {
    return {
      primaryValue: lastAdministrationTime,
      primaryCaption: firstMedicineName
        ? language === "ru"
          ? `Последнее лекарство · ${firstMedicineName}`
          : `Latest medication · ${firstMedicineName}`
        : language === "ru"
          ? "Последнее лекарство"
          : "Latest medication",
      secondaryValue: durationMeta.value,
      secondaryCaption: durationMeta.caption,
    };
  }

  if (lastEventTime) {
    return {
      primaryValue: lastEventTime,
      primaryCaption: language === "ru" ? "Последняя запись" : "Latest event",
      secondaryValue: durationMeta.value,
      secondaryCaption: durationMeta.caption,
    };
  }

  return {
    primaryValue: durationMeta.value,
    primaryCaption: durationMeta.caption,
    secondaryValue: null,
    secondaryCaption: null,
  };
}
