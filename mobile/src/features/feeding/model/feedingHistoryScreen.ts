import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";
import type { MobileFeedingRecord } from "../api/feedingRecordsApi";

const feedingSpec = journalScreenSpecs.feeding;

type FeedingMetricSpec = {
  icon: "amount" | "time" | "drop";
  value: string;
  label: string;
};

type FeedingSpec = {
  meta: {
    screen_title_ru: string;
  };
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
      metrics: FeedingMetricSpec[];
    };
    history_section: {
      title: string;
    };
  };
};

export type FeedingPeriodOption = {
  id: string;
  label: string;
  active: boolean;
};

export type FeedingPeriodId = "24h" | "7d" | "30d" | "all";

export type FeedingMetric = {
  id: string;
  icon: "amount" | "time" | "drop";
  value: string;
  label: string;
};

export type FeedingTimelineItem = {
  id: string;
  time: string;
  day: string;
  type: string;
  icon: "bottle" | "formula";
  meta: string;
  badgeBackground: string;
};

export type FeedingHistoryScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  periods: FeedingPeriodOption[];
  heroTitle: string;
  heroSubtitle: string;
  metrics: FeedingMetric[];
  historyTitle: string;
};

const spec = feedingSpec as FeedingSpec;

export function buildFeedingHistoryScreenContent(
  locale: MobileLocale,
  childName: string,
  activePeriodId?: string,
): FeedingHistoryScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const defaultPeriodId = mapFeedingPeriodId(
    spec.layout_blueprint.segmented_control.active_label,
  );
  const activePeriod = mapFeedingPeriodId(activePeriodId ?? defaultPeriodId);

  return {
    backLabel: isRu ? "К профилю ребёнка" : isDe ? "Zum Kinderprofil" : isPl ? "Do profilu dziecka" : "Back to child profile",
    title: isRu
      ? `Кормление • ${childName}`
      : isDe
        ? `Fütterung • ${childName}`
        : isPl
          ? `Karmienie • ${childName}`
          : `Feeding • ${childName}`,
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Fütterungsverlauf des Kindes und schneller Zugriff auf gespeicherte Einträge."
      : isPl
        ? "Historia karmienia dziecka i szybki dostęp do zapisanych wpisów."
      : "Child feeding history and quick access to saved records.",
    periods: periods.map((label) => ({
      id: mapFeedingPeriodId(label),
      label:
        isRu
          ? label
          : isDe
            ? label === "24 часа"
              ? "24 Std."
              : label === "7 дней"
                ? "7 Tage"
                : label === "30 дней"
                  ? "30 Tage"
                  : "Gesamter Zeitraum"
            : isPl
            ? label === "24 часа"
              ? "24 godz."
              : label === "7 дней"
                ? "7 dni"
                : label === "30 дней"
                  ? "30 dni"
                  : "Cały okres"
            : label === "24 часа"
            ? "24 hours"
            : label === "7 дней"
              ? "7 days"
            : label === "30 дней"
                ? "30 days"
                : "All time",
      active: mapFeedingPeriodId(label) === activePeriod,
    })),
    heroTitle: isRu
      ? `Как кушал ${childName}`
      : isDe
        ? `Wie ${childName} gegessen hat`
        : isPl
          ? `Jak jadł ${childName}`
          : `How ${childName} ate`,
    heroSubtitle: localizePeriodSubtitle(activePeriod, locale),
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: metric.icon,
      icon: metric.icon,
      value: metric.value,
      label: localizeMetricLabel(metric.label, locale),
    })),
    historyTitle: isRu
      ? spec.layout_blueprint.history_section.title
      : isDe
        ? "Fütterungsverlauf"
      : isPl
        ? "Historia karmienia"
      : "Feeding history",
  };
}

export function filterFeedingRecordsByPeriod(
  items: MobileFeedingRecord[],
  periodId: string,
): MobileFeedingRecord[] {
  const normalizedPeriod = mapFeedingPeriodId(periodId);

  return items.filter((item) => matchesFeedingPeriod(item.recordedAt, normalizedPeriod));
}

