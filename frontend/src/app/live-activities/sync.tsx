import { useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useQuery } from "@tanstack/react-query";
import { fetchMyFamilyAccess } from "@shared/api/families";
import { fetchPushNotificationPreferences } from "@shared/api/pushNotifications";
import { familyAccessQueryOptions } from "@shared/hooks/useFamilyAccessQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import {
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodeInsights,
} from "@shared/api/illnessEpisodes";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchAdministrationEventsByEpisodeId } from "@shared/api/administrationEvents";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
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
  const previousLanguageRef = useRef<"ru" | "en" | null>(null);
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
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: isBootReady && !!authToken && !!currentFamilyId && isNativeIos,
    ...familyAccessQueryOptions,
  });

  useEffect(() => {
    if (!isBootReady || !authToken || !currentFamilyId || !accountId || !isNativeIos || !familyAccess) {
      return;
    }

    let isCancelled = false;
    const normalizedLanguage = language === "en" ? "en" : "ru";
    const shouldResetActivitiesForLanguage =
      previousLanguageRef.current !== null && previousLanguageRef.current !== normalizedLanguage;
    previousLanguageRef.current = normalizedLanguage;

    const sync = async () => {
      // Use the local mirror as the immediate source of truth so a just-disabled
      // live activity is not recreated from stale query data before the server
      // preferences round-trip finishes.
      const preferences = resolveLiveActivityPreferences();
      const effectivePreferences =
        familyAccess?.canUseLiveActivities === false
          ? {
              sleepEnabled: false,
              feedingEnabled: false,
              illnessEnabled: false,
            }
          : preferences;
      updateLiveActivityDiagnostics({
        lastSync: `start family=${currentFamilyId}`,
        lastError: null,
      });
      if (isNativeIos && shouldResetActivitiesForLanguage) {
        await stopDisabledLiveActivities({
          sleepEnabled: false,
          feedingEnabled: false,
          illnessEnabled: false,
        });
      }
      await stopDisabledLiveActivities(effectivePreferences);
      if (familyAccess?.canUseLiveActivities === false) {
        previousChildIdsRef.current = [];
        updateLiveActivityDiagnostics({
          lastSync: `stopped family=${currentFamilyId} no_live_access`,
          lastError: null,
        });
        return;
      }

      const children = await fetchChildrenByFamilyId(currentFamilyId);
      const householdMedicines = await fetchHouseholdMedicines();
      const householdMedicineNameById = new Map(
        householdMedicines.map((medicine) => [medicine.id, medicine.medicineName])
      );
      const nextChildIds = children.map((child) => child.id);
      const removedChildIds = previousChildIdsRef.current.filter(
        (childId) => !nextChildIds.includes(childId)
      );

      if (removedChildIds.length > 0) {
        await stopLiveActivitiesForChildIds(removedChildIds);
      }

      const babyChildren = children.filter((child) => child.babyModeEnabled);
      const [illnessSnapshots, sleepEntries, feedingEntries] = await Promise.all([
        Promise.all(
          children.map(async (child) => {
            const episode = await fetchActiveIllnessEpisodeByChildId(child.id);
            const [insights, plans, administrations] = episode
              ? await Promise.all([
                  fetchIllnessEpisodeInsights(episode.id),
                  fetchEpisodeMedicationPlansByEpisodeId(episode.id),
                  fetchAdministrationEventsByEpisodeId(episode.id),
                ])
              : [null, [], []];

            const latestAdministration = administrations
              .slice()
              .sort(
                (left, right) =>
                  new Date(right.administeredAt).getTime() - new Date(left.administeredAt).getTime()
              )[0];
            const latestAdministrationMedicineName =
              latestAdministration?.customMedicineName?.trim() ||
              (latestAdministration?.householdMedicineId
                ? householdMedicineNameById.get(latestAdministration.householdMedicineId)?.trim() ||
                  null
                : null);
            const enrichedPlans = plans.map((plan) => ({
              ...plan,
              householdMedicineName: plan.householdMedicineId
                ? (householdMedicineNameById.get(plan.householdMedicineId) ?? null)
                : null,
            }));

            return [
              child.id,
              {
                episode,
                insights,
                plans: enrichedPlans,
                latestAdministrationMedicineName,
              },
            ] as const;
          })
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
        activeIllnessByChildId: Object.fromEntries(
          illnessSnapshots.map(([childId, snapshot]) => [childId, snapshot.episode])
        ),
        activeIllnessInsightsByChildId: Object.fromEntries(
          illnessSnapshots.map(([childId, snapshot]) => [childId, snapshot.insights])
        ),
        activeIllnessMedicationPlansByChildId: Object.fromEntries(
          illnessSnapshots.map(([childId, snapshot]) => [childId, snapshot.plans])
        ),
        activeIllnessLatestAdministrationMedicineNameByChildId: Object.fromEntries(
          illnessSnapshots.map(([childId, snapshot]) => [
            childId,
            snapshot.latestAdministrationMedicineName,
          ])
        ),
        activeSleepByChildId: Object.fromEntries(sleepEntries),
        activeFeedingByChildId: Object.fromEntries(feedingEntries),
        language: normalizedLanguage,
        preferences: effectivePreferences,
        currentAccountId: accountId,
      });
      previousChildIdsRef.current = nextChildIds;
      updateLiveActivityDiagnostics({
        lastSync: `done illness=${illnessSnapshots.filter(([, value]) => value.episode).length} children=${babyChildren.length} sleep=${sleepEntries.filter(([, value]) => value).length} feeding=${feedingEntries.filter(([, value]) => value).length}`,
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
      void sync()
        .catch((error) => {
          updateLiveActivityDiagnostics({
            lastSync: "error",
            lastError: String(error),
          });
        })
        .finally(() => {
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
  }, [
    accountId,
    authToken,
    currentFamilyId,
    familyAccess,
    isBootReady,
    isNativeIos,
    language,
    pushPreferences,
  ]);

  return null;
}
