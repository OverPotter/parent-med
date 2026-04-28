import type { AppLanguage } from "@shared/i18n";

export type UpgradeEntryPoint =
  | "invite_family"
  | "second_child"
  | "child_actions_locked"
  | "csv_export"
  | "second_pillbox_plan"
  | "medicine_catalog"
  | "live_activities";

export function getUpgradeDialogCopy(language: AppLanguage, entryPoint: UpgradeEntryPoint) {
  const commonHighlights =
    language === "ru"
      ? [
          "Семейный доступ для папы, бабушки или няни",
          "Несколько детей, наблюдений и планов лекарств",
          "Таблетница с напоминаниями и отдельными планами для семьи",
          "Live Activities, CSV export и общий рабочий сценарий для семьи",
        ]
      : [
          "Family access for a parent, grandparent, or nanny",
          "Multiple children, observations, and medication plans",
          "A shared pillbox with reminders and separate family plans",
          "Live Activities, CSV export, and a shared family workflow",
        ];

  switch (entryPoint) {
    case "invite_family":
      return {
        title: language === "ru" ? "Подключите семью" : "Invite your family",
        description:
          language === "ru"
            ? "Приглашайте близких в общий семейный кабинет и настраивайте доступ для каждого: кто видит детей, аптечку и таблетницу."
            : "Invite relatives into one shared family workspace and decide who can see children, the medicine cabinet, and the pillbox.",
        highlights: commonHighlights,
      };
    case "second_child":
      return {
        title: language === "ru" ? "Добавьте ещё детей" : "Add more children",
        description:
          language === "ru"
            ? "С Plus у семьи может быть несколько детских профилей, отдельных наблюдений и своих рабочих сценариев без путаницы."
            : "With Plus, your family can keep multiple child profiles, separate observations, and clear care workflows without confusion.",
        highlights: commonHighlights,
      };
    case "second_pillbox_plan":
      return {
        title: language === "ru" ? "Создайте ещё планы лекарств" : "Create more medication plans",
        description:
          language === "ru"
            ? "Создавайте отдельные планы лекарств для детей и близких, ставьте их на паузу и возвращайте в работу без потери истории."
            : "Create separate medication plans for kids and relatives, pause them, and bring them back without losing history.",
        highlights: commonHighlights,
      };
    case "medicine_catalog":
      return {
        title: language === "ru" ? "Откройте справочник лекарств" : "Unlock the medicine catalog",
        description:
          language === "ru"
            ? "Добавляйте препараты из справочника быстрее: с готовыми подсказками по форме, применению и сроку после вскрытия."
            : "Add medicines faster from the catalog with ready-made form, usage, and after-opening guidance.",
        highlights: commonHighlights,
      };
    case "child_actions_locked":
      return {
        title: language === "ru" ? "Верните полный доступ к ребёнку" : "Restore full child access",
        description:
          language === "ru"
            ? "Во Free данные ребёнка остаются видимыми, а в Plus снова открываются действия по уходу, наблюдения и редактирование профиля."
            : "Child data stays visible in Free, while Plus unlocks care actions, observations, and profile editing again.",
        highlights: commonHighlights,
      };
    case "csv_export":
      return {
        title: language === "ru" ? "Откройте экспорт данных" : "Unlock data export",
        description:
          language === "ru"
            ? "В Plus можно выгружать историю ребёнка в CSV и XLSX: сводку, журнал ухода и журнал болезней."
            : "Plus unlocks child exports in CSV and XLSX: a summary, a care journal, and an illness journal.",
        highlights: commonHighlights,
      };
    case "live_activities":
      return {
        title: language === "ru" ? "Включите Live Activities" : "Enable Live Activities",
        description:
          language === "ru"
            ? "Следите за таблетницей и состоянием ребёнка прямо с экрана блокировки, не открывая приложение каждый раз."
            : "Track the pillbox and a child’s current state right from the lock screen without opening the app every time.",
        highlights: commonHighlights,
      };
  }
}
