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
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const activePeriod = spec.layout_blueprint.segmented_control.active_label;

  return {
    backLabel: isRu ? "К профилю ребёнка" : isDe ? "Zum Kinderprofil" : isPl ? "Do profilu dziecka" : "Back to child profile",
    title: isRu ? spec.layout_blueprint.heading.title : isDe ? "Schlaf • Edik" : isPl ? "Sen • Edik" : "Sleep • Edik",
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Schlafverlauf des Kindes und schneller Zugriff auf gespeicherte Schlafphasen."
      : isPl
        ? "Historia snu dziecka i szybki dostęp do zapisanych sesji snu."
      : "Child sleep history and quick access to saved sleep sessions.",
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
    heroTitle: isRu ? spec.layout_blueprint.hero_summary_card.title : isDe ? "Wie Edik geschlafen hat" : isPl ? "Jak spał Edik" : "How Edik slept",
    heroSubtitle: isRu ? spec.layout_blueprint.hero_summary_card.subtitle : isDe ? "in den letzten 7 Tagen" : isPl ? "w ciągu ostatnich 7 dni" : "for the last 7 days",
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: `${metric.icon}-${metric.label}`,
      icon: metric.icon,
      value: metric.value,
      suffix: metric.value_suffix,
      label:
        isRu
          ? metric.label
          : isDe
            ? metric.label === "В среднем в день"
              ? "Durchschnitt pro Tag"
              : metric.label === "Обычно в"
                ? "Üblicherweise um"
                : "Durchschnittsdauer"
            : isPl
            ? metric.label === "В среднем в день"
              ? "Średnio na dzień"
              : metric.label === "Обычно в"
                ? "Zwykle o"
                : "Średni czas"
            : metric.label === "В среднем в день"
            ? "Average per day"
            : metric.label === "Обычно в"
              ? "Usually at"
              : "Average duration",
    })),
    historyTitle: isRu ? spec.layout_blueprint.history_section.title : isDe ? "Schlafverlauf" : isPl ? "Historia snu" : "Sleep history",
    timeline: spec.layout_blueprint.timeline_history_list.items.map((item) => ({
      id: `${item.time}-${item.type}`,
      time: item.time,
      day: isRu
        ? item.day
        : isDe
          ? item.day === "Вчера"
            ? "Gestern"
            : item.day === "2 дня назад"
              ? "Vor 2 Tagen"
              : "Vor 3 Tagen"
          : isPl
          ? item.day === "Вчера"
            ? "Wczoraj"
            : item.day === "2 дня назад"
              ? "2 dni temu"
              : "3 dni temu"
          : item.day === "Вчера"
          ? "Yesterday"
          : item.day === "2 дня назад"
            ? "2 days ago"
            : "3 days ago",
      type:
        isRu
          ? item.type
          : isDe
            ? item.type === "Сон"
              ? "Schlaf"
              : "Nickerchen"
            : isPl
            ? item.type === "Сон"
              ? "Sen"
              : "Drzemka"
            : item.type === "Сон"
            ? "Sleep"
            : "Nap",
      icon: item.icon,
      meta: isRu
        ? item.meta
        : isDe
          ? item.meta
              .replace("Конец", "Ende")
              .replace("меньше минуты", "weniger als eine Minute")
              .replace("ч", "Std.")
              .replace("мин", "Min")
          : isPl
          ? item.meta
              .replace("Конец", "Koniec")
              .replace("меньше минуты", "mniej niż minutę")
              .replace("ч", "godz.")
              .replace("мин", "min")
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
