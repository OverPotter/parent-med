import type {
  Child,
  EpisodeMedicationPlan,
  FeedingRecord,
  IllnessEpisode,
  IllnessEpisodeInsights,
  SleepSession,
} from "@shared/types/api";
import { detectPreferredLanguage } from "@shared/i18n";
import { buildNativeAppUrl } from "@shared/config/nativeAppLinks";
import {
  resolveLiveActivityPreferences,
  type LiveActivityPreferencesCache,
} from "./liveActivityPreferences";
import {
  buildIllnessLiveActivitySummary,
  buildIllnessMedicationLines,
  getIllnessDurationMeta,
} from "./illnessLiveActivitySummary";
import {
  isNativeLiveActivitiesSupported,
  stopAllNativeLiveActivities,
  stopNativeLiveActivity,
  upsertNativeLiveActivity,
} from "./nativeLiveActivities";
import { appLog } from "./appLog";

function getKindLabel(kind: "sleep" | "feeding" | "illness", language: "ru" | "en") {
  if (kind === "sleep") {
    return language === "ru" ? "Идёт сон" : "Sleep in progress";
  }
  if (kind === "illness") {
    return language === "ru" ? "Идёт наблюдение" : "Tracking in progress";
  }
  return language === "ru" ? "Идёт кормление" : "Feeding in progress";
}

function isEnabled(
  kind: "sleep" | "feeding" | "illness",
  preferences = resolveLiveActivityPreferences()
) {
  if (kind === "sleep") {
    return preferences.sleepEnabled;
  }
  if (kind === "feeding") {
    return preferences.feedingEnabled;
  }
  return preferences.illnessEnabled;
}

function canSeeIllnessLiveActivity(
  episode: Pick<IllnessEpisode, "memberAccountIds">,
  currentAccountId?: string | null
) {
  if (!currentAccountId) {
    return false;
  }

  return (
    episode.memberAccountIds.length === 0 || episode.memberAccountIds.includes(currentAccountId)
  );
}

function normalizeLiveActivityStartedAt(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

async function safeStopLiveActivity(args: {
  kind: "sleep" | "feeding" | "illness";
  itemId: string;
}) {
  try {
    await stopNativeLiveActivity(args);
  } catch (error) {
    appLog.warn(`Live activity stop failed for ${args.kind}`, error);
  }
}

async function safeUpsertLiveActivity(args: {
  kind: "sleep" | "feeding" | "illness";
  itemId: string;
  language?: "ru" | "en" | null;
  title: string;
  subtitle?: string | null;
  statusLabel?: string | null;
  primaryValue?: string | null;
  primaryCaption?: string | null;
  secondaryValue?: string | null;
  secondaryCaption?: string | null;
  startedAt: string;
  deepLink?: string | null;
}) {
  try {
    await upsertNativeLiveActivity(args);
  } catch (error) {
    appLog.warn(`Live activity upsert failed for ${args.kind}`, error);
  }
}

function formatTimeLabel(value: string | null | undefined, language: "ru" | "en"): string | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function joinLiveActivityParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

function buildSinglePlanNextDose(
  plan:
    | Pick<
        EpisodeMedicationPlan,
        "minIntervalMinutes" | "customMedicineName" | "householdMedicineId"
      >
    | {
        minIntervalMinutes: number;
        customMedicineName: string | null;
        householdMedicineId?: string | null;
        householdMedicineName?: string | null;
      }
    | null
    | undefined,
  insights:
    | Pick<IllnessEpisodeInsights, "lastAdministrationAt" | "medicineNames">
    | null
    | undefined
) {
  if (!plan?.minIntervalMinutes || !insights?.lastAdministrationAt) {
    return null;
  }

  const lastAdministrationAt = Date.parse(insights.lastAdministrationAt);
  if (!Number.isFinite(lastAdministrationAt)) {
    return null;
  }

  return {
    nextDoseAt: new Date(lastAdministrationAt + plan.minIntervalMinutes * 60_000),
    medicineName:
      plan.customMedicineName?.trim() ||
      ("householdMedicineName" in plan ? plan.householdMedicineName?.trim() : null) ||
      insights.medicineNames?.[0]?.trim() ||
      null,
  };
}

function buildSleepStatusLabel(startedAt: string, language: "ru" | "en") {
  const timeLabel = formatTimeLabel(startedAt, language);
  return joinLiveActivityParts([
    language === "ru" ? "Сейчас спит" : "Sleeping now",
    timeLabel ? (language === "ru" ? `с ${timeLabel}` : `since ${timeLabel}`) : null,
  ]);
}

function buildFeedingStatusLabel(startedAt: string, language: "ru" | "en") {
  const timeLabel = formatTimeLabel(startedAt, language);
  return joinLiveActivityParts([
    language === "ru" ? "Кормление идёт" : "Feeding now",
    timeLabel ? (language === "ru" ? `с ${timeLabel}` : `since ${timeLabel}`) : null,
  ]);
}

export async function syncSleepLiveActivity(
  child: Pick<Child, "id" | "name">,
  session: Pick<SleepSession, "id" | "startedAt" | "endedAt" | "createdByAccountId"> | null,
  language: "ru" | "en",
  preferences?: LiveActivityPreferencesCache,
  currentAccountId?: string | null
) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  if (
    !session ||
    session.endedAt ||
    !isEnabled("sleep", preferences) ||
    (currentAccountId && session.createdByAccountId !== currentAccountId)
  ) {
    await safeStopLiveActivity({ kind: "sleep", itemId: child.id });
    return;
  }

  const startedAt = normalizeLiveActivityStartedAt(session.startedAt);
  if (!startedAt) {
    await safeStopLiveActivity({ kind: "sleep", itemId: child.id });
    return;
  }

  await safeUpsertLiveActivity({
    kind: "sleep",
    itemId: child.id,
    language,
    title: child.name,
    subtitle: getKindLabel("sleep", language),
    statusLabel: buildSleepStatusLabel(startedAt, language),
    primaryValue: language === "ru" ? "Идёт" : "Active",
    primaryCaption: language === "ru" ? "Статус" : "Status",
    secondaryValue: formatTimeLabel(startedAt, language),
    secondaryCaption: language === "ru" ? "Началось" : "Started",
    startedAt,
    deepLink: buildNativeAppUrl(`/children?liveChild=${child.id}&liveAction=sleep`),
  });
}

