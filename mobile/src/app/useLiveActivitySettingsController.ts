import { useCallback, useEffect, useState } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import type { MobileIllnessObservation } from "../features/illness/model/illnessObservation";
import {
  defaultMobileLiveActivityPreferences,
  toMobileLiveActivityPreferences,
  type MobileLiveActivityPreferences,
} from "../features/live-activities/liveActivityPreferences";
import {
  ensureIllnessLiveActivityPreferencesHydrated,
  isIllnessLiveActivityEnabled,
  setIllnessLiveActivityEnabled,
  subscribeIllnessLiveActivityPreferences,
} from "../features/live-activities/illnessLiveActivityPreference";
import {
  stopAllNativeLiveActivities,
  stopNativeLiveActivity,
} from "../features/live-activities/nativeLiveActivities";
import type {
  MobileFamilyAccessSummary,
  MobilePushPreferences,
} from "../features/settings/api/settingsApi";

export function useLiveActivitySettingsController(params: {
  authSession: MobileAuthSession | null;
  setCanUseLiveActivities: (value: boolean) => void;
  setFamilyRoutinesCount: (value: number) => void;
  setLiveActivityPreferences: (
    value:
      | MobileLiveActivityPreferences
      | ((current: MobileLiveActivityPreferences) => MobileLiveActivityPreferences),
  ) => void;
}) {
  const [illnessLiveActivityPreferenceVersion, setIllnessLiveActivityPreferenceVersion] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    void ensureIllnessLiveActivityPreferencesHydrated().then(() => {
      if (!cancelled) {
        setIllnessLiveActivityPreferenceVersion((current) => current + 1);
      }
    });

    const unsubscribe = subscribeIllnessLiveActivityPreferences(() => {
      setIllnessLiveActivityPreferenceVersion((current) => current + 1);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handlePushPreferencesChanged = useCallback(
    (preferences: MobilePushPreferences) => {
      const nextPreferences = toMobileLiveActivityPreferences(preferences);

      params.setLiveActivityPreferences((current) => {
        if (current.sleepEnabled && !nextPreferences.sleepEnabled) {
          void stopAllNativeLiveActivities("sleep");
        }
        if (current.feedingEnabled && !nextPreferences.feedingEnabled) {
          void stopAllNativeLiveActivities("feeding");
        }
        if (current.illnessEnabled && !nextPreferences.illnessEnabled) {
          void stopAllNativeLiveActivities("illness");
        }

        return nextPreferences;
      });
    },
    [params],
  );

  const handleFamilyAccessChanged = useCallback(
    (familyAccess: MobileFamilyAccessSummary) => {
      params.setCanUseLiveActivities(familyAccess.canUseLiveActivities);
      params.setFamilyRoutinesCount(familyAccess.currentPillboxPlanCount);
    },
    [params],
  );

  const handleToggleIllnessLiveActivity = useCallback(
    async (observation: MobileIllnessObservation) => {
      const accountId = params.authSession?.account.id;
      if (!accountId) {
        return;
      }

      const nextEnabled = !isIllnessLiveActivityEnabled(observation, accountId);
      await setIllnessLiveActivityEnabled({
        episodeId: observation.episodeId,
        accountId,
        enabled: nextEnabled,
      });

      if (!nextEnabled) {
        void stopNativeLiveActivity({
          kind: "illness",
          itemId: observation.childId,
        });
      }
    },
    [params.authSession?.account.id],
  );

  const handleIsIllnessLiveActivityEnabled = useCallback(
    (observation: MobileIllnessObservation) =>
      isIllnessLiveActivityEnabled(observation, params.authSession?.account.id),
    [illnessLiveActivityPreferenceVersion, params.authSession?.account.id],
  );

  const resetLiveActivitySettings = useCallback(() => {
    params.setCanUseLiveActivities(false);
    params.setLiveActivityPreferences(defaultMobileLiveActivityPreferences);
  }, [params]);

  return {
    handleFamilyAccessChanged,
    handleIsIllnessLiveActivityEnabled,
    handlePushPreferencesChanged,
    handleToggleIllnessLiveActivity,
    illnessLiveActivityPreferenceVersion,
    resetLiveActivitySettings,
  };
}
