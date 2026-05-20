import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";
import type { MobileHeightEntry } from "../api/heightEntriesApi";

const growthSpec = journalScreenSpecs.growth;

type GrowthMetricSpec = {
  icon: "ruler" | "minus" | "calendar";
  value: string;
  value_suffix: string;
  label: string;
};

type GrowthTimelineItemSpec = {
  date: string;
  value: string;
  meta: string;
};

type GrowthSpec = {
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
      metrics: GrowthMetricSpec[];
      primary_cta: {
        text: string;
      };
    };
    history_section: {
      title: string;
    };
    timeline_history_list: {
      items: GrowthTimelineItemSpec[];
    };
  };
  chart_system: {
    data_points_visual: Array<{
      x_percent: number;
      y_percent: number;
    }>;
  };
};

export type GrowthPeriodId = "24h" | "7d" | "30d" | "all";

export type GrowthPeriodOption = {
  id: GrowthPeriodId;
  label: string;
  active: boolean;
};

export type GrowthMetric = {
  id: "ruler" | "minus" | "calendar";
  icon: "ruler" | "minus" | "calendar";
  value: string;
  suffix: string;
  label: string;
};

export type GrowthTimelineItem = {
  id: string;
  date: string;
  value: string;
  meta: string;
};

export type GrowthChartPoint = {
  id: string;
  x: number;
  y: number;
};

export type GrowthHistoryScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  periods: GrowthPeriodOption[];
  heroTitle: string;
  heroSubtitle: string;
  metrics: GrowthMetric[];
  ctaLabel: string;
  historyTitle: string;
  timeline: GrowthTimelineItem[];
  chartPoints: GrowthChartPoint[];
};

const spec = growthSpec as GrowthSpec;

const growthMetricIds = ["ruler", "minus", "calendar"] as const;
type GrowthMetricId = (typeof growthMetricIds)[number];

export function buildGrowthHistoryScreenContent(
  locale: MobileLocale,
  childName: string,
  activePeriodId?: string,
): GrowthHistoryScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels.map(mapGrowthPeriodId);
  const defaultPeriodId = mapGrowthPeriodId(
    spec.layout_blueprint.segmented_control.active_label,
  );
  const activePeriod = mapGrowthPeriodId(activePeriodId ?? defaultPeriodId);

  return {
    backLabel: isRu
      ? "К профилю ребёнка"
      : isDe
        ? "Zum Kinderprofil"
        : isPl
          ? "Do profilu dziecka"
          : "Back to child profile",
    title: isRu
      ? `Рост • ${childName}`
      : isDe
        ? `Größe • ${childName}`
        : isPl
          ? `Wzrost • ${childName}`
          : `Growth • ${childName}`,
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Optionale Messungen mit einer einfachen Ansicht der letzten Werte und Trends."
      : isPl
        ? "Opcjonalne pomiary dziecka z prostym widokiem ostatnich wartości i trendu."
        : "Optional child measurements with a simple view of recent values and trend.",
    periods: periods.map((periodId) => ({
      id: periodId,
      label: localizePeriodLabel(periodId, locale),
      active: periodId === activePeriod,
    })),
    heroTitle: isRu
      ? `Как менялся рост ${childName}`
      : isDe
        ? `Wie sich die Größe von ${childName} verändert hat`
      : isPl
        ? `Jak zmieniał się wzrost ${childName}`
        : `How ${childName}'s growth changed`,
    heroSubtitle: localizePeriodSubtitle(activePeriod, locale),
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric, index) => ({
      id: metric.icon,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label: localizeMetricLabel(growthMetricIds[index] ?? metric.icon, locale),
    })),
    ctaLabel: isRu
      ? spec.layout_blueprint.hero_summary_card.primary_cta.text
      : isDe
        ? "Messung hinzufügen"
      : isPl
        ? "Dodaj pomiar"
        : "Add measurement",
    historyTitle: isRu
      ? spec.layout_blueprint.history_section.title
      : isDe
        ? "Messverlauf"
        : isPl
          ? "Historia pomiarów"
          : "Measurement history",
    timeline: spec.layout_blueprint.timeline_history_list.items.map((item) => ({
      id: `${item.date}-${item.value}`,
      date: item.date,
      value: item.value,
      meta: item.meta,
    })),
    chartPoints: spec.chart_system.data_points_visual.map((point, index) => ({
      id: `point-${index}`,
      x: point.x_percent,
      y: point.y_percent,
    })),
  };
}

export function filterHeightEntriesByPeriod(
  items: MobileHeightEntry[],
  periodId: string,
): MobileHeightEntry[] {
  const normalizedPeriod = mapGrowthPeriodId(periodId);

  return items.filter((item) => matchesPeriod(item.measuredAt, normalizedPeriod));
}

