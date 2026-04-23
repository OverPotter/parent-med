import type { AppLanguage } from "@shared/i18n";
import type { Child, IllnessEpisode } from "@shared/types/api";

const QUICK_FOCUS_VALUES = new Set([
  "temperature",
  "administration",
  "comment",
  "timeline",
  "reminders",
  "reminder-create",
  "reminder-detail",
]);

export function normalizeChildIllnessSearchParams(
  source: URLSearchParams,
  options: {
    isActiveEpisodeFetched: boolean;
    hasActiveEpisode: boolean;
    activeEpisodeMedicationMode: string | null;
  }
): URLSearchParams {
  const next = new URLSearchParams();
  const view = source.get("view");
  const mode = source.get("mode");
  const episodeId = source.get("episodeId");
  const focus = source.get("focus") ?? source.get("compose");
  const plan = source.get("plan");
  const picker = source.get("picker");

  if (view === "history") {
    next.set("view", "history");
    if (episodeId) {
      next.set("episodeId", episodeId);
      return next;
    }
    return next;
  }

  const canKeepCreateMode =
    mode === "create" && (!options.isActiveEpisodeFetched || !options.hasActiveEpisode);
  if (canKeepCreateMode) {
    next.set("mode", "create");
    return next;
  }

  if (options.isActiveEpisodeFetched && !options.hasActiveEpisode) {
    return next;
  }

  if (!focus || !QUICK_FOCUS_VALUES.has(focus)) {
    return next;
  }

  const reminderFocus =
    focus === "reminders" || focus === "reminder-create" || focus === "reminder-detail";
  if (reminderFocus && options.activeEpisodeMedicationMode !== "guided") {
    return next;
  }

  if (focus === "reminder-detail") {
    if (!plan) {
      next.set("focus", "reminders");
      return next;
    }
    next.set("focus", "reminder-detail");
    next.set("plan", plan);
    if (picker === "cabinet") {
      next.set("picker", "cabinet");
    }
    return next;
  }

  next.set("focus", focus);
  if (focus === "reminder-create" && picker === "cabinet") {
    next.set("picker", "cabinet");
  }
  return next;
}

export function buildChildIllnessBackState(args: {
  language: AppLanguage;
  childId: string;
  searchParams: URLSearchParams;
  activeEpisode: Pick<IllnessEpisode, "medicationMode"> | null | undefined;
  historyOnlyView: boolean;
  historyEpisodeInsightsMode: boolean;
  createMode: boolean;
  quickComposeMode: string | null;
  quickTimelineMode: boolean;
  quickReminderMode: boolean;
  quickReminderCreateMode: boolean;
  quickReminderDetailMode: boolean;
  reminderPlanId: string | null;
}): { href: string; label: string } {
  const {
    language,
    childId,
    searchParams,
    activeEpisode,
    historyOnlyView,
    historyEpisodeInsightsMode,
    createMode,
    quickComposeMode,
    quickTimelineMode,
    quickReminderMode,
    quickReminderCreateMode,
    quickReminderDetailMode,
    reminderPlanId,
  } = args;

  if (searchParams.get("picker") === "cabinet" && quickReminderDetailMode && reminderPlanId) {
    return {
      href: `/children/${childId}/illness?focus=reminder-detail&plan=${reminderPlanId}`,
      label: language === "ru" ? "← К напоминанию" : "← Back to reminder",
    };
  }

  if (searchParams.get("picker") === "cabinet" && quickReminderCreateMode) {
    return {
      href: `/children/${childId}/illness?focus=reminder-create`,
      label: language === "ru" ? "← К созданию" : "← Back to create",
    };
  }

  if (historyEpisodeInsightsMode) {
    return {
      href: `/children/${childId}/illness?view=history`,
      label: language === "ru" ? "← Ко всей истории" : "← Back to history",
    };
  }

  if (historyOnlyView) {
    return {
      href: `/children/${childId}`,
      label: language === "ru" ? "← К профилю ребёнка" : "← Back to child profile",
    };
  }

  if (quickReminderDetailMode) {
    return {
      href: `/children/${childId}/illness?focus=reminders`,
      label: language === "ru" ? "← К напоминаниям" : "← Back to reminders",
    };
  }

  if (quickReminderCreateMode) {
    const href =
      activeEpisode?.medicationMode === "guided"
        ? `/children/${childId}/illness?focus=reminders`
        : `/children/${childId}`;
    return {
      href,
      label:
        href === `/children/${childId}`
          ? language === "ru"
            ? "← К профилю ребёнка"
            : "← Back to child profile"
          : language === "ru"
            ? "← К напоминаниям"
            : "← Back to reminders",
    };
  }

  if (quickReminderMode || quickComposeMode || quickTimelineMode || (activeEpisode && !historyOnlyView)) {
    return {
      href: `/children/${childId}`,
      label: language === "ru" ? "← К профилю ребёнка" : "← Back to child profile",
    };
  }

  if (createMode) {
    return {
      href: `/children/${childId}`,
      label: language === "ru" ? "← К профилю ребёнка" : "← Back to child profile",
    };
  }

  return {
    href: "/children",
    label: language === "ru" ? "← К списку детей" : "← Back to children",
  };
}

export function buildChildIllnessTopBarState(args: {
  language: AppLanguage;
  child: Pick<Child, "name">;
  activeEpisode: IllnessEpisode | null | undefined;
  historyOnlyView: boolean;
  historyEpisodeInsightsMode: boolean;
  historyEpisodesCount: number;
  createMode: boolean;
}): { title?: string; hint?: string } {
  const {
    language,
    child,
    activeEpisode,
    historyOnlyView,
    historyEpisodeInsightsMode,
    historyEpisodesCount,
    createMode,
  } = args;

  const title =
    historyOnlyView || (!activeEpisode && !createMode)
      ? child.name
      : !activeEpisode && createMode
        ? `${language === "ru" ? "Новое наблюдение" : "New tracking"} · ${child.name}`
        : undefined;

  const hint = historyOnlyView
    ? historyEpisodeInsightsMode
      ? language === "ru"
        ? "Подробный разбор конкретного эпизода."
        : "Detailed breakdown of a specific episode."
      : historyEpisodesCount > 0
        ? language === "ru"
          ? "Сводка и завершённые наблюдения по ребёнку."
          : "Summary and completed tracking records for this child."
        : language === "ru"
          ? "Сводка появится здесь, когда завершённые наблюдения накопятся."
          : "The summary will appear here as completed tracking records build up."
    : !activeEpisode && createMode
      ? language === "ru"
        ? "Сначала просто начните наблюдение. Температуру, лекарства и напоминания можно добавить уже внутри записи."
        : "Start with a tracking session first. Temperature, medicines and reminders can be added inside it."
      : !activeEpisode && !createMode
        ? language === "ru"
          ? "Сейчас активного наблюдения нет."
          : "There is no active tracking right now."
        : undefined;

  return { title, hint };
}
