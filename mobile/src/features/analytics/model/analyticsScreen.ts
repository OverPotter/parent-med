import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  MobileBottomTabItem,
  MobileBottomTabKey,
} from "../../../shared/components/MobileBottomTabBar";

export type AnalyticsMetricCard = {
  id: string;
  chip: string;
  value: string;
  subtext: string;
  accent: {
    cardTint: string;
    chipBg: string;
    dot: string;
    border: string;
  };
};

export type AnalyticsPeriodOption = {
  id: "month" | "quarter" | "halfYear" | "year" | "allTime";
  label: string;
  helperLabel: string;
};

export type AnalyticsEpisodeCard = {
  id: string;
  meta: string;
  title: string;
  closedAt: string;
  description: string;
  actionLabel: string;
};

export type AnalyticsScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  periodTitle: string;
  periodOptions: AnalyticsPeriodOption[];
  metrics: AnalyticsMetricCard[];
  episodesTitle: string;
  filterLabel: string;
  episodes: AnalyticsEpisodeCard[];
  tabs: MobileBottomTabItem[];
};

function buildTabs(locale: MobileLocale): MobileBottomTabItem[] {
  const labels: Record<MobileBottomTabKey, string> =
    locale === "ru"
      ? {
          children: "Дети",
          analytics: "Аналитика",
          cabinet: "Аптечка",
          more: "Ещё",
          pillbox: "Таблетница",
        }
      : {
          children: "Children",
          analytics: "Analytics",
          cabinet: "Cabinet",
          more: "More",
          pillbox: "Pillbox",
        };

  return [
    { key: "children", label: labels.children, active: false },
    { key: "analytics", label: labels.analytics, active: true },
    { key: "cabinet", label: labels.cabinet, active: false },
    { key: "more", label: labels.more, active: false },
  ];
}

export function buildAnalyticsScreenContent(
  locale: MobileLocale,
): AnalyticsScreenContent {
  const isRu = locale === "ru";

  return {
    backLabel: isRu ? "Назад" : "Back",
    title: isRu ? "Аналитика" : "Analytics",
    subtitle: isRu
      ? "Сводка и завершённые наблюдения по ребёнку."
      : "Summary and completed observations for the child.",
    periodTitle: isRu ? "Период сводки" : "Summary period",
    periodOptions: [
      {
        id: "month",
        label: isRu ? "Месяц" : "Month",
        helperLabel: isRu
          ? "Сводка считает завершённые эпизоды за последний месяц."
          : "The summary counts completed episodes for the last month.",
      },
      {
        id: "quarter",
        label: isRu ? "3 месяца" : "3 months",
        helperLabel: isRu
          ? "Сводка считает завершённые эпизоды за последние 3 месяца."
          : "The summary counts completed episodes for the last 3 months.",
      },
      {
        id: "halfYear",
        label: isRu ? "6 месяцев" : "6 months",
        helperLabel: isRu
          ? "Сводка считает завершённые эпизоды за последние 6 месяцев."
          : "The summary counts completed episodes for the last 6 months.",
      },
      {
        id: "year",
        label: isRu ? "Год" : "Year",
        helperLabel: isRu
          ? "Сводка считает завершённые эпизоды за последний год."
          : "The summary counts completed episodes for the last year.",
      },
      {
        id: "allTime",
        label: isRu ? "Всё время" : "All time",
        helperLabel: isRu
          ? "Сводка считает завершённые эпизоды за всё время."
          : "The summary counts completed episodes for all time.",
      },
    ],
    metrics: [
      {
        id: "period",
        chip: isRu ? "За период" : "In period",
        value: "9",
        subtext: isRu ? "эпизодов" : "episodes",
        accent: {
          cardTint: "#FFF0EA",
          chipBg: "#FFE7E2",
          dot: "#F47667",
          border: "#F3D7CF",
        },
      },
      {
        id: "average",
        chip: isRu ? "Средняя" : "Average",
        value: "1",
        subtext: isRu ? "в день" : "a day",
        accent: {
          cardTint: "#FFF6E9",
          chipBg: "#FFF0D8",
          dot: "#F4A33C",
          border: "#EFDCC0",
        },
      },
      {
        id: "medicine",
        chip: isRu ? "Лекарства" : "Medicine",
        value: "3",
        subtext: isRu ? "раза" : "times",
        accent: {
          cardTint: "#EEF9F1",
          chipBg: "#DFF3E4",
          dot: "#47B96B",
          border: "#D4EAD9",
        },
      },
      {
        id: "long",
        chip: isRu ? "Долгий" : "Longest",
        value: "1",
        subtext: isRu ? "эпизод" : "episode",
        accent: {
          cardTint: "#FFF8EE",
          chipBg: "#FFF0DA",
          dot: "#E7A93D",
          border: "#EEDFC7",
        },
      },
      {
        id: "month",
        chip: isRu ? "Активный" : "Active",
        value: isRu ? "Май" : "May",
        subtext: isRu ? "месяц" : "month",
        accent: {
          cardTint: "#EEF6FF",
          chipBg: "#DCEEFF",
          dot: "#4A9BFF",
          border: "#D7E6F6",
        },
      },
      {
        id: "total",
        chip: isRu ? "Всего" : "Total",
        value: "9",
        subtext: isRu ? "эпизодов" : "episodes",
        accent: {
          cardTint: "#F5EEFF",
          chipBg: "#EBDDFF",
          dot: "#9465F1",
          border: "#E0D3F3",
        },
      },
    ],
    episodesTitle: isRu ? "Завершённые эпизоды" : "Completed episodes",
    filterLabel: isRu ? "Фильтры" : "Filters",
    episodes: [
      {
        id: "episode-9",
        meta: isRu ? "Эпизод 9 • 3 мая" : "Episode 9 • May 3",
        title: isRu ? "Без названия" : "Untitled",
        closedAt: isRu ? "Закрыт 23:20 • 3 мая" : "Closed 23:20 • May 3",
        description: isRu ? "Без описания" : "No description",
        actionLabel: isRu ? "Разбор" : "Review",
      },
      {
        id: "episode-8",
        meta: isRu ? "Эпизод 8 • 3 мая" : "Episode 8 • May 3",
        title: isRu ? "Без названия" : "Untitled",
        closedAt: isRu ? "Закрыт 19:36 • 3 мая" : "Closed 19:36 • May 3",
        description: isRu ? "Без описания" : "No description",
        actionLabel: isRu ? "Разбор" : "Review",
      },
      {
        id: "episode-7",
        meta: isRu ? "Эпизод 7 • 2 мая" : "Episode 7 • May 2",
        title: isRu ? "Без названия" : "Untitled",
        closedAt: isRu ? "Закрыт 14:10 • 2 мая" : "Closed 14:10 • May 2",
        description: isRu ? "Без описания" : "No description",
        actionLabel: isRu ? "Разбор" : "Review",
      },
    ],
    tabs: buildTabs(locale),
  };
}