export async function syncFeedingLiveActivity(
  child: Pick<Child, "id" | "name">,
  feeding: Pick<
    FeedingRecord,
    "id" | "recordedAt" | "startedAt" | "endedAt" | "createdByAccountId"
  > | null,
  language: "ru" | "en",
  preferences?: LiveActivityPreferencesCache,
  currentAccountId?: string | null
) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  if (
    !feeding ||
    feeding.endedAt ||
    !isEnabled("feeding", preferences) ||
    (currentAccountId && feeding.createdByAccountId !== currentAccountId)
  ) {
    await safeStopLiveActivity({ kind: "feeding", itemId: child.id });
    return;
  }

  const startedAt = normalizeLiveActivityStartedAt(feeding.startedAt ?? feeding.recordedAt);
  if (!startedAt) {
    await safeStopLiveActivity({ kind: "feeding", itemId: child.id });
    return;
  }

  await safeUpsertLiveActivity({
    kind: "feeding",
    itemId: child.id,
    language,
    title: child.name,
    subtitle: getKindLabel("feeding", language),
    statusLabel: buildFeedingStatusLabel(startedAt, language),
    primaryValue: language === "ru" ? "Идёт" : "Active",
    primaryCaption: language === "ru" ? "Статус" : "Status",
    secondaryValue: formatTimeLabel(startedAt, language),
    secondaryCaption: language === "ru" ? "Началось" : "Started",
    startedAt,
    deepLink: buildNativeAppUrl(`/children?liveChild=${child.id}&liveAction=feeding`),
  });
}

export async function syncIllnessLiveActivity(
  child: Pick<Child, "id" | "name">,
  episode: Pick<
    IllnessEpisode,
    "id" | "startedAt" | "status" | "title" | "memberAccountIds"
  > | null,
  insights: Pick<
    IllnessEpisodeInsights,
    "lastTemperatureCelsius" | "lastAdministrationAt" | "medicineNames" | "lastEventAt"
  > | null = null,
  medicationPlans: Array<
    Pick<
      EpisodeMedicationPlan,
      "minIntervalMinutes" | "customMedicineName" | "householdMedicineId"
    > & {
      householdMedicineName?: string | null;
    }
  > = [],
  latestAdministrationMedicineName: string | null = null,
  language: "ru" | "en",
  preferences?: LiveActivityPreferencesCache,
  currentAccountId?: string | null
) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  if (
    !episode ||
    episode.status !== "active" ||
    !isEnabled("illness", preferences) ||
    !canSeeIllnessLiveActivity(episode, currentAccountId)
  ) {
    await safeStopLiveActivity({ kind: "illness", itemId: child.id });
    return;
  }

  const startedAt = normalizeLiveActivityStartedAt(episode.startedAt);
  if (!startedAt) {
    await safeStopLiveActivity({ kind: "illness", itemId: child.id });
    return;
  }

  const nextDose =
    medicationPlans.length === 1 ? buildSinglePlanNextDose(medicationPlans[0], insights) : null;
  const summary = buildIllnessLiveActivitySummary(insights, nextDose, episode.startedAt, language);
  const medicationLines = buildIllnessMedicationLines(
    insights,
    nextDose,
    latestAdministrationMedicineName,
    language
  );
  const durationMeta = getIllnessDurationMeta(episode.startedAt, language);
  const fallbackStatusLabel =
    language === "ru" ? `Болеет ${durationMeta.value}` : `Sick ${durationMeta.value}`;
  const statusLabel =
    medicationLines.primaryLine ?? medicationLines.secondaryLine ?? fallbackStatusLabel ?? null;
  const subtitle =
    medicationLines.primaryLine && medicationLines.secondaryLine
      ? medicationLines.secondaryLine
      : null;

  await safeUpsertLiveActivity({
    kind: "illness",
    itemId: child.id,
    language,
    title: child.name,
    subtitle,
    statusLabel,
    primaryValue: summary.primaryValue,
    primaryCaption: summary.primaryCaption,
    secondaryValue: summary.secondaryValue,
    secondaryCaption: summary.secondaryCaption,
    startedAt,
    deepLink: buildNativeAppUrl(`/children/${child.id}/illness`),
  });
}

