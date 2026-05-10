import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";

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

export type GrowthPeriodOption = {
  id: string;
  label: string;
  active: boolean;
};

export type GrowthMetric = {
  id: string;
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

export function buildGrowthHistoryScreenContent(
  locale: MobileLocale,
): GrowthHistoryScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const activePeriod = spec.layout_blueprint.segmented_control.active_label;

  return {
    backLabel: isRu ? "К профилю ребёнка" : isDe ? "Zum Kinderprofil" : isPl ? "Do profilu dziecka" : "Back to child profile",
    title: isRu ? spec.layout_blueprint.heading.title : isDe ? "Größe • Edik" : isPl ? "Wzrost • Edik" : "Growth • Edik",
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Optionale Messungen mit einer einfachen Ansicht der letzten Werte und Trends."
      : isPl
        ? "Opcjonalne pomiary dziecka z prostym widokiem ostatnich wartości i trendu."
      : "Optional child measurements with a simple view of recent values and trend.",
    periods: periods.map((label) => ({
      id: label,
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
      active: label === activePeriod,
    })),
    heroTitle: isRu
      ? "Как рос Эдик"
      : isDe
        ? "Wie sich Ediks Größe verändert hat"
      : isPl
        ? "Jak zmieniał się wzrost Edika"
        : "How Edik's growth changed",
    heroSubtitle: isRu
      ? spec.layout_blueprint.hero_summary_card.subtitle
      : isDe
        ? "in den letzten 30 Tagen"
      : isPl
        ? "w ciągu ostatnich 30 dni"
        : "for the last 30 days",
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: `${metric.icon}-${metric.label}`,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label:
        isRu
          ? metric.label
          : isDe
            ? metric.label === "Текущий рост"
              ? "Aktuelle Größe"
              : metric.label === "С прошлого"
                ? "Seit dem letzten"
                : "Letzte Messung"
            : isPl
            ? metric.label === "Текущий рост"
              ? "Aktualny wzrost"
              : metric.label === "С прошлого"
                ? "Od poprzedniego"
                : "Ostatni pomiar"
            : metric.label === "Текущий рост"
            ? "Current height"
            : metric.label === "С прошлого"
              ? "From previous"
              : "Last measurement",
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
      meta: isRu
        ? item.meta
        : isDe
          ? item.meta
              .replace("Сохранено вручную", "Manuell gespeichert")
              .replace("Измерение добавлено", "Messung hinzugefügt")
          : isPl
          ? item.meta
              .replace("Сохранено вручную", "Zapisano ręcznie")
              .replace("Измерение добавлено", "Dodano pomiar")
          : item.meta
            .replace("Сохранено вручную", "Saved manually")
            .replace("Измерение добавлено", "Measurement added"),
    })),
    chartPoints: spec.chart_system.data_points_visual.map((point, index) => ({
      id: `point-${index}`,
      x: point.x_percent,
      y: point.y_percent,
    })),
  };
}
