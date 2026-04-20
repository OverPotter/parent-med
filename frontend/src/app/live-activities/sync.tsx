import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppStore } from "@shared/store/useAppStore";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchActiveSleepSessionByChildId } from "@shared/api/sleepSessions";
import { fetchActiveFeedingRecordByChildId } from "@shared/api/feedingRecords";
import {
  LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT,
  getLiveActivityPreferencesCache,
} from "@shared/utils/liveActivityPreferences";
import { updateLiveActivityDiagnostics } from "@shared/utils/liveActivityDiagnostics";
import { stopDisabledLiveActivities, syncLiveActivitiesSnapshot } from "@shared/utils/liveActivities";
import { useGlobalBootReady } from "@/app/boot/state";
import { appLog } from "@shared/utils/appLog";

export function LiveActivityRuntimeSync() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const isBootReady = useGlobalBootReady();

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
      const preferences = getLiveActivityPreferencesCache();
      appLog.dev("LiveActivities sync:start", {
        currentFamilyId,
        language,
        preferences,
      });
      updateLiveActivityDiagnostics({
        lastSync: `start family=${currentFamilyId}`,
        lastError: null,
      });
      await stopDisabledLiveActivities(preferences);

      const children = await fetchChildrenByFamilyId(currentFamilyId);
      const babyChildren = children.filter((child) => child.babyModeEnabled);
      appLog.dev("LiveActivities sync:children", {
        total: children.length,
        babyChildren: babyChildren.map((child) => ({
          id: child.id,
          name: child.name,
        })),
      });
      const sleepEntries = await Promise.all(
        babyChildren.map(async (child) => [child.id, await fetchActiveSleepSessionByChildId(child.id)] as const)
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
        activeSleepByChildId: Object.fromEntries(sleepEntries),
        activeFeedingByChildId: Object.fromEntries(feedingEntries),
        language: language === "en" ? "en" : "ru",
        preferences,
      });
      updateLiveActivityDiagnostics({
        lastSync: `done children=${babyChildren.length} sleep=${sleepEntries.filter(([, value]) => value).length} feeding=${feedingEntries.filter(([, value]) => value).length}`,
      });
      appLog.dev("LiveActivities sync:done");
    };

    const syncSafely = () => {
      void sync().catch((error) => {
        appLog.warn("LiveActivities sync failed", error);
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
      window.removeEventListener("focus", syncSafely);
      window.removeEventListener("pageshow", syncSafely);
      window.removeEventListener(LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT, syncSafely);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authToken, currentFamilyId, isBootReady, language]);

  return null;
}
