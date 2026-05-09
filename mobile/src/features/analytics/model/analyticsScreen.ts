import { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type AnalyticsInsightItem = {
  id: string;
  icon: "completed" | "activeMonth" | "medicine";
  title: string;
  subtitle: string;
};

export type AnalyticsPeriodOption = {
  id: "month" | "quarter" | "halfYear" | "year" | "allTime";
  label: string;
  helperLabel: string;
};

export type AnalyticsEpisodeCard = {
  id: string;
  monthLabel: string;
  dayLabel: string;
  meta: string;
  title: string;
  closedAt: string;
  description: string;
  actionLabel: string;
};

export type AnalyticsHighlightCard = {
  id: string;
  label: string;
  value: string;
  icon: "duration" | "longest" | "observations";
  accent: {
    background: string;
    border: string;
    iconBackground: string;
    iconColor: string;
  };
};

export type AnalyticsScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  periodOptions: AnalyticsPeriodOption[];
  mainSummaryTitle: string;
  mainSummaryInsights: AnalyticsInsightItem[];
  highlights: AnalyticsHighlightCard[];
  episodesTitle: string;
  episodesHelper: string;
  episodes: AnalyticsEpisodeCard[];
};

export function buildAnalyticsScreenContent(
  locale: MobileLocale,
): AnalyticsScreenContent {
  const isRu = locale === "ru";

  return {
    backLabel: isRu ? "Назад" : "Back",
    title: isRu ? "Аналитика" : "Analytics",
    subtitle: isRu
      ? "Короткая сводка по завершённым эпизодам ребёнка."
      : "Short summary of the child's completed episodes.",
    periodOptions: [
      {
        id: "month",
        label: isRu ? "Месяц" : "Month",
        helperLabel: isRu ? "Сводка за последний месяц." : "Summary for the last month.",
      },
      {
        id: "quarter",
        label: isRu ? "3 месяца" : "3 months",
        helperLabel: isRu
          ? "Сводка за последние 3 месяца."
          : "Summary for the last 3 months.",
      },
      {
        id: "halfYear",
        label: isRu ? "6 месяцев" : "6 months",
        helperLabel: isRu
          ? "Сводка за последние 6 месяцев."
          : "Summary for the last 6 months.",
      },
      {
        id: "year",
        label: isRu ? "Год" : "Year",
        helperLabel: isRu ? "Сводка за последний год." : "Summary for the last year.",
      },
      {
        id: "allTime",
        label: isRu ? "Всё время" : "All time",
        helperLabel: isRu ? "Сводка за всё время." : "Summary for all time.",
      },
    ],
    mainSummaryTitle: isRu ? "Главное за период" : "Highlights for the period",
    mainSummaryInsights: [
      {
        id: "completed",
        icon: "completed",
        title: isRu ? "9 завершённых эпизодов" : "9 completed episodes",
        subtitle: isRu ? "Вы справились!" : "You handled it.",
      },
      {
        id: "month",
        icon: "activeMonth",
        title: isRu ? "Активный месяц — май" : "Most active month — May",
        subtitle: isRu
          ? "Больше всего записей в этом месяце."
          : "Most records were added in this month.",
      },
      {
        id: "medicine",
        icon: "medicine",
        title: isRu
          ? "Лекарства применялись 3 раза"
          : "Medicine was used 3 times",
        subtitle: isRu
          ? "Приёмы фиксировались по назначениям."
          : "Doses were tracked by schedule.",
      },
    ],
    highlights: [
      {
        id: "average",
        label: isRu ? "Средняя длительность" : "Average duration",
        value: isRu ? "1 день" : "1 day",
        icon: "duration",
        accent: {
          background: "#FFFDFC",
          border: "#F3C7BD",
          iconBackground: "#FFE8E1",
          iconColor: "#FF7E73",
        },
      },
      {
        id: "longest",
        label: isRu ? "Самый долгий эпизод" : "Longest episode",
        value: isRu ? "1 эпизод" : "1 episode",
        icon: "longest",
        accent: {
          background: "#FFFDFC",
          border: "#F1DDAF",
          iconBackground: "#FFF4DA",
          iconColor: "#F9B84D",
        },
      },
      {
        id: "observations",
        label: isRu ? "Наблюдений за период" : "Observations in period",
        value: isRu ? "9 эпизодов" : "9 episodes",
        icon: "observations",
        accent: {
          background: "#FFFDFC",
          border: "#DDC9FA",
          iconBackground: "#F1EAFE",
          iconColor: "#9A72F5",
        },
      },
    ],
    episodesTitle: isRu ? "Завершённые эпизоды" : "Completed episodes",
    episodesHelper: isRu
      ? "Все завершённые эпизоды за выбранный период."
      : "All completed episodes for the selected period.",
    episodes: [
      {
        id: "episode-9",
        monthLabel: isRu ? "Май" : "May",
        dayLabel: "3",
        meta: isRu ? "Эпизод 9 • 3 мая" : "Episode 9 • May 3",
        title: isRu ? "Без названия" : "Untitled",
        closedAt: isRu ? "Закрыт 23:20" : "Closed 23:20",
        description: isRu ? "Без описания" : "No description",
        actionLabel: isRu ? "Разбор" : "Review",
      },
      {
        id: "episode-8",
        monthLabel: isRu ? "Май" : "May",
        dayLabel: "3",
        meta: isRu ? "Эпизод 8 • 3 мая" : "Episode 8 • May 3",
        title: isRu ? "Без названия" : "Untitled",
        closedAt: isRu ? "Закрыт 19:36" : "Closed 19:36",
        description: isRu ? "Без описания" : "No description",
        actionLabel: isRu ? "Разбор" : "Review",
      },
    ],
  };
}
