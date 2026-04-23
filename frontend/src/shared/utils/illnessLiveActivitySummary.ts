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

function joinLiveActivityParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" · ");
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
  const totalMinutes = Math.max(0, Math.ceil(diffMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return language === "ru" ? "меньше чем через минуту" : "under a minute";
  }
  if (hours === 0) {
    return language === "ru" ? `через ${minutes} мин` : `in ${minutes} min`;
  }
  if (minutes === 0) {
    return language === "ru" ? `через ${hours} ч` : `in ${hours} h`;
  }
  return language === "ru" ? `через ${hours} ч ${minutes} мин` : `in ${hours} h ${minutes} min`;
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

export function buildIllnessStatusLabel(
  _episodeTitle: string | null | undefined,
  insights: Pick<
    IllnessEpisodeInsights,
    "lastAdministrationAt" | "medicineNames" | "lastEventAt"
  > | null | undefined,
  language: "ru" | "en"
) {
  const medicine = insights?.medicineNames?.[0]?.trim() || null;
  const administrationTime = formatTimeLabel(insights?.lastAdministrationAt, language);
  const latestEventTime = formatTimeLabel(insights?.lastEventAt, language);

  if (medicine && latestEventTime) {
    return joinLiveActivityParts([
      medicine,
      language === "ru" ? `запись ${latestEventTime}` : `entry ${latestEventTime}`,
    ]);
  }

  if (latestEventTime) {
    return language === "ru" ? `Последняя запись ${latestEventTime}` : `Latest event ${latestEventTime}`;
  }

  if (medicine) {
    return medicine;
  }

  return administrationTime;
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
  const nextDoseRelative = formatRelativeDoseLabel(nextDose?.nextDoseAt, language, now.getTime());

  const primaryLine = nextDoseRelative
    ? language === "ru"
      ? `${nextDoseMedicineName ?? "Таблетка"} · ${nextDoseRelative}`
      : `${nextDoseMedicineName ?? "Medicine"} · ${nextDoseRelative}`
    : null;

  const secondaryLine = lastAdministrationTime
    ? language === "ru"
      ? `${lastAdministrationMedicine ?? "Таблетка"} дали в ${lastAdministrationTime}`
      : `${lastAdministrationMedicine ?? "Medicine"} given at ${lastAdministrationTime}`
    : null;

  return { primaryLine, secondaryLine };
}

export function buildIllnessLiveActivitySummary(
  insights: Pick<
    IllnessEpisodeInsights,
    "lastTemperatureCelsius" | "lastAdministrationAt" | "medicineNames" | "lastEventAt"
  > | null | undefined,
  nextDose:
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
  const nextDoseRelative = formatRelativeDoseLabel(nextDose?.nextDoseAt, language, now.getTime());
  const durationMeta = getIllnessDurationMeta(startedAt, language, now);
  const temperatureCaption = lastEventTime
    ? language === "ru"
      ? `Была в ${lastEventTime}`
      : `At ${lastEventTime}`
    : language === "ru"
      ? "Температура"
      : "Temperature";
  const nextDoseCaption = nextDose
    ? nextDose.medicineName
      ? nextDose.medicineName
      : language === "ru"
        ? "Таблетка"
        : "Medicine"
    : null;

  if (nextDoseRelative && lastTemperature) {
    return {
      primaryValue: lastTemperature,
      primaryCaption: temperatureCaption,
      secondaryValue: nextDoseRelative,
      secondaryCaption: nextDoseCaption,
    };
  }

  if (nextDoseRelative) {
    return {
      primaryValue: nextDoseRelative,
      primaryCaption: nextDoseCaption,
      secondaryValue: lastEventTime ?? durationMeta.value,
      secondaryCaption: lastEventTime
        ? language === "ru"
          ? "Последняя запись"
          : "Latest event"
        : durationMeta.caption,
    };
  }

  if (lastTemperature) {
    return {
      primaryValue: lastTemperature,
      primaryCaption: temperatureCaption,
      secondaryValue: durationMeta.value,
      secondaryCaption: durationMeta.caption,
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
