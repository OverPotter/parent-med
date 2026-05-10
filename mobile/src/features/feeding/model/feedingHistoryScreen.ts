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
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const periods = spec.layout_blueprint.segmented_control.labels;
  const activePeriod = spec.layout_blueprint.segmented_control.active_label;

  return {
    backLabel: isRu ? "К профилю ребёнка" : isDe ? "Zum Kinderprofil" : isPl ? "Do profilu dziecka" : "Back to child profile",
    title: isRu ? spec.layout_blueprint.heading.title : isDe ? "Fütterung • Edik" : isPl ? "Karmienie • Edik" : "Feeding • Edik",
    subtitle: isRu
      ? spec.layout_blueprint.heading.subtitle
      : isDe
        ? "Fütterungsverlauf des Kindes und schneller Zugriff auf gespeicherte Einträge."
      : isPl
        ? "Historia karmienia dziecka i szybki dostęp do zapisanych wpisów."
      : "Child feeding history and quick access to saved records.",
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
    heroTitle: isRu ? "Как кушал Эдик" : isDe ? "Wie Edik gegessen hat" : isPl ? "Jak jadł Edik" : "How Edik ate",
    heroSubtitle: isRu ? "за последние 7 дней" : isDe ? "in den letzten 7 Tagen" : isPl ? "w ciągu ostatnich 7 dni" : "for the last 7 days",
    metrics: spec.layout_blueprint.hero_summary_card.metrics.map((metric) => ({
      id: `${metric.icon}-${metric.label}`,
      icon: metric.icon,
      value: metric.value,
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
    historyTitle: isRu
      ? spec.layout_blueprint.history_section.title
      : isDe
        ? "Fütterungsverlauf"
      : isPl
        ? "Historia karmienia"
      : "Feeding history",
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
            ? item.type === "Грудь"
              ? "Brust"
              : "Formula"
            : isPl
            ? item.type === "Грудь"
              ? "Pierś"
              : "Mieszanka"
            : item.type === "Грудь"
            ? "Breast"
            : "Formula",
      icon: item.icon,
      meta: isRu
        ? item.meta
        : isDe
          ? item.meta
              .replace("Сохранено", "Gespeichert")
              .replace("Левая", "Links")
              .replace("Правая", "Rechts")
              .replace("Обе", "Beide")
              .replace("меньше минуты", "weniger als eine Minute")
              .replace("мин", "Min")
          : isPl
          ? item.meta
              .replace("Сохранено", "Zapisano")
              .replace("Левая", "Lewa")
              .replace("Правая", "Prawa")
              .replace("Обе", "Obie")
              .replace("меньше минуты", "mniej niż minutę")
              .replace("мин", "min")
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
