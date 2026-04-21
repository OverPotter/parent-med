import type { Child, FeedingRecord, SleepSession } from "@shared/types/api";
import {
  getLiveActivityPreferencesCache,
  type LiveActivityPreferencesCache,
} from "./liveActivityPreferences";
import {
  isNativeLiveActivitiesSupported,
  stopAllNativeLiveActivities,
  stopNativeLiveActivity,
  upsertNativeLiveActivity,
} from "./nativeLiveActivities";

function getKindLabel(kind: "sleep" | "feeding", language: "ru" | "en") {
  if (kind === "sleep") {
    return language === "ru" ? "Идёт сон" : "Sleep in progress";
  }
  return language === "ru" ? "Идёт кормление" : "Feeding in progress";
}

function isEnabled(kind: "sleep" | "feeding", preferences = getLiveActivityPreferencesCache()) {
  return kind === "sleep" ? preferences.sleepEnabled : preferences.feedingEnabled;
}

export async function syncSleepLiveActivity(
  child: Pick<Child, "id" | "name">,
  session: Pick<SleepSession, "id" | "startedAt" | "endedAt"> | null,
  language: "ru" | "en" = "ru",
  preferences?: LiveActivityPreferencesCache
) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  if (!session || session.endedAt || !isEnabled("sleep", preferences)) {
    await stopNativeLiveActivity({ kind: "sleep", itemId: child.id });
    return;
  }

  await upsertNativeLiveActivity({
    kind: "sleep",
    itemId: child.id,
    title: child.name,
    subtitle: getKindLabel("sleep", language),
    startedAt: session.startedAt,
    deepLink: `/children?liveChild=${child.id}&liveAction=sleep`,
  });
}

export async function syncFeedingLiveActivity(
  child: Pick<Child, "id" | "name">,
  feeding: Pick<FeedingRecord, "id" | "recordedAt" | "startedAt" | "endedAt"> | null,
  language: "ru" | "en" = "ru",
  preferences?: LiveActivityPreferencesCache
) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  if (!feeding || feeding.endedAt || !isEnabled("feeding", preferences)) {
    await stopNativeLiveActivity({ kind: "feeding", itemId: child.id });
    return;
  }

  await upsertNativeLiveActivity({
    kind: "feeding",
    itemId: child.id,
    title: child.name,
    subtitle: getKindLabel("feeding", language),
    startedAt: feeding.startedAt ?? feeding.recordedAt,
    deepLink: `/children?liveChild=${child.id}&liveAction=feeding`,
  });
}

export async function syncLiveActivitiesSnapshot(args: {
  children: Child[];
  activeSleepByChildId: Record<string, SleepSession | null>;
  activeFeedingByChildId: Record<string, FeedingRecord | null>;
  language?: "ru" | "en";
  preferences?: LiveActivityPreferencesCache;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const preferences = args.preferences ?? getLiveActivityPreferencesCache();
  const language = args.language ?? "ru";

  await Promise.all(
    args.children
      .filter((child) => child.babyModeEnabled)
      .flatMap((child) => [
        syncSleepLiveActivity(child, args.activeSleepByChildId[child.id] ?? null, language, preferences),
        syncFeedingLiveActivity(
          child,
          args.activeFeedingByChildId[child.id] ?? null,
          language,
          preferences
        ),
      ])
  );
}

export async function stopDisabledLiveActivities(preferences = getLiveActivityPreferencesCache()) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const tasks: Promise<void>[] = [];
  if (!preferences.sleepEnabled) {
    tasks.push(stopAllNativeLiveActivities("sleep"));
  }
  if (!preferences.feedingEnabled) {
    tasks.push(stopAllNativeLiveActivities("feeding"));
  }
  await Promise.all(tasks);
}
