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

  return {
    eyebrow: isRu ? "ЭКСПОРТ" : "EXPORT",
    title: isRu ? "Поделиться данными ребёнка" : "Share child data",
    subtitle: isRu
      ? "Выберите, какие данные нужны и за какой период."
      : "Choose which data you need and for what period.",
    exportWhatLabel: isRu ? "Что экспортировать" : "What to export",
    periodLabel: isRu ? "Период" : "Period",
    saveCsv: isRu ? "Сохранить CSV" : "Save CSV",
    saveXlsx: isRu ? "Сохранить XLSX" : "Save XLSX",
    optionLabels: {
      analytics_summary: isRu ? "Сводка" : "Summary",
      child_illness: isRu ? "Болезни" : "Illness",
      child_care: isRu ? "Уход" : "Care",
      all_exports: isRu ? "Все файлы" : "All files",
    } satisfies Record<ChildExportKind, string>,
    periodOptions: [
      { value: "two_weeks" as const, label: isRu ? "2 недели" : "2 weeks" },
      { value: "month" as const, label: isRu ? "30 дней" : "30 days" },
      { value: "half_year" as const, label: isRu ? "6 месяцев" : "6 months" },
      { value: "all" as const, label: isRu ? "Всё время" : "All time" },
    ],
  };
}
