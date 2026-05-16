import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";
import type { MobileSleepSession } from "../api/sleepSessionsApi";

const sleepSpec = journalScreenSpecs.sleep;

type SleepMetricSpec = {
  icon: "night_sleep" | "clock" | "zzz";
  value: string;
  value_suffix: string;
  label: string;
};

type SleepSpec = {
  layout_blueprint: {
    heading: {
      title: string;
      subtitle: string;
    };
    segmented_control: {
      labels: string[];
      active_label: string;
    };
    hero_summary_card: {
      title: string;
      subtitle: string;
      metrics: SleepMetricSpec[];
    };
    history_section: {
      title: string;
    };
  };
};

export type SleepPeriodId = "24h" | "7d" | "30d" | "all";

export type SleepPeriodOption = {
  id: SleepPeriodId;
  label: string;
  active: boolean;
};

export type SleepMetric = {
  id: "night_sleep" | "clock" | "zzz";
  icon: "night_sleep" | "clock" | "zzz";
  value: string;
  suffix: string;
  label: string;
};

export type SleepTimelineItem = {
  id: string;
  time: string;
  day: string;
  type: string;
  icon: "night_sleep" | "day_sleep";
  meta: string;
  badgeBackground: string;
  badgeIconColor: string;
};

export type SleepHistoryScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  periods: SleepPeriodOption[];
  heroTitle: string;
  heroSubtitle: string;
  metrics: SleepMetric[];
  historyTitle: string;
};

const spec = sleepSpec as SleepSpec;

export function buildSleepHistoryScreenContent(
  locale: MobileLocale,
  childName: string,
  activePeriodId?: string,
): SleepHistoryScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const defaultPeriodId = mapSleepPeriodId(
    spec.layout_blueprint.segmented_control.active_label,
  );
  const activePeriod = mapSleepPeriodId(activePeriodId ?? defaultPeriodId);

  return {
    backLabel: isRu
      ? "К профилю ребёнка"
      : isDe
        ? "Zum Kinderprofil"
        : isPl
          ? "Do profilu dziecka"
          : "Back to child profile",
    title: isRu
      ? `Сон • ${childName}`
      : isDe
        ? `Schlaf • ${childName}`
        : isPl
          ? `Sen • ${childName}`
          : `Sleep • ${childName}`,
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Schlafverlauf des Kindes und schneller Zugriff auf gespeicherte Schlafphasen."
        : isPl
          ? "Historia snu dziecka i szybki dostęp do zapisanych sesji snu."
          : "Child sleep history and quick access to saved sleep sessions.",
    periods: periods.map((label) => ({
      id: mapSleepPeriodId(label),
      label: localizePeriodLabel(label, locale),
      active: mapSleepPeriodId(label) === activePeriod,
    })),
    heroTitle: isRu
      ? `Как спал ${childName}`
      : isDe
        ? `Wie ${childName} geschlafen hat`
        : isPl
          ? `Jak spał ${childName}`
          : `How ${childName} slept`,
    heroSubtitle: localizePeriodSubtitle(activePeriod, locale),
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: metric.icon,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label: localizeMetricLabel(metric.label, locale),
    })),
    historyTitle: isRu
      ? spec.layout_blueprint.history_section.title
      : isDe
        ? "Schlafverlauf"
        : isPl
          ? "Historia snu"
          : "Sleep history",
  };
}

export function filterSleepSessionsByPeriod(
  items: MobileSleepSession[],
  periodId: string,
): MobileSleepSession[] {
  const normalizedPeriod = mapSleepPeriodId(periodId);

  return items.filter((item) => matchesSleepPeriod(item.startedAt, normalizedPeriod));
}

export function buildSleepMetricsFromApi(
  items: MobileSleepSession[],
  locale: MobileLocale,
  periodId: string,
  customDaySpan?: number,
) {
  const normalizedPeriod = mapSleepPeriodId(periodId);
  const averageDuration = formatAverageDurationMetric(items, locale);

  return [
    {
      id: "night_sleep",
      value: formatAverageSleepPerDay(items, normalizedPeriod, customDaySpan),
      suffix: locale === "de" ? "Std." : locale === "pl" ? "godz." : locale === "ru" ? "ч" : "h",
    },
    {
      id: "clock",
      value: formatAverageSleepStart(items),
      suffix: "",
    },
    {
      id: "zzz",
      value: averageDuration.value,
      suffix: averageDuration.suffix,
    },
  ] as const;
}

export function mapSleepTimelineFromApi(
  items: MobileSleepSession[],
  locale: MobileLocale,
): SleepTimelineItem[] {
  return [...items]
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    )
    .map((item) => {
      const startedAt = new Date(item.startedAt);
      const time = Number.isNaN(startedAt.getTime())
        ? "—"
        : startedAt.toLocaleTimeString(resolveDateLocale(locale), {
            hour: "2-digit",
            minute: "2-digit",
          });
      const kind = resolveSleepKind(item);
      const isNight = kind === "night_sleep";

      return {
        id: item.id,
        time,
        day: formatDayLabel(startedAt, locale),
        type: localizeSleepKind(kind, locale),
        icon: kind,
        meta: buildSleepMeta(item, locale),
        badgeBackground: isNight ? "#E8DDF9" : "#D9E8FB",
        badgeIconColor: isNight ? "#7E69C7" : "#6F8FCA",
      };
    });
}

