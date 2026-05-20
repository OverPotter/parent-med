import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";
import type { MobileWeightEntry } from "../api/weightEntriesApi";

const weightSpec = journalScreenSpecs.weight;

type WeightMetricSpec = {
  icon: "weight" | "minus" | "calendar";
  value: string;
  value_suffix: string;
  label: string;
};

type WeightSpec = {
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
      metrics: WeightMetricSpec[];
      primary_cta: {
        text: string;
      };
    };
    history_section: {
      title: string;
    };
  };
  chart_system: {
    data_points_visual: Array<{
      x_percent: number;
      y_percent: number;
    }>;
  };
};

export type WeightPeriodId = "24h" | "7d" | "30d" | "all";

export type WeightPeriodOption = {
  id: WeightPeriodId;
  label: string;
  active: boolean;
};

export type WeightMetric = {
  id: "weight" | "minus" | "calendar";
  icon: "weight" | "minus" | "calendar";
  value: string;
  suffix: string;
  label: string;
};

export type WeightTimelineItem = {
  id: string;
  date: string;
  value: string;
  meta: string;
};

export type WeightChartPoint = {
  id: string;
  x: number;
  y: number;
};

export type WeightHistoryScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  periods: WeightPeriodOption[];
  heroTitle: string;
  heroSubtitle: string;
  metrics: WeightMetric[];
  ctaLabel: string;
  historyTitle: string;
  chartPoints: WeightChartPoint[];
};

const spec = weightSpec as WeightSpec;

export function buildWeightHistoryScreenContent(
  locale: MobileLocale,
  childName: string,
  activePeriodId?: string,
): WeightHistoryScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const defaultPeriodId = mapWeightPeriodId(
    spec.layout_blueprint.segmented_control.active_label,
  );
  const activePeriod = mapWeightPeriodId(activePeriodId ?? defaultPeriodId);

  return {
    backLabel: isRu
      ? "К профилю ребёнка"
      : isDe
        ? "Zum Kinderprofil"
        : isPl
          ? "Do profilu dziecka"
          : "Back to child profile",
    title: isRu
      ? `Вес • ${childName}`
      : isDe
        ? `Gewicht • ${childName}`
        : isPl
          ? `Waga • ${childName}`
          : `Weight • ${childName}`,
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Optionale Messungen mit einer einfachen Ansicht der letzten Werte und Trends."
        : isPl
          ? "Opcjonalne pomiary dziecka z prostym widokiem ostatnich wartości i trendu."
          : "Optional child measurements with a simple view of recent values and trend.",
    periods: periods.map((label) => ({
      id: mapWeightPeriodId(label),
      label: localizePeriodLabel(label, locale),
      active: mapWeightPeriodId(label) === activePeriod,
    })),
    heroTitle: isRu
      ? `Как менялся вес ${childName}`
      : isDe
        ? `Wie sich das Gewicht von ${childName} verändert hat`
        : isPl
          ? `Jak zmieniała się waga ${childName}`
          : `How ${childName}'s weight changed`,
    heroSubtitle: localizePeriodSubtitle(activePeriod, locale),
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: metric.icon,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label: localizeMetricLabel(metric.label, locale),
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
    chartPoints: spec.chart_system.data_points_visual.map((point, index) => ({
      id: `point-${index}`,
      x: point.x_percent,
      y: point.y_percent,
    })),
  };
}

export function filterWeightEntriesByPeriod(
  items: MobileWeightEntry[],
  periodId: string,
): MobileWeightEntry[] {
  const normalizedPeriod = mapWeightPeriodId(periodId);

  return items.filter((item) => matchesWeightPeriod(item.measuredAt, normalizedPeriod));
}

export function buildWeightMetricsFromApi(
  items: MobileWeightEntry[],
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
      id: "weight",
      value: latest ? formatWeightValue(latest.valueKg) : "—",
      suffix: latest ? localizeWeightSuffix(locale) : "",
    },
    {
      id: "minus",
      value: formatWeightDelta(latest, previous),
      suffix: latest && previous ? localizeWeightSuffix(locale) : "",
    },
    {
      id: "calendar",
      value: latest ? formatMeasuredDate(latest.measuredAt, locale) : "—",
      suffix: "",
    },
  ] as const;
}

export function mapWeightTimelineFromApi(
  items: MobileWeightEntry[],
  locale: MobileLocale,
): WeightTimelineItem[] {
  return [...items]
    .sort(
      (left, right) =>
        new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime(),
    )
    .map((item) => ({
      id: item.id,
      date: formatTimelineDate(item.measuredAt, locale),
      value: `${formatWeightValue(item.valueKg)} ${localizeWeightSuffix(locale)}`.trim(),
      meta: localizeTimelineMeta(locale),
    }));
}

function localizePeriodLabel(label: string, locale: MobileLocale) {
  if (locale === "ru") return label;
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
  if (locale === "ru") return label;
  if (locale === "de") {
    if (label === "Текущий вес") return "Aktuelles Gewicht";
    if (label === "С прошлого") return "Seit dem letzten";
    return "Letzte Messung";
  }
  if (locale === "pl") {
    if (label === "Текущий вес") return "Aktualna waga";
    if (label === "С прошлого") return "Od poprzedniego";
    return "Ostatni pomiar";
  }
  if (label === "Текущий вес") return "Current weight";
  if (label === "С прошлого") return "From previous";
  return "Last measurement";
}

function localizePeriodSubtitle(periodId: WeightPeriodId, locale: MobileLocale) {
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

function localizeWeightSuffix(locale: MobileLocale) {
  return locale === "ru" ? "кг" : "kg";
}

function localizeTimelineMeta(locale: MobileLocale) {
  if (locale === "ru") return "Сохранено вручную";
  if (locale === "de") return "Manuell gespeichert";
  if (locale === "pl") return "Zapisano ręcznie";
  return "Saved manually";
}

function mapWeightPeriodId(value: string): WeightPeriodId {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "24h" || normalizedValue.includes("24")) return "24h";
  if (normalizedValue === "7d" || normalizedValue.includes("7")) return "7d";
  if (normalizedValue === "30d" || normalizedValue.includes("30")) return "30d";
  return "all";
}

function matchesWeightPeriod(measuredAt: string, periodId: WeightPeriodId) {
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

function formatWeightValue(valueKg: number) {
  const rounded = valueKg >= 100 ? Math.round(valueKg) : Math.round(valueKg * 10) / 10;
  return String(rounded);
}

function formatWeightDelta(
  latest: MobileWeightEntry | null,
  previous: MobileWeightEntry | null,
) {
  if (!latest || !previous) {
    return "—";
  }

  const delta = Math.round((latest.valueKg - previous.valueKg) * 10) / 10;

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

function formatTimelineDate(measuredAt: string, locale: MobileLocale) {
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
