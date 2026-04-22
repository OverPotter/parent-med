import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useQuery } from "@tanstack/react-query";
import { fetchPushNotificationPreferences } from "@shared/api/pushNotifications";
import { useAppStore } from "@shared/store/useAppStore";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchActiveSleepSessionByChildId } from "@shared/api/sleepSessions";
import { fetchActiveFeedingRecordByChildId } from "@shared/api/feedingRecords";
import {
  LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT,
  resolveLiveActivityPreferences,
} from "@shared/utils/liveActivityPreferences";
import { updateLiveActivityDiagnostics } from "@shared/utils/liveActivityDiagnostics";
import {
  stopLiveActivitiesForChildIds,
  stopDisabledLiveActivities,
  syncLiveActivitiesSnapshot,
} from "@shared/utils/liveActivities";
import { useGlobalBootReady } from "@/app/boot/state";

export function LiveActivityRuntimeSync() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountId = useAppStore((s) => s.accountId);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const isBootReady = useGlobalBootReady();
  const previousChildIdsRef = useRef<string[]>([]);
  const { data: pushPreferences } = useQuery({
    queryKey: ["push", "preferences", "account"],
    queryFn: fetchPushNotificationPreferences,
    enabled:
      isBootReady &&
      !!authToken &&
      !!currentFamilyId &&
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === "ios",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      !isBootReady ||
      !authToken ||
      !currentFamilyId ||
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "ios"
    ) {
      return;
    }

    let isCancelled = false;

    const sync = async () => {
      const preferences = resolveLiveActivityPreferences(pushPreferences);
      updateLiveActivityDiagnostics({
        lastSync: `start family=${currentFamilyId}`,
        lastError: null,
      });
      await stopDisabledLiveActivities(preferences);

      const children = await fetchChildrenByFamilyId(currentFamilyId);
      const nextChildIds = children.map((child) => child.id);
      const removedChildIds = previousChildIdsRef.current.filter(
        (childId) => !nextChildIds.includes(childId)
      );

      if (removedChildIds.length > 0) {
        await stopLiveActivitiesForChildIds(removedChildIds);
      }

      const illnessEntries = await Promise.all(
        children.map(
          async (child) => [child.id, await fetchActiveIllnessEpisodeByChildId(child.id)] as const
        )
      );
      const babyChildren = children.filter((child) => child.babyModeEnabled);
      const sleepEntries = await Promise.all(
        babyChildren.map(
          async (child) => [child.id, await fetchActiveSleepSessionByChildId(child.id)] as const
        )
      );
      const feedingEntries = await Promise.all(
        babyChildren.map(
          async (child) => [child.id, await fetchActiveFeedingRecordByChildId(child.id)] as const
        )
      );

      if (isCancelled) {
        return;
      }

      await syncLiveActivitiesSnapshot({
        children,
        activeIllnessByChildId: Object.fromEntries(illnessEntries),
        activeSleepByChildId: Object.fromEntries(sleepEntries),
        activeFeedingByChildId: Object.fromEntries(feedingEntries),
        language: language === "en" ? "en" : "ru",
        preferences,
        currentAccountId: accountId,
      });
      previousChildIdsRef.current = nextChildIds;
      updateLiveActivityDiagnostics({
        lastSync: `done illness=${illnessEntries.filter(([, value]) => value).length} children=${babyChildren.length} sleep=${sleepEntries.filter(([, value]) => value).length} feeding=${feedingEntries.filter(([, value]) => value).length}`,
      });
    };

    const syncSafely = () => {
      void sync().catch((error) => {
        updateLiveActivityDiagnostics({
          lastSync: "error",
          lastError: String(error),
        });
      });
    };

    syncSafely();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSafely();
      }
    };

    window.addEventListener("focus", syncSafely);
    window.addEventListener("pageshow", syncSafely);
    window.addEventListener(LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT, syncSafely);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      previousChildIdsRef.current = [];
      window.removeEventListener("focus", syncSafely);
      window.removeEventListener("pageshow", syncSafely);
      window.removeEventListener(LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT, syncSafely);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accountId, authToken, currentFamilyId, isBootReady, language, pushPreferences]);

  return null;
}
