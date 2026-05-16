import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import type { MobileAuthSession } from "../auth/api/authApi";
import type { MobileChildSummary } from "../children/api/childrenApi";
import type { MobileFeedingRecord } from "../feeding/api/feedingRecordsApi";
import type { MobileIllnessObservation } from "../illness/model/illnessObservation";
import type { MobileSleepSession } from "../sleep/api/sleepSessionsApi";
import type { MobileLocale } from "../../shared/i18n/mobileI18n";
import type { MobileLiveActivityPreferences } from "./liveActivityPreferences";
import { stopAllNativeLiveActivities } from "./nativeLiveActivities";
import {
  stopDisabledLiveActivities,
  syncMobileLiveActivitiesSnapshot,
} from "./liveActivities";

export function useLiveActivitiesSync(params: {
  authSession: MobileAuthSession | null;
  locale: MobileLocale;
  children: MobileChildSummary[];
  activeSleepByChildId: Record<string, MobileSleepSession | null>;
  activeFeedingByChildId: Record<string, MobileFeedingRecord | null>;
  activeIllnessByChildId: Record<string, MobileIllnessObservation | undefined>;
  preferences: MobileLiveActivityPreferences;
  canUseLiveActivities: boolean;
  illnessPreferenceVersion: number;
}) {
  const inFlightRef = useRef(false);
  const rerunRef = useRef(false);

  useEffect(() => {
    const authSession = params.authSession;

    if (!authSession) {
      void stopAllNativeLiveActivities();
      return;
    }

    let cancelled = false;

    const runSync = async () => {
      if (inFlightRef.current) {
        rerunRef.current = true;
        return;
      }

      inFlightRef.current = true;

      try {
        if (!params.canUseLiveActivities) {
          await stopAllNativeLiveActivities();
          return;
        }

        await stopDisabledLiveActivities(params.preferences);

        await syncMobileLiveActivitiesSnapshot({
          children: params.children,
          activeSleepByChildId: params.activeSleepByChildId,
          activeFeedingByChildId: params.activeFeedingByChildId,
          activeIllnessByChildId: params.activeIllnessByChildId,
          locale: params.locale,
          preferences: params.preferences,
          currentAccountId: authSession.account.id,
        });
      } finally {
        inFlightRef.current = false;

        if (!cancelled && rerunRef.current) {
          rerunRef.current = false;
          void runSync();
        }
      }
    };

    void runSync();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runSync();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [
    params.activeFeedingByChildId,
    params.activeIllnessByChildId,
    params.activeSleepByChildId,
    params.authSession,
    params.canUseLiveActivities,
    params.children,
    params.illnessPreferenceVersion,
    params.locale,
    params.preferences,
  ]);
}