export function buildFeedingMetricsFromApi(
  items: MobileFeedingRecord[],
  locale: MobileLocale,
  periodId: string,
  customDaySpan?: number,
) {
  const normalizedPeriod = mapFeedingPeriodId(periodId);

  return [
    {
      id: "amount",
      value: formatAveragePerDay(items, normalizedPeriod, locale, customDaySpan),
    },
    {
      id: "time",
      value: formatAverageTime(items),
    },
    {
      id: "drop",
      value: formatAverageDuration(items, locale),
    },
  ] as const;
}

export function mapFeedingTimelineFromApi(
  items: MobileFeedingRecord[],
  locale: MobileLocale,
): FeedingTimelineItem[] {
  return [...items]
    .sort(
      (left, right) =>
        new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
    )
    .map((item) => {
      const recordedAt = new Date(item.recordedAt);
      const time = Number.isNaN(recordedAt.getTime())
        ? "—"
        : recordedAt.toLocaleTimeString(resolveDateLocale(locale), {
            hour: "2-digit",
            minute: "2-digit",
          });

      return {
        id: item.id,
        time,
        day: formatDayLabel(recordedAt, locale),
        type: localizeFeedingType(item.feedingType, locale),
        icon: item.feedingType === "formula" ? "formula" : "bottle",
        meta: buildFeedingMeta(item, locale),
        badgeBackground: item.feedingType === "formula" ? "#FFD98B" : "#FFD8D1",
      };
    });
}