export async function syncLiveActivitiesSnapshot(args: {
  children: Child[];
  activeIllnessByChildId: Record<string, IllnessEpisode | null>;
  activeIllnessInsightsByChildId?: Record<string, IllnessEpisodeInsights | null>;
  activeIllnessMedicationPlansByChildId?: Record<string, EpisodeMedicationPlan[] | null>;
  activeIllnessLatestAdministrationMedicineNameByChildId?: Record<string, string | null>;
  activeSleepByChildId: Record<string, SleepSession | null>;
  activeFeedingByChildId: Record<string, FeedingRecord | null>;
  language?: "ru" | "en";
  preferences?: LiveActivityPreferencesCache;
  currentAccountId?: string | null;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const preferences = args.preferences ?? resolveLiveActivityPreferences();
  const language = args.language ?? detectPreferredLanguage();

  await Promise.all(
    args.children.flatMap((child) => {
      const tasks: Promise<void>[] = [
        syncIllnessLiveActivity(
          child,
          args.activeIllnessByChildId[child.id] ?? null,
          args.activeIllnessInsightsByChildId?.[child.id] ?? null,
          args.activeIllnessMedicationPlansByChildId?.[child.id] ?? [],
          args.activeIllnessLatestAdministrationMedicineNameByChildId?.[child.id] ?? null,
          language,
          preferences,
          args.currentAccountId
        ),
      ];

      if (child.babyModeEnabled) {
        tasks.push(
          syncSleepLiveActivity(
            child,
            args.activeSleepByChildId[child.id] ?? null,
            language,
            preferences,
            args.currentAccountId
          ),
          syncFeedingLiveActivity(
            child,
            args.activeFeedingByChildId[child.id] ?? null,
            language,
            preferences,
            args.currentAccountId
          )
        );
      }

      return tasks;
    })
  );
}

export async function stopLiveActivitiesForChildIds(childIds: string[]) {
  if (!isNativeLiveActivitiesSupported() || childIds.length === 0) {
    return;
  }

  await Promise.all(
    childIds.flatMap((childId) => [
      safeStopLiveActivity({ kind: "illness", itemId: childId }),
      safeStopLiveActivity({ kind: "sleep", itemId: childId }),
      safeStopLiveActivity({ kind: "feeding", itemId: childId }),
    ])
  );
}

export async function stopDisabledLiveActivities(preferences = resolveLiveActivityPreferences()) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const tasks: Promise<void>[] = [];
  if (!preferences.sleepEnabled) {
    tasks.push(
      stopAllNativeLiveActivities("sleep").catch((error) => {
        appLog.warn("Live activity stopAll failed for sleep", error);
      })
    );
  }
  if (!preferences.feedingEnabled) {
    tasks.push(
      stopAllNativeLiveActivities("feeding").catch((error) => {
        appLog.warn("Live activity stopAll failed for feeding", error);
      })
    );
  }
  if (!preferences.illnessEnabled) {
    tasks.push(
      stopAllNativeLiveActivities("illness").catch((error) => {
        appLog.warn("Live activity stopAll failed for illness", error);
      })
    );
  }
  await Promise.all(tasks);
}

export async function stopAllLiveActivities() {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  try {
    await stopAllNativeLiveActivities();
  } catch (error) {
    appLog.warn("Live activity stopAll failed during global cleanup", error);
  }
}
