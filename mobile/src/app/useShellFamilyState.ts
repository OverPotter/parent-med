import { useCallback, useEffect, useState } from "react";
import { prefetchAnalyticsScreenData } from "../features/analytics/screens/useAnalyticsScreenState";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import {
  fetchMobileChildrenSummary,
  type MobileChildSummary,
} from "../features/children/api/childrenApi";
import {
  fetchActiveMobileFeedingRecord,
  type MobileFeedingRecord,
} from "../features/feeding/api/feedingRecordsApi";
import {
  fetchMobileFamilyMembers,
  type MobileFamilyMember,
} from "../features/family/api/familyMembersApi";
import {
  fetchMobileActiveIllnessEpisode,
} from "../features/illness/api/illnessAnalyticsApi";
import type { MobileIllnessObservation } from "../features/illness/model/illnessObservation";
import { hydrateObservationFromEpisode } from "../features/illness/model/illnessObservationState";
import {
  defaultMobileLiveActivityPreferences,
  toMobileLiveActivityPreferences,
} from "../features/live-activities/liveActivityPreferences";
import type { MobilePushPreferences } from "../features/settings/api/settingsApi";
import {
  getCachedSettingsBundle,
  loadSettingsBundle,
} from "../features/settings/model/settingsScreenLogic";
import {
  fetchActiveMobileSleepSession,
  type MobileSleepSession,
} from "../features/sleep/api/sleepSessionsApi";
import type { MobileLocale } from "../shared/i18n/mobileI18n";

type FamilySettingsBundle = {
  familySummary: { premiumActive: boolean };
  familyAccess: {
    canUseLiveActivities: boolean;
    currentPillboxPlanCount: number;
  };
  pushPreferences: MobilePushPreferences | null;
};

