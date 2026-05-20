import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import type { MobileChildSummary } from "../features/children/api/childrenApi";
import {
  startMobileFeedingRecord,
  stopMobileFeedingRecord,
  type MobileFeedingRecord,
} from "../features/feeding/api/feedingRecordsApi";
import { syncCareLiveActivity } from "../features/live-activities/liveActivities";
import type { MobileLiveActivityPreferences } from "../features/live-activities/liveActivityPreferences";
import {
  startMobileSleepSession,
  stopMobileSleepSession,
  type MobileSleepSession,
} from "../features/sleep/api/sleepSessionsApi";
import type { MobileLocale } from "../shared/i18n/mobileI18n";

type UseCareSessionControllerParams = {
  authSession: MobileAuthSession | null;
  children: MobileChildSummary[];
  locale: MobileLocale;
  liveActivityPreferences: MobileLiveActivityPreferences;
  selectedChildId: string;
  activeSleepSessionsByCardId: Record<string, MobileSleepSession | null>;
  activeFeedingRecordsByCardId: Record<string, MobileFeedingRecord | null>;
  setActiveSleepSessionsByCardId: Dispatch<
    SetStateAction<Record<string, MobileSleepSession | null>>
  >;
  setActiveFeedingRecordsByCardId: Dispatch<
    SetStateAction<Record<string, MobileFeedingRecord | null>>
  >;
};

export function useCareSessionController(
  params: UseCareSessionControllerParams,
) {
  const syncSleep = useCallback(
    async (
      child: MobileChildSummary,
      session: MobileSleepSession | null,
      currentAccountId: string,
    ) => {
      await syncCareLiveActivity({
        kind: "sleep",
        child,
        session,
        locale: params.locale,
        preferences: params.liveActivityPreferences,
        currentAccountId,
      });
    },
    [params.liveActivityPreferences, params.locale],
  );

  const syncFeeding = useCallback(
    async (
      child: MobileChildSummary,
      feeding: MobileFeedingRecord | null,
      currentAccountId: string,
    ) => {
      await syncCareLiveActivity({
        kind: "feeding",
        child,
        feeding,
        locale: params.locale,
        preferences: params.liveActivityPreferences,
        currentAccountId,
      });
    },
    [params.liveActivityPreferences, params.locale],
  );

  const handleSleepPress = useCallback(
    async (cardId: string) => {
      const authSession = params.authSession;
      if (!authSession) {
        return;
      }

      const child = params.children.find((item) => item.id === cardId);
      if (!child) {
        return;
      }

      const activeSession = params.activeSleepSessionsByCardId[cardId];

      if (activeSession?.status === "active") {
        const stoppedSession = await stopMobileSleepSession(authSession, {
          sessionId: activeSession.id,
        });
        const nextSession =
          stoppedSession.status === "active" ? stoppedSession : null;
        params.setActiveSleepSessionsByCardId((current) => ({
          ...current,
          [cardId]: nextSession,
        }));
        await syncSleep(child, nextSession, authSession.account.id);
        return;
      }

      const startedSession = await startMobileSleepSession(authSession, {
        childId: cardId,
      });
      params.setActiveSleepSessionsByCardId((current) => ({
        ...current,
        [cardId]: startedSession,
      }));
      await syncSleep(child, startedSession, authSession.account.id);
    },
    [
      params,
      syncSleep,
    ],
  );

  const handleFeedingPress = useCallback(
    async (cardId: string) => {
      const authSession = params.authSession;
      if (!authSession) {
        return;
      }

      const child = params.children.find((item) => item.id === cardId);
      if (!child) {
        return;
      }

      const activeRecord = params.activeFeedingRecordsByCardId[cardId];

      if (activeRecord?.status === "active") {
        const stoppedRecord = await stopMobileFeedingRecord(authSession, {
          recordId: activeRecord.id,
        });
        const nextRecord =
          stoppedRecord.status === "active" ? stoppedRecord : null;
        params.setActiveFeedingRecordsByCardId((current) => ({
          ...current,
          [cardId]: nextRecord,
        }));
        await syncFeeding(child, nextRecord, authSession.account.id);
        return;
      }

      const startedRecord = await startMobileFeedingRecord(authSession, {
        childId: cardId,
        feedingType: "breast",
        breastSide: "left",
        isExpressed: false,
      });
      params.setActiveFeedingRecordsByCardId((current) => ({
        ...current,
        [cardId]: startedRecord,
      }));
      await syncFeeding(child, startedRecord, authSession.account.id);
    },
    [
      params,
      syncFeeding,
    ],
  );

  const handleStartFeedingTimer = useCallback(async () => {
    const authSession = params.authSession;
    const selectedChildId = params.selectedChildId;
    if (!authSession || !selectedChildId) {
      return;
    }

    const child = params.children.find((item) => item.id === selectedChildId);
    if (!child) {
      return;
    }

    const activeRecord = params.activeFeedingRecordsByCardId[selectedChildId];

    if (activeRecord?.status === "active") {
      return;
    }

    const startedRecord = await startMobileFeedingRecord(authSession, {
      childId: selectedChildId,
      feedingType: "breast",
      breastSide: "left",
      isExpressed: false,
    });
    params.setActiveFeedingRecordsByCardId((current) => ({
      ...current,
      [selectedChildId]: startedRecord,
    }));
    await syncFeeding(child, startedRecord, authSession.account.id);
  }, [params, syncFeeding]);

  return {
    handleFeedingPress,
    handleSleepPress,
    handleStartFeedingTimer,
  };
}
