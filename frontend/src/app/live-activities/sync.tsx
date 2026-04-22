import { useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
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
import { LIVE_ACTIVITY_REFRESH_EVENT } from "@shared/utils/liveActivityRuntimeEvents";
import {
  stopLiveActivitiesForChildIds,
  stopDisabledLiveActivities,
  syncLiveActivitiesSnapshot,
} from "@shared/utils/liveActivities";
import { useGlobalBootReady } from "@/app/boot/state";

export function LiveActivityRuntimeSync() {
  const SYNC_THROTTLE_MS = 60_000;
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountId = useAppStore((s) => s.accountId);
  const language = useAppStore((s) => s.language);
  const authToken = useAppStore((s) => s.authToken);
  const isBootReady = useGlobalBootReady();
  const previousChildIdsRef = useRef<string[]>([]);
  const lastSyncAtRef = useRef(0);
  const isSyncInFlightRef = useRef(false);
  const pendingForceSyncRef = useRef(false);
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
      !isNativeIos
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

      const babyChildren = children.filter((child) => child.babyModeEnabled);
      const [illnessEntries, sleepEntries, feedingEntries] = await Promise.all([
        Promise.all(
          children.map(
            async (child) => [child.id, await fetchActiveIllnessEpisodeByChildId(child.id)] as const
          )
        ),
        Promise.all(
          babyChildren.map(
            async (child) => [child.id, await fetchActiveSleepSessionByChildId(child.id)] as const
          )
        ),
        Promise.all(
          babyChildren.map(
            async (child) => [child.id, await fetchActiveFeedingRecordByChildId(child.id)] as const
          )
        ),
      ]);

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

    const syncSafely = (force = false) => {
      const now = Date.now();
      if (isSyncInFlightRef.current) {
        pendingForceSyncRef.current = pendingForceSyncRef.current || force;
        return;
      }
      if (!force && now - lastSyncAtRef.current < SYNC_THROTTLE_MS) {
        return;
      }
      isSyncInFlightRef.current = true;
      lastSyncAtRef.current = now;
      void sync().catch((error) => {
        updateLiveActivityDiagnostics({
          lastSync: "error",
          lastError: String(error),
        });
      }).finally(() => {
        isSyncInFlightRef.current = false;
        if (pendingForceSyncRef.current) {
          pendingForceSyncRef.current = false;
          syncSafely(true);
        }
      });
    };

    syncSafely(true);

    const handleFocus = () => syncSafely();
    const handlePageShow = () => syncSafely();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSafely(true);
      }
    };
    let removeAppStateListener: (() => void) | undefined;

    const handlePreferencesChanged = () => syncSafely(true);
    const handleRefreshRequested = () => syncSafely(true);

    if (!isNativeIos) {
      window.addEventListener("focus", handleFocus);
      window.addEventListener("pageshow", handlePageShow);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    window.addEventListener(LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT, handlePreferencesChanged);
    window.addEventListener(LIVE_ACTIVITY_REFRESH_EVENT, handleRefreshRequested);

    if (isNativeIos) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          syncSafely(true);
        }
      }).then((listener) => {
        removeAppStateListener = () => {
          void listener.remove();
        };
      });
    }

    return () => {
      isCancelled = true;
      previousChildIdsRef.current = [];
      pendingForceSyncRef.current = false;
      if (!isNativeIos) {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("pageshow", handlePageShow);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      window.removeEventListener(LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT, handlePreferencesChanged);
      window.removeEventListener(LIVE_ACTIVITY_REFRESH_EVENT, handleRefreshRequested);
      removeAppStateListener?.();
    };
  }, [accountId, authToken, currentFamilyId, isBootReady, isNativeIos, language, pushPreferences]);

  return null;
}
