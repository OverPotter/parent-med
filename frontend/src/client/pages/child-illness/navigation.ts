import type { AppLanguage } from "@shared/i18n";
import type { Child, IllnessEpisode } from "@shared/types/api";

export const QUICK_FOCUS_VALUES = new Set([
  "temperature",
  "administration",
  "comment",
  "timeline",
  "reminders",
  "reminder-create",
  "reminder-detail",
]);

export type ChildIllnessActiveFocus =
  | "overview"
  | "temperature"
  | "administration"
  | "comment"
  | "timeline"
  | "reminders"
  | "reminder-create"
  | "reminder-detail";

export type ChildIllnessRouteState =
  | { screen: "history"; episodeId: string | null }
  | { screen: "create" }
  | {
      screen: "active";
      focus: ChildIllnessActiveFocus;
      reminderPlanId: string | null;
      picker: "cabinet" | null;
    };

export function parseChildIllnessRoute(source: URLSearchParams): ChildIllnessRouteState {
  const view = source.get("view");
  const mode = source.get("mode");
  const episodeId = source.get("episodeId");
  const focus = source.get("focus") ?? source.get("compose");
  const plan = source.get("plan");
  const picker = source.get("picker") === "cabinet" ? "cabinet" : null;

  if (view === "history") {
    return {
      screen: "history",
      episodeId,
    };
  }

  if (mode === "create") {
    return { screen: "create" };
  }

  const activeFocus: ChildIllnessActiveFocus =
    focus && QUICK_FOCUS_VALUES.has(focus) ? (focus as ChildIllnessActiveFocus) : "overview";

  return {
    screen: "active",
    focus: activeFocus,
    reminderPlanId: activeFocus === "reminder-detail" ? plan : null,
    picker,
  };
}

export function buildChildIllnessUrl(childId: string, route: ChildIllnessRouteState) {
  if (route.screen === "history") {
    return route.episodeId
      ? `/children/${childId}/illness?view=history&episodeId=${route.episodeId}`
      : `/children/${childId}/illness?view=history`;
  }

  if (route.screen === "create") {
    return `/children/${childId}/illness?mode=create`;
  }

  if (route.focus === "overview") {
    return `/children/${childId}/illness`;
  }

  const params = new URLSearchParams([["focus", route.focus]]);
  if (route.focus === "reminder-detail" && route.reminderPlanId) {
    params.set("plan", route.reminderPlanId);
  }
  if (
    route.picker === "cabinet" &&
    (route.focus === "reminder-create" || route.focus === "reminder-detail")
  ) {
    params.set("picker", "cabinet");
  }

  return `/children/${childId}/illness?${params.toString()}`;
}

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