function localizePeriodLabel(label: string, locale: MobileLocale) {
  if (locale === "ru") {
    return label;
  }

  if (locale === "de") {
    if (label === "24 часа") return "24 Std.";
    if (label === "7 дней") return "7 Tage";
    if (label === "30 дней") return "30 Tage";
    return "Gesamter Zeitraum";
  }

  if (locale === "pl") {
    if (label === "24 часа") return "24 godz.";
    if (label === "7 дней") return "7 dni";
    if (label === "30 дней") return "30 dni";
    return "Cały okres";
  }

  if (label === "24 часа") return "24 hours";
  if (label === "7 дней") return "7 days";
  if (label === "30 дней") return "30 days";
  return "All time";
}

function localizeMetricLabel(label: string, locale: MobileLocale) {
  if (locale === "ru") {
    return label;
  }

  if (locale === "de") {
    if (label === "В среднем в день") return "Durchschnitt pro Tag";
    if (label === "Обычно в") return "Üblicherweise um";
    return "Durchschnittsdauer";
  }

  if (locale === "pl") {
    if (label === "В среднем в день") return "Średnio na dzień";
    if (label === "Обычно в") return "Zwykle o";
    return "Średni czas";
  }

  if (label === "В среднем в день") return "Average per day";
  if (label === "Обычно в") return "Usually at";
  return "Average duration";
}

function buildSleepMeta(item: MobileSleepSession, locale: MobileLocale) {
  const parts = [
    item.status === "active" ? getSleepingNowLabel(locale) : null,
    item.endedAt
      ? `${getSleepEndedLabel(locale)} ${formatSessionTime(item.endedAt, locale)}`
      : null,
    formatDurationLabel(item.durationMinutes, locale),
  ].filter(Boolean);

  return parts.join(" · ");
}