function buildFeedingMeta(item: MobileFeedingRecord, locale: MobileLocale) {
  const parts = [
    item.status === "active"
      ? localizeLabel("Активно", locale)
      : null,
    item.feedingType === "breast"
      ? item.isExpressed
        ? localizeLabel("Сцеженное", locale)
        : localizeBreastSide(item.breastSide, locale)
      : item.formulaVolumeMl != null
        ? `${Math.round(item.formulaVolumeMl)} ${localizeLabel("мл", locale)}`
        : null,
    formatDuration(item.durationMinutes, locale),
    item.note?.trim() || null,
  ].filter(Boolean);

  return parts.join(" · ");
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

function formatDuration(durationMinutes: number | null, locale: MobileLocale) {
  if (durationMinutes === null) {
    return null;
  }

  if (durationMinutes <= 0) {
    return localizeLabel("меньше минуты", locale);
  }

  return `${durationMinutes} ${localizeLabel("мин", locale)}`;
}

function localizeBreastSide(
  side: string | null,
  locale: MobileLocale,
) {
  if (side === "left") {
    return localizeLabel("Левая", locale);
  }

  if (side === "right") {
    return localizeLabel("Правая", locale);
  }

  if (side === "both") {
    return localizeLabel("Обе", locale);
  }

  return null;
}

function localizeFeedingType(type: string, locale: MobileLocale) {
  if (type === "formula") {
    return localizeLabel("Смесь", locale);
  }

  return localizeLabel("Грудь", locale);
}

function localizeLabel(value: string, locale: MobileLocale) {
  if (locale === "ru") {
    return value;
  }

  if (locale === "de") {
    return value
      .replace("Сохранено", "Gespeichert")
      .replace("Активно", "Aktiv")
      .replace("Сцеженное", "Abgepumpt")
      .replace("Левая", "Links")
      .replace("Правая", "Rechts")
      .replace("Обе", "Beide")
      .replace("меньше минуты", "weniger als eine Minute")
      .replace("мин", "Min")
      .replace("мл", "ml")
      .replace("Смесь", "Formula")
      .replace("Грудь", "Brust");
  }

  if (locale === "pl") {
    return value
      .replace("Сохранено", "Zapisano")
      .replace("Активно", "Aktywne")
      .replace("Сцеженное", "Odciągnięte")
      .replace("Левая", "Lewa")
      .replace("Правая", "Prawa")
      .replace("Обе", "Obie")
      .replace("меньше минуты", "mniej niż minutę")
      .replace("мин", "min")
      .replace("мл", "ml")
      .replace("Смесь", "Mieszanka")
      .replace("Грудь", "Pierś");
  }

  return value
    .replace("Сохранено", "Saved")
    .replace("Активно", "Active")
    .replace("Сцеженное", "Expressed")
    .replace("Левая", "Left")
    .replace("Правая", "Right")
    .replace("Обе", "Both")
    .replace("меньше минуты", "less than a minute")
    .replace("мин", "min")
    .replace("мл", "ml")
    .replace("Смесь", "Formula")
    .replace("Грудь", "Breast");
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

function matchesFeedingPeriod(recordedAt: string, periodId: string) {
  const value = new Date(recordedAt);

  if (Number.isNaN(value.getTime())) {
    return false;
  }

  const normalizedPeriod = mapFeedingPeriodId(periodId);
  const now = Date.now();
  const diffMs = now - value.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (normalizedPeriod === "24h") {
    return diffMs <= dayMs;
  }

  if (normalizedPeriod === "7d") {
    return diffMs <= dayMs * 7;
  }

  if (normalizedPeriod === "30d") {
    return diffMs <= dayMs * 30;
  }

  return true;
}

function localizePeriodSubtitle(periodId: string, locale: MobileLocale) {
  const normalizedPeriod = mapFeedingPeriodId(periodId);

  if (normalizedPeriod === "24h") {
    return locale === "ru"
      ? "за последние 24 часа"
      : locale === "de"
        ? "in den letzten 24 Stunden"
        : locale === "pl"
          ? "w ciągu ostatnich 24 godzin"
          : "for the last 24 hours";
  }

  if (normalizedPeriod === "30d") {
    return locale === "ru"
      ? "за последние 30 дней"
      : locale === "de"
        ? "in den letzten 30 Tagen"
        : locale === "pl"
          ? "w ciągu ostatnich 30 dni"
          : "for the last 30 days";
  }

  if (normalizedPeriod === "7d") {
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

function mapFeedingPeriodId(value: string): FeedingPeriodId {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "24h" || normalizedValue.includes("24")) {
    return "24h";
  }

  if (normalizedValue === "7d" || normalizedValue.includes("7")) {
    return "7d";
  }

  if (normalizedValue === "30d" || normalizedValue.includes("30")) {
    return "30d";
  }

  return "all";
}

function formatAveragePerDay(
  items: MobileFeedingRecord[],
  periodId: FeedingPeriodId,
  locale: MobileLocale,
  customDaySpan?: number,
) {
  if (items.length === 0) {
    return "—";
  }

  const perDay = items.length / resolvePeriodDaySpan(items, periodId, customDaySpan);
  const rounded = perDay >= 10 ? Math.round(perDay) : Math.round(perDay * 10) / 10;

  if (locale === "ru") return `${rounded} раз`;
  if (locale === "de") return `${rounded}x`;
  if (locale === "pl") return `${rounded} razy`;
  return String(rounded);
}

function resolvePeriodDaySpan(
  items: MobileFeedingRecord[],
  periodId: FeedingPeriodId,
  customDaySpan?: number,
) {
  if (typeof customDaySpan === "number" && customDaySpan > 0) {
    return customDaySpan;
  }

  if (periodId === "24h") {
    return 1;
  }

  if (periodId === "7d") {
    return 7;
  }

  if (periodId === "30d") {
    return 30;
  }

  const timestamps = items
    .map((item) => new Date(item.recordedAt).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return 1;
  }

  const oldestTimestamp = Math.min(...timestamps);
  const diffDays = Math.ceil((Date.now() - oldestTimestamp) / (24 * 60 * 60 * 1000));

  return Math.max(diffDays, 1);
}

function formatAverageTime(items: MobileFeedingRecord[]) {
  const minutes = items
    .map((item) => {
      const date = new Date(item.recordedAt);

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

function formatAverageDuration(items: MobileFeedingRecord[], locale: MobileLocale) {
  const durations = items
    .map((item) => item.durationMinutes)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (durations.length === 0) {
    return "—";
  }

  const average = Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);

  if (locale === "ru") return `${average} мин`;
  if (locale === "de") return `${average} Min`;
  if (locale === "pl") return `${average} min`;
  return `${average} min`;
}