export function useShellFamilyState(params: {
  authSession: MobileAuthSession | null;
  locale: MobileLocale;
}) {
  const [isShellBootstrapping, setIsShellBootstrapping] = useState(false);
  const [children, setChildren] = useState<MobileChildSummary[]>([]);
  const [familyMembers, setFamilyMembers] = useState<MobileFamilyMember[]>([]);
  const [latestChildMetricsByCardId, setLatestChildMetricsByCardId] = useState<
    Record<string, { weightKg?: number | null; heightCm?: number | null }>
  >({});
  const [activeSleepSessionsByCardId, setActiveSleepSessionsByCardId] =
    useState<Record<string, MobileSleepSession | null>>({});
  const [activeFeedingRecordsByCardId, setActiveFeedingRecordsByCardId] =
    useState<Record<string, MobileFeedingRecord | null>>({});
  const [
    activeIllnessObservationsByChildId,
    setActiveIllnessObservationsByChildId,
  ] = useState<Record<string, MobileIllnessObservation | undefined>>({});
  const [familyCanInviteMembers, setFamilyCanInviteMembers] = useState(false);
  const [familyRoutinesCount, setFamilyRoutinesCount] = useState(0);
  const [canUseLiveActivities, setCanUseLiveActivities] = useState(false);
  const [liveActivityPreferences, setLiveActivityPreferences] = useState(
    defaultMobileLiveActivityPreferences,
  );

  const resetChildrenSnapshot = useCallback(() => {
    setChildren([]);
    setLatestChildMetricsByCardId({});
    setActiveSleepSessionsByCardId({});
    setActiveFeedingRecordsByCardId({});
    setActiveIllnessObservationsByChildId({});
  }, []);

  const applyFamilySettingsMeta = useCallback(
    (
      session: MobileAuthSession,
      bundle: Pick<FamilySettingsBundle, "familySummary" | "familyAccess">,
    ) => {
      setFamilyCanInviteMembers(
        session.family.ownerAccountId === session.account.id &&
          Boolean(bundle.familySummary.premiumActive),
      );
      setFamilyRoutinesCount(bundle.familyAccess.currentPillboxPlanCount);
    },
    [],
  );

  const resetFamilyShellState = useCallback(() => {
    setFamilyMembers([]);
    setFamilyCanInviteMembers(false);
    setFamilyRoutinesCount(0);
    setCanUseLiveActivities(false);
    setLiveActivityPreferences(defaultMobileLiveActivityPreferences);
    resetChildrenSnapshot();
  }, [resetChildrenSnapshot]);

  const hydrateActiveIllnessObservations = useCallback(
    async (session: MobileAuthSession, childIds: string[]) => {
      if (childIds.length === 0) {
        setActiveIllnessObservationsByChildId({});
        return;
      }

      const activeEpisodeResults = await Promise.allSettled(
        childIds.map((childId) => fetchMobileActiveIllnessEpisode(session, childId)),
      );
      const activeEpisodeHydrationResults = await Promise.allSettled(
        activeEpisodeResults.map(async (result) => {
          if (result.status !== "fulfilled" || !result.value) {
            return null;
          }

          return hydrateObservationFromEpisode(session, result.value, params.locale);
        }),
      );
      const nextIllnessObservations = Object.fromEntries(
        childIds.map((childId, index) => {
          const result = activeEpisodeHydrationResults[index];
          const observation = result?.status === "fulfilled" ? result.value : null;

          return [childId, observation ?? undefined];
        }),
      );

      setActiveIllnessObservationsByChildId(nextIllnessObservations);
    },
    [params.locale],
  );

  const loadFamilyMembers = useCallback(async (session: MobileAuthSession) => {
    try {
      const nextFamilyMembers = await fetchMobileFamilyMembers(session);
      setFamilyMembers(nextFamilyMembers);
    } catch {
      setFamilyMembers([]);
    }
  }, []);

  const refreshFamilyMembers = useCallback(async () => {
    if (!params.authSession) {
      return;
    }

    await loadFamilyMembers(params.authSession);
  }, [loadFamilyMembers, params.authSession]);

  const loadChildren = useCallback(
    async (
      session: MobileAuthSession,
      options?: { ignoreErrors?: boolean },
    ) => {
      try {
        const summary = await fetchMobileChildrenSummary(session);
        const nextChildren = summary.map((item) => item.child);

        if (nextChildren.length === 0) {
          setFamilyMembers([]);
          resetChildrenSnapshot();
          return [];
        }

        const nextMetrics = Object.fromEntries(
          summary.map((item) => [
            item.child.id,
            {
              weightKg: item.latestWeightKg,
              heightCm: item.latestHeightCm,
            },
          ]),
        );
        const activeSleepHydration = await Promise.all(
          summary.map(async (item) => {
            if (!item.activeSleepSession) {
              return [item.child.id, null] as const;
            }

            try {
              const activeSession = await fetchActiveMobileSleepSession(
                session,
                item.child.id,
              );
              return [item.child.id, activeSession] as const;
            } catch {
              return [
                item.child.id,
                {
                  id: item.activeSleepSession.id,
                  childId: item.child.id,
                  startedAt: item.activeSleepSession.startedAt,
                  endedAt: null,
                  durationMinutes: null,
                  status: "active",
                  createdByAccountId: null,
                } satisfies MobileSleepSession,
              ] as const;
            }
          }),
        );
        const activeFeedingHydration = await Promise.all(
          summary.map(async (item) => {
            if (!item.activeFeedingRecord) {
              return [item.child.id, null] as const;
            }

            try {
              const activeRecord = await fetchActiveMobileFeedingRecord(
                session,
                item.child.id,
              );
              return [item.child.id, activeRecord] as const;
            } catch {
              return [
                item.child.id,
                {
                  id: item.activeFeedingRecord.id,
                  childId: item.child.id,
                  feedingType: "breast",
                  breastSide: null,
                  isExpressed: false,
                  formulaVolumeMl: null,
                  recordedAt: item.activeFeedingRecord.startedAt,
                  startedAt: item.activeFeedingRecord.startedAt,
                  endedAt: null,
                  durationMinutes: null,
                  status: "active",
                  note: null,
                  createdByAccountId: null,
                } satisfies MobileFeedingRecord,
              ] as const;
            }
          }),
        );
        const nextSleepSessions = Object.fromEntries(activeSleepHydration);
        const nextFeedingRecords = Object.fromEntries(activeFeedingHydration);
        setChildren(nextChildren);
        void loadFamilyMembers(session);
        setLatestChildMetricsByCardId(nextMetrics);
        setActiveSleepSessionsByCardId(nextSleepSessions);
        setActiveFeedingRecordsByCardId(nextFeedingRecords);
        setActiveIllnessObservationsByChildId({});
        void hydrateActiveIllnessObservations(
          session,
          nextChildren.map((child) => child.id),
        );
        return nextChildren;
      } catch (error) {
        if (!options?.ignoreErrors) {
          resetChildrenSnapshot();
          throw error;
        }
        return null;
      }
    },
    [hydrateActiveIllnessObservations, loadFamilyMembers, resetChildrenSnapshot],
  );

  useEffect(() => {
    if (!params.authSession?.account.familyId) {
      setIsShellBootstrapping(false);
      resetFamilyShellState();
      return;
    }

    let cancelled = false;
    const session = params.authSession;

    async function syncChildren() {
      setIsShellBootstrapping(true);

      try {
        const nextChildren = await loadChildren(session, {
          ignoreErrors: true,
        });

        if (cancelled) {
          return;
        }

        if (!nextChildren || nextChildren.length === 0) {
          resetFamilyShellState();
          setIsShellBootstrapping(false);
          return;
        }

        const bootstrapChildId = nextChildren[0]?.id;
        const settingsBundle = (await loadSettingsBundle(session).catch(() => null)) as
          | FamilySettingsBundle
          | null;

        if (!cancelled && settingsBundle) {
          applyFamilySettingsMeta(session, settingsBundle);
          setCanUseLiveActivities(settingsBundle.familyAccess.canUseLiveActivities);
          setLiveActivityPreferences(
            toMobileLiveActivityPreferences(settingsBundle.pushPreferences),
          );
        }

        if (bootstrapChildId) {
          void prefetchAnalyticsScreenData(session, bootstrapChildId, "halfYear");
        }
      } catch {
        if (!cancelled) {
          resetFamilyShellState();
        }
      } finally {
        if (!cancelled) {
          setIsShellBootstrapping(false);
        }
      }
    }

    void syncChildren();

    return () => {
      cancelled = true;
    };
  }, [applyFamilySettingsMeta, loadChildren, params.authSession, resetFamilyShellState]);

  useEffect(() => {
    const authSession = params.authSession;
    if (!authSession) {
      setFamilyCanInviteMembers(false);
      setFamilyRoutinesCount(0);
      setCanUseLiveActivities(false);
      setLiveActivityPreferences(defaultMobileLiveActivityPreferences);
      return;
    }

    const cachedSettingsBundle = getCachedSettingsBundle(authSession.accessToken) as
      | FamilySettingsBundle
      | null;
    if (!cachedSettingsBundle) {
      return;
    }

    applyFamilySettingsMeta(authSession, cachedSettingsBundle);
    setCanUseLiveActivities(cachedSettingsBundle.familyAccess.canUseLiveActivities);
    setLiveActivityPreferences(
      toMobileLiveActivityPreferences(cachedSettingsBundle.pushPreferences),
    );
  }, [applyFamilySettingsMeta, params.authSession]);

  return {
    activeFeedingRecordsByCardId,
    activeIllnessObservationsByChildId,
    activeSleepSessionsByCardId,
    canUseLiveActivities,
    children,
    familyCanInviteMembers,
    familyMembers,
    familyRoutinesCount,
    isShellBootstrapping,
    latestChildMetricsByCardId,
    liveActivityPreferences,
    loadChildren,
    refreshFamilyMembers,
    setActiveFeedingRecordsByCardId,
    setActiveIllnessObservationsByChildId,
    setActiveSleepSessionsByCardId,
    setChildren,
    setCanUseLiveActivities,
    setFamilyMembers,
    setFamilyRoutinesCount,
    setLatestChildMetricsByCardId,
    setLiveActivityPreferences,
  };
}