function formatSessionTime(value: string, locale: MobileLocale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(resolveDateLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDurationLabel(durationMinutes: number | null, locale: MobileLocale) {
  if (durationMinutes === null) {
    return null;
  }

  if (durationMinutes <= 0) {
    return getLessThanMinuteLabel(locale);
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${localizeHourSuffix(locale)}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${localizeMinuteSuffix(locale)}`);
  }

  return parts.join(" ");
}

function getSleepingNowLabel(locale: MobileLocale) {
  if (locale === "ru") return "Сейчас спит";
  if (locale === "de") return "Schläft gerade";
  if (locale === "pl") return "Teraz śpi";
  return "Sleeping now";
}

function getSleepEndedLabel(locale: MobileLocale) {
  if (locale === "ru") return "Конец";
  if (locale === "de") return "Ende";
  if (locale === "pl") return "Koniec";
  return "End";
}

function getLessThanMinuteLabel(locale: MobileLocale) {
  if (locale === "ru") return "меньше минуты";
  if (locale === "de") return "weniger als eine Minute";
  if (locale === "pl") return "mniej niż minutę";
  return "less than a minute";
}

function localizeHourSuffix(locale: MobileLocale) {
  if (locale === "de") return "Std.";
  if (locale === "pl") return "godz.";
  if (locale === "en") return "h";
  return "ч";
}

function localizeMinuteSuffix(locale: MobileLocale) {
  if (locale === "de") return "Min";
  if (locale === "pl") return "min";
  if (locale === "en") return "min";
  return "мин";
}

function resolveSleepKind(item: MobileSleepSession): "night_sleep" | "day_sleep" {
  const startedAt = new Date(item.startedAt);

  if (Number.isNaN(startedAt.getTime())) {
    return "night_sleep";
  }

  const hour = startedAt.getHours();
  return hour >= 20 || hour < 6 ? "night_sleep" : "day_sleep";
}

function localizeSleepKind(
  kind: "night_sleep" | "day_sleep",
  locale: MobileLocale,
) {
  if (locale === "ru") {
    return kind === "night_sleep" ? "Сон" : "Дневной сон";
  }

  if (locale === "de") {
    return kind === "night_sleep" ? "Schlaf" : "Nickerchen";
  }

  if (locale === "pl") {
    return kind === "night_sleep" ? "Sen" : "Drzemka";
  }

  return kind === "night_sleep" ? "Sleep" : "Nap";
}

function formatDayLabel(date: Date, locale: MobileLocale) {
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfValue = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfValue.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays <= 0) {
    return locale === "ru"
      ? "Сегодня"
      : locale === "de"
        ? "Heute"
        : locale === "pl"
          ? "Dziś"
          : "Today";
  }

  if (diffDays === 1) {
    return locale === "ru"
      ? "Вчера"
      : locale === "de"
        ? "Gestern"
        : locale === "pl"
          ? "Wczoraj"
          : "Yesterday";
  }

  return date.toLocaleDateString(resolveDateLocale(locale), {
    day: "numeric",
    month: "short",
  });
}

function resolveDateLocale(locale: MobileLocale) {
  if (locale === "ru") return "ru-RU";
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  return "en-US";
}

function mapSleepPeriodId(value: string): SleepPeriodId {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "24h" || normalizedValue.includes("24")) return "24h";
  if (normalizedValue === "7d" || normalizedValue.includes("7")) return "7d";
  if (normalizedValue === "30d" || normalizedValue.includes("30")) return "30d";
  return "all";
}

function matchesSleepPeriod(startedAt: string, periodId: SleepPeriodId) {
  const value = new Date(startedAt);

  if (Number.isNaN(value.getTime())) {
    return false;
  }

  const now = Date.now();
  const diffMs = now - value.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (periodId === "24h") return diffMs <= dayMs;
  if (periodId === "7d") return diffMs <= dayMs * 7;
  if (periodId === "30d") return diffMs <= dayMs * 30;
  return true;
}

function localizePeriodSubtitle(periodId: SleepPeriodId, locale: MobileLocale) {
  if (periodId === "24h") {
    return locale === "ru"
      ? "за последние 24 часа"
      : locale === "de"
        ? "in den letzten 24 Stunden"
        : locale === "pl"
          ? "w ciągu ostatnich 24 godzin"
          : "for the last 24 hours";
  }

  if (periodId === "30d") {
    return locale === "ru"
      ? "за последние 30 дней"
      : locale === "de"
        ? "in den letzten 30 Tagen"
        : locale === "pl"
          ? "w ciągu ostatnich 30 dni"
          : "for the last 30 days";
  }

  if (periodId === "7d") {
    return locale === "ru"
      ? "за последние 7 дней"
      : locale === "de"
        ? "in den letzten 7 Tagen"
        : locale === "pl"
          ? "w ciągu ostatnich 7 dni"
          : "for the last 7 days";
  }

  return locale === "ru"
    ? "за всё время"
    : locale === "de"
      ? "für den gesamten Zeitraum"
      : locale === "pl"
        ? "za cały okres"
        : "for all time";
}

function formatAverageSleepPerDay(
  items: MobileSleepSession[],
  periodId: SleepPeriodId,
  customDaySpan?: number,
) {
  const totalMinutes = items.reduce(
    (sum, item) => sum + (item.durationMinutes ?? 0),
    0,
  );

  if (totalMinutes <= 0) {
    return "—";
  }

  const avgMinutesPerDay = totalMinutes / resolvePeriodDaySpan(items, periodId, customDaySpan);
  const avgHours = avgMinutesPerDay / 60;
  const rounded = avgHours >= 10 ? Math.round(avgHours) : Math.round(avgHours * 10) / 10;

  return String(rounded);
}

function formatAverageSleepStart(items: MobileSleepSession[]) {
  const minutes = items
    .map((item) => {
      const date = new Date(item.startedAt);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date.getHours() * 60 + date.getMinutes();
    })
    .filter((value): value is number => typeof value === "number");

  if (minutes.length === 0) {
    return "—";
  }

  const averageMinutes = Math.round(
    minutes.reduce((sum, value) => sum + value, 0) / minutes.length,
  );
  const hours = Math.floor(averageMinutes / 60) % 24;
  const mins = averageMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatAverageDurationMetric(
  items: MobileSleepSession[],
  locale: MobileLocale,
) {
  const durations = items
    .map((item) => item.durationMinutes)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (durations.length === 0) {
    return { value: "—", suffix: "" };
  }

  const average = Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
  const averageHours = average / 60;

  if (average < 60) {
    return {
      value: String(average),
      suffix: localizeMinuteSuffix(locale),
    };
  }

  const roundedHours =
    averageHours >= 10
      ? Math.round(averageHours)
      : Math.round(averageHours * 10) / 10;

  return {
    value: String(roundedHours),
    suffix: localizeHourSuffix(locale),
  };
}

function resolvePeriodDaySpan(
  items: MobileSleepSession[],
  periodId: SleepPeriodId,
  customDaySpan?: number,
) {
  if (typeof customDaySpan === "number" && customDaySpan > 0) {
    return customDaySpan;
  }

  if (periodId === "24h") return 1;
  if (periodId === "7d") return 7;
  if (periodId === "30d") return 30;

  const timestamps = items
    .map((item) => new Date(item.startedAt).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return 1;
  }

  const oldestTimestamp = Math.min(...timestamps);
  const diffDays = Math.ceil((Date.now() - oldestTimestamp) / (24 * 60 * 60 * 1000));

  return Math.max(diffDays, 1);
}
