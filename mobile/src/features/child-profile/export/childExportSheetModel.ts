import { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type ChildExportKind =
  | "analytics_summary"
  | "child_illness"
  | "child_care"
  | "all_exports";

export type ChildExportPeriod = "two_weeks" | "month" | "half_year" | "all";

export type ChildExportOption = {
  kind: ChildExportKind;
  tint: "coral" | "green" | "purple";
};

export type ChildExportPeriodOption = {
  value: ChildExportPeriod;
  label: string;
};

export const childExportOptions: ChildExportOption[] = [
  {
    kind: "analytics_summary",
    tint: "coral",
  },
  {
    kind: "child_illness",
    tint: "coral",
  },
  {
    kind: "child_care",
    tint: "green",
  },
  {
    kind: "all_exports",
    tint: "purple",
  },
];

export const defaultChildExportKind: ChildExportKind = "analytics_summary";
export const defaultChildExportPeriod: ChildExportPeriod = "two_weeks";

export function getChildExportDescription(
  kind: ChildExportKind,
  locale: MobileLocale,
) {
  const labels =
    locale === "ru"
      ? {
          analytics_summary:
            "Рост, вес, сон, кормления и общие показатели за период.",
          child_illness:
            "Температура, лекарства, комментарии и эпизоды болезни.",
          child_care: "Отдельные таблицы со сном, кормлениями, весом и ростом.",
          all_exports: "Сводка, болезни и уход одним архивом.",
        }
      : locale === "pl"
        ? {
            analytics_summary:
              "Wzrost, waga, sen, karmienia i główne wskaźniki za wybrany okres.",
            child_illness:
              "Temperatura, leki, komentarze i epizody choroby.",
            child_care:
              "Oddzielne tabele ze snem, karmieniami, wagą i wzrostem.",
            all_exports: "Podsumowanie, choroby i opieka w jednym archiwum.",
          }
        : locale === "de"
          ? {
              analytics_summary:
                "Wachstum, Gewicht, Schlaf, Fütterungen und wichtige Kennzahlen für den Zeitraum.",
              child_illness:
                "Temperatur, Medikamente, Kommentare und Krankheitsverläufe.",
              child_care:
                "Separate Tabellen zu Schlaf, Fütterungen, Gewicht und Größe.",
              all_exports:
                "Zusammenfassung, Krankheiten und Pflege in einem Archiv.",
            }
        : {
            analytics_summary:
              "Growth, weight, sleep, feedings, and key metrics for the period.",
            child_illness:
              "Temperature, medicines, comments, and illness episodes.",
            child_care:
              "Separate tables for sleep, feedings, weight, and height.",
            all_exports: "Summary, illness, and care in one archive.",
          };

  return labels[kind];
}

export function buildChildExportContent(locale: MobileLocale) {
  const isRu = locale === "ru";
  const isPl = locale === "pl";
  const isDe = locale === "de";

  return {
    eyebrow: isRu ? "ЭКСПОРТ" : isPl ? "EKSPORT" : isDe ? "EXPORT" : "EXPORT",
    title: isRu
      ? "Поделиться данными ребёнка"
      : isPl
        ? "Udostępnij dane dziecka"
        : isDe
          ? "Kinderdaten teilen"
          : "Share child data",
    subtitle: isRu
      ? "Выберите, какие данные нужны и за какой период."
      : isPl
        ? "Wybierz, jakie dane są potrzebne i za jaki okres."
        : isDe
          ? "Wählen Sie aus, welche Daten und für welchen Zeitraum benötigt werden."
          : "Choose which data you need and for what period.",
    exportWhatLabel: isRu
      ? "Что экспортировать"
      : isPl
        ? "Co eksportować"
        : isDe
          ? "Was exportieren"
          : "What to export",
    periodLabel: isRu ? "Период" : isPl ? "Okres" : isDe ? "Zeitraum" : "Period",
    saveCsv: isRu ? "Сохранить CSV" : isPl ? "Zapisz CSV" : isDe ? "CSV speichern" : "Save CSV",
    saveXlsx: isRu ? "Сохранить XLSX" : isPl ? "Zapisz XLSX" : isDe ? "XLSX speichern" : "Save XLSX",
    optionLabels: {
      analytics_summary: isRu ? "Сводка" : isPl ? "Podsumowanie" : isDe ? "Übersicht" : "Summary",
      child_illness: isRu ? "Болезни" : isPl ? "Choroby" : isDe ? "Krankheiten" : "Illness",
      child_care: isRu ? "Уход" : isPl ? "Opieka" : isDe ? "Pflege" : "Care",
      all_exports: isRu ? "Все файлы" : isPl ? "Wszystkie pliki" : isDe ? "Alle Dateien" : "All files",
    } satisfies Record<ChildExportKind, string>,
    periodOptions: [
      { value: "two_weeks" as const, label: isRu ? "2 недели" : isPl ? "2 tygodnie" : isDe ? "2 Wochen" : "2 weeks" },
      { value: "month" as const, label: isRu ? "30 дней" : isPl ? "30 dni" : isDe ? "30 Tage" : "30 days" },
      { value: "half_year" as const, label: isRu ? "6 месяцев" : isPl ? "6 miesięcy" : isDe ? "6 Monate" : "6 months" },
      { value: "all" as const, label: isRu ? "Всё время" : isPl ? "Cały okres" : isDe ? "Gesamter Zeitraum" : "All time" },
    ],
  };
}