export function resolveChildIllnessGuard(args: {
  childId: string;
  route: ChildIllnessRouteState;
  canActIllness: boolean;
  canEditIllness: boolean;
  activeEpisode: Pick<IllnessEpisode, "medicationMode"> | null | undefined;
  isActiveEpisodeFetched: boolean;
  hasFocusedHistoryEpisode: boolean;
  hasSelectedReminderPlan?: boolean | null;
}): string | null {
  const {
    childId,
    route,
    canActIllness,
    canEditIllness,
    activeEpisode,
    isActiveEpisodeFetched,
    hasFocusedHistoryEpisode,
    hasSelectedReminderPlan = null,
  } = args;
  const activeOverviewRoute = buildChildIllnessUrl(childId, {
    screen: "active",
    focus: "overview",
    reminderPlanId: null,
    picker: null,
  });
  const activeRemindersRoute = buildChildIllnessUrl(childId, {
    screen: "active",
    focus: "reminders",
    reminderPlanId: null,
    picker: null,
  });

  if (route.screen === "create" && !canEditIllness) {
    return activeEpisode ? "/illnesses/active" : activeOverviewRoute;
  }

  if (route.screen === "create" && isActiveEpisodeFetched && activeEpisode) {
    return "/illnesses/active";
  }

  if (
    route.screen === "active" &&
    (route.focus === "temperature" ||
      route.focus === "administration" ||
      route.focus === "comment") &&
    !canActIllness
  ) {
    return activeEpisode ? "/illnesses/active" : activeOverviewRoute;
  }

  if (route.screen === "active" && route.focus === "reminder-create" && !canEditIllness) {
    return activeEpisode ? activeRemindersRoute : activeOverviewRoute;
  }

  if (
    route.screen === "active" &&
    isActiveEpisodeFetched &&
    !activeEpisode &&
    route.focus !== "overview"
  ) {
    return activeOverviewRoute;
  }

  if (
    route.screen === "active" &&
    (route.focus === "reminders" ||
      route.focus === "reminder-create" ||
      route.focus === "reminder-detail") &&
    activeEpisode?.medicationMode !== "guided"
  ) {
    return activeEpisode ? "/illnesses/active" : activeOverviewRoute;
  }

  if (route.screen === "active" && route.focus === "reminder-detail" && !route.reminderPlanId) {
    return activeEpisode ? activeRemindersRoute : activeOverviewRoute;
  }

  if (
    route.screen === "active" &&
    route.focus === "reminder-detail" &&
    route.reminderPlanId &&
    hasSelectedReminderPlan === false
  ) {
    return activeEpisode ? activeRemindersRoute : activeOverviewRoute;
  }

  if (
    isActiveEpisodeFetched &&
    activeEpisode &&
    route.screen === "active" &&
    route.focus === "overview"
  ) {
    return "/illnesses/active";
  }

  if (route.screen === "history" && route.episodeId && !hasFocusedHistoryEpisode) {
    return buildChildIllnessUrl(childId, { screen: "history", episodeId: null });
  }

  return null;
}

export function buildChildIllnessBackState(args: {
  language: AppLanguage;
  childId: string;
  route: ChildIllnessRouteState;
  activeEpisode: Pick<IllnessEpisode, "medicationMode"> | null | undefined;
}): { href: string; label: string } {
  const { language, childId, route, activeEpisode } = args;

  if (
    route.screen === "active" &&
    route.picker === "cabinet" &&
    route.focus === "reminder-detail" &&
    route.reminderPlanId
  ) {
    return {
      href: `/children/${childId}/illness?focus=reminder-detail&plan=${route.reminderPlanId}`,
      label: language === "ru" ? "← К напоминанию" : "← Back to reminder",
    };
  }

  if (
    route.screen === "active" &&
    route.picker === "cabinet" &&
    route.focus === "reminder-create"
  ) {
    return {
      href: `/children/${childId}/illness?focus=reminder-create`,
      label: language === "ru" ? "← К созданию" : "← Back to create",
    };
  }

  if (route.screen === "history" && route.episodeId) {
    return {
      href: `/children/${childId}/illness?view=history`,
      label: language === "ru" ? "← Ко всей истории" : "← Back to history",
    };
  }

  if (route.screen === "history") {
    return {
      href: `/children/${childId}`,
      label: language === "ru" ? "← К профилю ребёнка" : "← Back to child profile",
    };
  }

  if (route.screen === "active" && route.focus === "reminder-detail") {
    return {
      href: `/children/${childId}/illness?focus=reminders`,
      label: language === "ru" ? "← К напоминаниям" : "← Back to reminders",
    };
  }

  if (route.screen === "active" && route.focus === "reminder-create") {
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

  if (route.screen === "active" && (route.focus !== "overview" || activeEpisode)) {
    return {
      href: `/children/${childId}`,
      label: language === "ru" ? "← К профилю ребёнка" : "← Back to child profile",
    };
  }

  if (route.screen === "create") {
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
  route: ChildIllnessRouteState;
  historyEpisodesCount: number;
}): { title?: string; hint?: string } {
  const { language, child, activeEpisode, route, historyEpisodesCount } = args;
  const historyOnlyView = route.screen === "history";
  const historyEpisodeInsightsMode = route.screen === "history" && Boolean(route.episodeId);
  const createMode = route.screen === "create";

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