export function buildGrowthMetricsFromApi(
  items: MobileHeightEntry[],
  locale: MobileLocale,
) {
  const sorted = [...items].sort(
    (left, right) =>
      new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime(),
  );
  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;

  return [
    {
      id: "ruler",
      value: latest ? formatHeightValue(latest.valueCm) : "—",
      suffix: latest ? localizeHeightSuffix(locale) : "",
    },
    {
      id: "minus",
      value: formatHeightDelta(latest, previous),
      suffix: latest && previous ? localizeHeightSuffix(locale) : "",
    },
    {
      id: "calendar",
      value: latest ? formatMeasuredDate(latest.measuredAt, locale) : "—",
      suffix: "",
    },
  ] as const;
}

export function mapHeightTimelineFromApi(
  items: MobileHeightEntry[],
  locale: MobileLocale,
): GrowthTimelineItem[] {
  return [...items]
    .sort(
      (left, right) =>
        new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime(),
    )
    .map((item) => ({
      id: item.id,
      date: formatMeasuredDate(item.measuredAt, locale),
      value: `${formatHeightValue(item.valueCm)} ${localizeHeightSuffix(locale)}`.trim(),
      meta: localizeTimelineMeta(locale),
    }));
}

function localizePeriodLabel(periodId: GrowthPeriodId, locale: MobileLocale) {
  if (periodId === "24h") {
    return locale === "ru"
      ? "24 часа"
      : locale === "de"
        ? "24 Std."
        : locale === "pl"
          ? "24 godz."
          : "24 hours";
  }

  if (periodId === "7d") {
    return locale === "ru"
      ? "7 дней"
      : locale === "de"
        ? "7 Tage"
        : locale === "pl"
          ? "7 dni"
          : "7 days";
  }

  if (periodId === "30d") {
    return locale === "ru"
      ? "30 дней"
      : locale === "de"
        ? "30 Tage"
        : locale === "pl"
          ? "30 dni"
          : "30 days";
  }

  return locale === "ru"
    ? "Всё время"
    : locale === "de"
      ? "Gesamter Zeitraum"
      : locale === "pl"
        ? "Cały okres"
        : "All time";
}

function localizeMetricLabel(metricId: GrowthMetricId, locale: MobileLocale) {
  if (metricId === "ruler") {
    return locale === "ru"
      ? "Текущий рост"
      : locale === "de"
        ? "Aktuelle Größe"
        : locale === "pl"
          ? "Aktualny wzrost"
          : "Current height";
  }

  if (metricId === "minus") {
    return locale === "ru"
      ? "С прошлого"
      : locale === "de"
        ? "Seit dem letzten"
        : locale === "pl"
          ? "Od poprzedniego"
          : "From previous";
  }

  return locale === "ru"
    ? "Последнее измерение"
    : locale === "de"
      ? "Letzte Messung"
      : locale === "pl"
        ? "Ostatni pomiar"
        : "Last measurement";
}

function localizePeriodSubtitle(periodId: GrowthPeriodId, locale: MobileLocale) {
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

function localizeHeightSuffix(locale: MobileLocale) {
  return locale === "ru" ? "см" : "cm";
}

function localizeTimelineMeta(locale: MobileLocale) {
  if (locale === "ru") return "Сохранено вручную";
  if (locale === "de") return "Manuell gespeichert";
  if (locale === "pl") return "Zapisano ręcznie";
  return "Saved manually";
}

function mapGrowthPeriodId(value: string): GrowthPeriodId {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "24h" || normalizedValue.includes("24")) return "24h";
  if (normalizedValue === "7d" || normalizedValue.includes("7")) return "7d";
  if (normalizedValue === "30d" || normalizedValue.includes("30")) return "30d";
  return "all";
}

function matchesPeriod(measuredAt: string, periodId: GrowthPeriodId) {
  const value = new Date(measuredAt);

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

function formatHeightValue(valueCm: number) {
  const rounded = valueCm >= 100 ? Math.round(valueCm) : Math.round(valueCm * 10) / 10;
  return String(rounded);
}

function formatHeightDelta(
  latest: MobileHeightEntry | null,
  previous: MobileHeightEntry | null,
) {
  if (!latest || !previous) {
    return "—";
  }

  const delta = Math.round((latest.valueCm - previous.valueCm) * 10) / 10;

  if (delta === 0) {
    return "0";
  }

  return delta > 0 ? `+${delta}` : String(delta);
}

function formatMeasuredDate(measuredAt: string, locale: MobileLocale) {
  const date = new Date(measuredAt);

  if (Number.isNaN(date.getTime())) {
    return "—";
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
