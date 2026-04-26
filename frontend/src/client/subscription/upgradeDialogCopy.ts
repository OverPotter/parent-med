import type { AppLanguage } from "@shared/i18n";

export type UpgradeEntryPoint =
  | "invite_family"
  | "second_child"
  | "child_actions_locked"
  | "second_pillbox_plan"
  | "live_activities";

export function getUpgradeDialogCopy(language: AppLanguage, entryPoint: UpgradeEntryPoint) {
  const commonHighlights =
    language === "ru"
      ? [
          "Семейный доступ для папы, бабушки или няни",
          "Несколько детей и больше одного плана",
          "CSV export и Live Activities",
        ]
      : [
          "Family access for a parent, grandparent, or nanny",
          "Multiple children and more than one plan",
          "CSV export and Live Activities",
        ];

  switch (entryPoint) {
    case "invite_family":
      return {
        title: language === "ru" ? "Приглашения доступны в Plus" : "Invites are available in Plus",
        description:
          language === "ru"
            ? "Откройте семейный доступ, чтобы приглашать близких и настраивать роли для каждого участника."
            : "Unlock family access to invite relatives and configure member roles.",
        highlights: commonHighlights,
      };
    case "second_child":
      return {
        title:
          language === "ru" ? "Во Free доступен один ребёнок" : "Free includes one child",
        description:
          language === "ru"
            ? "Перейдите на Plus, чтобы вести несколько детей в одной семье."
            : "Upgrade to Plus to manage multiple children in one family.",
        highlights: commonHighlights,
      };
    case "second_pillbox_plan":
      return {
        title:
          language === "ru"
            ? "Во Free доступен один план таблетницы"
            : "Free includes one pillbox plan",
        description:
          language === "ru"
            ? "Plus открывает несколько планов и общий доступ для семьи."
            : "Plus unlocks multiple plans and shared family access.",
        highlights: commonHighlights,
      };
    case "child_actions_locked":
      return {
        title:
          language === "ru"
            ? "Редактирование доступно в Plus"
            : "Editing is available in Plus",
        description:
          language === "ru"
            ? "После возврата на Free данные детей остаются видимыми, но действия по уходу и редактирование профиля доступны только в Plus."
            : "After downgrading to Free, child data stays visible, but care actions and profile editing are available only in Plus.",
        highlights: commonHighlights,
      };
    case "live_activities":
      return {
        title:
          language === "ru"
            ? "Live Activities доступны в Plus"
            : "Live Activities are available in Plus",
        description:
          language === "ru"
            ? "Откройте быстрый контроль приёмов и состояния ребёнка прямо с экрана блокировки."
            : "Unlock quick dose and illness tracking directly from the lock screen.",
        highlights: commonHighlights,
      };
  }
}
