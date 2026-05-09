import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";

const feedingSpec = journalScreenSpecs.feeding;

type FeedingMetricSpec = {
  icon: "amount" | "time" | "drop";
  value: string;
  label: string;
};

type FeedingTimelineItemSpec = {
  time: string;
  day: string;
  type: string;
  icon: "bottle" | "formula";
  badge_color: "breast_bg" | "formula_bg";
  meta: string;
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
    timeline_history_list: {
      items: FeedingTimelineItemSpec[];
    };
  };
};

export type FeedingPeriodOption = {
  id: string;
  label: string;
  active: boolean;
};

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
  timeline: FeedingTimelineItem[];
};

const spec = feedingSpec as FeedingSpec;

export function buildFeedingHistoryScreenContent(
  locale: MobileLocale,
): FeedingHistoryScreenContent {
  const isRu = locale === "ru";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const activePeriod = spec.layout_blueprint.segmented_control.active_label;

  return {
    backLabel: isRu ? "К профилю ребёнка" : "Back to child profile",
    title: isRu ? spec.layout_blueprint.heading.title : "Feeding • Edik",
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : "Child feeding history and quick access to saved records.",
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
    heroTitle: isRu ? "Как кушал Эдик" : "How Edik ate",
    heroSubtitle: isRu ? "за последние 7 дней" : "for the last 7 days",
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: `${metric.icon}-${metric.label}`,
      icon: metric.icon,
      value: metric.value,
      label:
        isRu
          ? metric.label
          : metric.label === "В среднем в день"
            ? "Average per day"
            : metric.label === "Обычно в"
              ? "Usually at"
              : "Average duration",
    })),
    historyTitle: isRu
      ? spec.layout_blueprint.history_section.title
      : "Feeding history",
    timeline: spec.layout_blueprint.timeline_history_list.items.map((item) => ({
      id: `${item.time}-${item.type}`,
      time: item.time,
      day: isRu
        ? item.day
        : item.day === "Вчера"
          ? "Yesterday"
          : item.day === "2 дня назад"
            ? "2 days ago"
            : "3 days ago",
      type:
        isRu
          ? item.type
          : item.type === "Грудь"
            ? "Breast"
            : "Formula",
      icon: item.icon,
      meta: isRu
        ? item.meta
        : item.meta
            .replace("Сохранено", "Saved")
            .replace("Левая", "Left")
            .replace("Правая", "Right")
            .replace("Обе", "Both")
            .replace("меньше минуты", "less than a minute")
            .replace("мин", "min"),
      badgeBackground:
        item.badge_color === "breast_bg" ? "#FFD8D1" : "#FFD98B",
    })),
  };
}
