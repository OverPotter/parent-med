import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { journalScreenSpecs } from "../../../redesign/screens/journal/specs";

const sleepSpec = journalScreenSpecs.sleep;

type SleepMetricSpec = {
  icon: "night_sleep" | "clock" | "zzz";
  value: string;
  value_suffix: string;
  label: string;
};

type SleepTimelineItemSpec = {
  time: string;
  day: string;
  type: string;
  icon: "night_sleep" | "day_sleep";
  badge_color: "sleep_bg" | "day_sleep_bg";
  meta: string;
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
    timeline_history_list: {
      items: SleepTimelineItemSpec[];
    };
  };
};

export type SleepPeriodOption = {
  id: string;
  label: string;
  active: boolean;
};

export type SleepMetric = {
  id: string;
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
  timeline: SleepTimelineItem[];
};

const spec = sleepSpec as SleepSpec;

export function buildSleepHistoryScreenContent(
  locale: MobileLocale,
): SleepHistoryScreenContent {
  const isRu = locale === "ru";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const activePeriod = spec.layout_blueprint.segmented_control.active_label;

  return {
    backLabel: isRu ? "К профилю ребёнка" : "Back to child profile",
    title: isRu ? spec.layout_blueprint.heading.title : "Sleep • Edik",
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : "Child sleep history and quick access to saved sleep sessions.",
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
    heroTitle: isRu ? spec.layout_blueprint.hero_summary_card.title : "How Edik slept",
    heroSubtitle: isRu ? spec.layout_blueprint.hero_summary_card.subtitle : "for the last 7 days",
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: `${metric.icon}-${metric.label}`,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label:
        isRu
          ? metric.label
          : metric.label === "В среднем в день"
            ? "Average per day"
            : metric.label === "Обычно в"
              ? "Usually at"
              : "Average duration",
    })),
    historyTitle: isRu ? spec.layout_blueprint.history_section.title : "Sleep history",
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
          : item.type === "Сон"
            ? "Sleep"
            : "Nap",
      icon: item.icon,
      meta: isRu
        ? item.meta
        : item.meta
            .replace("Конец", "End")
            .replace("меньше минуты", "less than a minute")
            .replace("ч", "h")
            .replace("мин", "min"),
      badgeBackground: item.badge_color === "sleep_bg" ? "#E8DDF9" : "#D9E8FB",
      badgeIconColor: item.badge_color === "sleep_bg" ? "#7E69C7" : "#6F8FCA",
    })),
  };
}
