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
  const periods = spec.layout_blueprint.segmented_control.labels;
  const activePeriod = spec.layout_blueprint.segmented_control.active_label;

  return {
    backLabel: isRu ? "К профилю ребёнка" : "Back to child profile",
    title: isRu ? spec.layout_blueprint.heading.title : "Growth • Edik",
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : "Optional child measurements with a simple view of recent values and trend.",
    periods: periods.map((label) => ({
      id: label,
      label:
        isRu
          ? label
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
      : "How Edik's growth changed",
    heroSubtitle: isRu
      ? spec.layout_blueprint.hero_summary_card.subtitle
      : "for the last 30 days",
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: `${metric.icon}-${metric.label}`,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label:
        isRu
          ? metric.label
          : metric.label === "Текущий рост"
            ? "Current height"
            : metric.label === "С прошлого"
              ? "From previous"
              : "Last measurement",
    })),
    ctaLabel: isRu
      ? spec.layout_blueprint.hero_summary_card.primary_cta.text
      : "Add measurement",
    historyTitle: isRu
      ? spec.layout_blueprint.history_section.title
      : "Measurement history",
    timeline: spec.layout_blueprint.timeline_history_list.items.map((item) => ({
      id: `${item.date}-${item.value}`,
      date: item.date,
      value: item.value,
      meta: isRu
        ? item.meta
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
