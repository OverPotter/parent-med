import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

function t<T extends string>(
  locale: MobileLocale,
  values: Record<MobileLocale, T>,
) {
  return values[locale];
}

export function buildPillboxMedicineCountLabel(
  count: number,
  locale: MobileLocale,
) {
  if (locale === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
      return `${count} лекарство`;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} лекарства`;
    }
    return `${count} лекарств`;
  }

  if (locale === "de") {
    return `${count} ${count === 1 ? "Medikament" : "Medikamente"}`;
  }

  if (locale === "pl") {
    if (count === 1) {
      return "1 lek";
    }
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
      return `${count} leki`;
    }
    return `${count} leków`;
  }

  return `${count} ${count === 1 ? "medicine" : "medicines"}`;
}

export function buildPillboxNextInfoLabel(input: {
  locale: MobileLocale;
  times: string[];
  variant?: "sentence" | "compact";
}) {
  const nextTime = [...input.times].sort()[0];
  const variant = input.variant ?? "sentence";

  if (!nextTime) {
    return variant === "compact"
      ? t(input.locale, {
          ru: "расписание настроено",
          en: "schedule is set",
          de: "Zeitplan ist gesetzt",
          pl: "plan jest ustawiony",
        })
      : t(input.locale, {
          ru: "Расписание настроено",
          en: "Schedule is set",
          de: "Zeitplan ist gesetzt",
          pl: "Plan jest ustawiony",
        });
  }

  if (variant === "compact") {
    return t(input.locale, {
      ru: `следующий в ${nextTime}`,
      en: `next at ${nextTime}`,
      de: `nächste um ${nextTime}`,
      pl: `następny o ${nextTime}`,
    });
  }

  return t(input.locale, {
    ru: `Следующий приём в ${nextTime}`,
    en: `Next intake at ${nextTime}`,
    de: `Nächste Einnahme um ${nextTime}`,
    pl: `Następne przyjęcie o ${nextTime}`,
  });
}

export function localizePillboxMealRule(
  value: "before_meal" | "with_meal" | "after_meal" | "not_matter",
  locale: MobileLocale,
) {
  if (value === "before_meal") {
    return t(locale, {
      ru: "До еды",
      en: "Before meal",
      de: "Vor dem Essen",
      pl: "Przed posiłkiem",
    });
  }
  if (value === "with_meal") {
    return t(locale, {
      ru: "Во время еды",
      en: "With meal",
      de: "Mit dem Essen",
      pl: "W trakcie posiłku",
    });
  }
  if (value === "after_meal") {
    return t(locale, {
      ru: "После еды",
      en: "After meal",
      de: "Nach dem Essen",
      pl: "Po posiłku",
    });
  }

  return t(locale, {
    ru: "Независимо от еды",
    en: "Independent of meal",
    de: "Unabhängig vom Essen",
    pl: "Niezależnie od posiłku",
  });
}

export function localizePillboxCourse(
  mode: "period" | "continuous",
  courseEndDate: string | null,
  locale: MobileLocale,
) {
  if (mode !== "period") {
    return t(locale, {
      ru: "Постоянно",
      en: "Continuous",
      de: "Fortlaufend",
      pl: "Ciągle",
    });
  }

  if (!courseEndDate) {
    return t(locale, {
      ru: "Курсом",
      en: "Course",
      de: "Kur",
      pl: "Kuracyjnie",
    });
  }

  return t(locale, {
    ru: `До ${courseEndDate}`,
    en: `Until ${courseEndDate}`,
    de: `Bis ${courseEndDate}`,
    pl: `Do ${courseEndDate}`,
  });
}

export function localizePillboxFallback(
  key: "noRecipients" | "untitled" | "noTime",
  locale: MobileLocale,
) {
  if (key === "noRecipients") {
    return t(locale, {
      ru: "Без уведомлений",
      en: "No recipients",
      de: "Keine Empfänger",
      pl: "Brak odbiorców",
    });
  }

  if (key === "untitled") {
    return t(locale, {
      ru: "Без названия",
      en: "Untitled",
      de: "Ohne Titel",
      pl: "Bez nazwy",
    });
  }

  return t(locale, {
    ru: "Без времени",
    en: "No time",
    de: "Keine Uhrzeit",
    pl: "Brak godziny",
  });
}

export function localizePillboxStatus(
  key: "active" | "paused" | "soon" | "missed",
  locale: MobileLocale,
) {
  if (key === "active") {
    return t(locale, {
      ru: "Активен",
      en: "Active",
      de: "Aktiv",
      pl: "Aktywny",
    });
  }

  if (key === "paused") {
    return t(locale, {
      ru: "На паузе",
      en: "Paused",
      de: "Pausiert",
      pl: "Wstrzymany",
    });
  }

  if (key === "soon") {
    return t(locale, {
      ru: "Скоро",
      en: "Soon",
      de: "Bald",
      pl: "Wkrótce",
    });
  }

  return t(locale, {
    ru: "Пропуск",
    en: "Missed",
    de: "Verpasst",
    pl: "Pominięto",
  });
}

export function getPillboxWeekdayLabels(locale: MobileLocale) {
  if (locale === "ru") {
    return ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;
  }
  if (locale === "de") {
    return ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
  }
  if (locale === "pl") {
    return ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"] as const;
  }
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
}

export function localizePillboxRepeatDays(
  repeatDays: number[],
  locale: MobileLocale,
) {
  const normalized = [...new Set(repeatDays)].sort((left, right) => left - right);
  if (normalized.length === 0 || normalized.length === 7) {
    return t(locale, {
      ru: "Каждый день",
      en: "Every day",
      de: "Jeden Tag",
      pl: "Codziennie",
    });
  }

  const labels = getPillboxWeekdayLabels(locale);
  return normalized
    .map((day) => labels[day - 1])
    .filter(Boolean)
    .join(", ");
}
