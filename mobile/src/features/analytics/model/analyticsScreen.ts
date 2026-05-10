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
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    backLabel: isRu ? "Назад" : isDe ? "Zurück" : isPl ? "Wstecz" : "Back",
    title: isRu ? "Аналитика" : isDe ? "Analytik" : isPl ? "Analityka" : "Analytics",
    subtitle: isRu
      ? "Короткая сводка по завершённым эпизодам ребёнка."
      : isDe
        ? "Kurze Übersicht über die abgeschlossenen Episoden des Kindes."
      : isPl
        ? "Krótki przegląd zakończonych epizodów dziecka."
      : "Short summary of the child's completed episodes.",
    periodOptions: [
      {
        id: "month",
        label: isRu ? "Месяц" : isDe ? "Monat" : isPl ? "Miesiąc" : "Month",
        helperLabel: isRu ? "Сводка за последний месяц." : isDe ? "Übersicht für den letzten Monat." : isPl ? "Podsumowanie za ostatni miesiąc." : "Summary for the last month.",
      },
      {
        id: "quarter",
        label: isRu ? "3 месяца" : isDe ? "3 Monate" : isPl ? "3 miesiące" : "3 months",
        helperLabel: isRu
          ? "Сводка за последние 3 месяца."
          : isDe
            ? "Übersicht für die letzten 3 Monate."
          : isPl
            ? "Podsumowanie za ostatnie 3 miesiące."
          : "Summary for the last 3 months.",
      },
      {
        id: "halfYear",
        label: isRu ? "6 месяцев" : isDe ? "6 Monate" : isPl ? "6 miesięcy" : "6 months",
        helperLabel: isRu
          ? "Сводка за последние 6 месяцев."
          : isDe
            ? "Übersicht für die letzten 6 Monate."
          : isPl
            ? "Podsumowanie za ostatnie 6 miesięcy."
          : "Summary for the last 6 months.",
      },
      {
        id: "year",
        label: isRu ? "Год" : isDe ? "Jahr" : isPl ? "Rok" : "Year",
        helperLabel: isRu ? "Сводка за последний год." : isDe ? "Übersicht für das letzte Jahr." : isPl ? "Podsumowanie za ostatni rok." : "Summary for the last year.",
      },
      {
        id: "allTime",
        label: isRu ? "Всё время" : isDe ? "Gesamter Zeitraum" : isPl ? "Cały okres" : "All time",
        helperLabel: isRu ? "Сводка за всё время." : isDe ? "Übersicht für den gesamten Zeitraum." : isPl ? "Podsumowanie za cały okres." : "Summary for all time.",
      },
    ],
    mainSummaryTitle: isRu ? "Главное за период" : isDe ? "Wichtigstes im Zeitraum" : isPl ? "Najważniejsze w tym okresie" : "Highlights for the period",
    mainSummaryInsights: [
      {
        id: "completed",
        icon: "completed",
        title: isRu ? "9 завершённых эпизодов" : isDe ? "9 abgeschlossene Episoden" : isPl ? "9 zakończonych epizodów" : "9 completed episodes",
        subtitle: isRu ? "Вы справились!" : isDe ? "Gut geschafft." : isPl ? "Daliście radę." : "You handled it.",
      },
      {
        id: "month",
        icon: "activeMonth",
        title: isRu ? "Активный месяц — май" : isDe ? "Aktivster Monat — Mai" : isPl ? "Najaktywniejszy miesiąc — maj" : "Most active month — May",
        subtitle: isRu
          ? "Больше всего записей в этом месяце."
          : isDe
            ? "In diesem Monat wurden die meisten Einträge hinzugefügt."
          : isPl
            ? "Najwięcej wpisów dodano w tym miesiącu."
          : "Most records were added in this month.",
      },
      {
        id: "medicine",
        icon: "medicine",
        title: isRu
          ? "Лекарства применялись 3 раза"
          : isDe
            ? "Medikamente wurden 3 Mal verwendet"
          : isPl
            ? "Leki podano 3 razy"
            : "Medicine was used 3 times",
        subtitle: isRu
          ? "Приёмы фиксировались по назначениям."
          : isDe
            ? "Einnahmen wurden nach Plan erfasst."
          : isPl
            ? "Dawki były zapisywane zgodnie z planem."
          : "Doses were tracked by schedule.",
      },
    ],
    highlights: [
      {
        id: "average",
        label: isRu ? "Средняя длительность" : isDe ? "Durchschnittliche Dauer" : isPl ? "Średni czas trwania" : "Average duration",
        value: isRu ? "1 день" : isDe ? "1 Tag" : isPl ? "1 dzień" : "1 day",
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
        label: isRu ? "Самый долгий эпизод" : isDe ? "Längste Episode" : isPl ? "Najdłuższy epizod" : "Longest episode",
        value: isRu ? "1 эпизод" : isDe ? "1 Episode" : isPl ? "1 epizod" : "1 episode",
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
        label: isRu ? "Наблюдений за период" : isDe ? "Beobachtungen im Zeitraum" : isPl ? "Obserwacje w okresie" : "Observations in period",
        value: isRu ? "9 эпизодов" : isDe ? "9 Episoden" : isPl ? "9 epizodów" : "9 episodes",
        icon: "observations",
        accent: {
          background: "#FFFDFC",
          border: "#DDC9FA",
          iconBackground: "#F1EAFE",
          iconColor: "#9A72F5",
        },
      },
    ],
    episodesTitle: isRu ? "Завершённые эпизоды" : isDe ? "Abgeschlossene Episoden" : isPl ? "Zakończone epizody" : "Completed episodes",
    episodesHelper: isRu
      ? "Все завершённые эпизоды за выбранный период."
      : isDe
        ? "Alle abgeschlossenen Episoden im gewählten Zeitraum."
      : isPl
        ? "Wszystkie zakończone epizody w wybranym okresie."
      : "All completed episodes for the selected period.",
    episodes: [
      {
        id: "episode-9",
        monthLabel: isRu ? "Май" : isDe ? "Mai" : isPl ? "Maj" : "May",
        dayLabel: "3",
        meta: isRu ? "Эпизод 9 • 3 мая" : isDe ? "Episode 9 • 3. Mai" : isPl ? "Epizod 9 • 3 maja" : "Episode 9 • May 3",
        title: isRu ? "Без названия" : isDe ? "Ohne Titel" : isPl ? "Bez nazwy" : "Untitled",
        closedAt: isRu ? "Закрыт 23:20" : isDe ? "Geschlossen 23:20" : isPl ? "Zamknięto 23:20" : "Closed 23:20",
        description: isRu ? "Без описания" : isDe ? "Keine Beschreibung" : isPl ? "Brak opisu" : "No description",
        actionLabel: isRu ? "Разбор" : isDe ? "Details" : isPl ? "Przegląd" : "Review",
      },
      {
        id: "episode-8",
        monthLabel: isRu ? "Май" : isDe ? "Mai" : isPl ? "Maj" : "May",
        dayLabel: "3",
        meta: isRu ? "Эпизод 8 • 3 мая" : isDe ? "Episode 8 • 3. Mai" : isPl ? "Epizod 8 • 3 maja" : "Episode 8 • May 3",
        title: isRu ? "Без названия" : isDe ? "Ohne Titel" : isPl ? "Bez nazwy" : "Untitled",
        closedAt: isRu ? "Закрыт 19:36" : isDe ? "Geschlossen 19:36" : isPl ? "Zamknięto 19:36" : "Closed 19:36",
        description: isRu ? "Без описания" : isDe ? "Keine Beschreibung" : isPl ? "Brak opisu" : "No description",
        actionLabel: isRu ? "Разбор" : isDe ? "Details" : isPl ? "Przegląd" : "Review",
      },
    ],
  };
}
