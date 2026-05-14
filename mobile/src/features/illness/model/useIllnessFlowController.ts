import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { createMobileAdministrationEvent, deleteMobileAdministrationEvent } from "../api/administrationEventsApi";
import {
  createMobileEpisodeMedicationPlan,
  deleteMobileEpisodeMedicationPlan,
  type MobileEpisodeMedicationPlan,
  updateMobileEpisodeMedicationPlan,
} from "../api/episodeMedicationPlansApi";
import {
  createMobileIllnessEpisode,
  updateMobileIllnessEpisode,
} from "../api/illnessAnalyticsApi";
import {
  createMobileIllnessComment,
  deleteMobileIllnessComment,
} from "../api/illnessCommentsApi";
import {
  createMobileTemperatureEntry,
  deleteMobileTemperatureEntry,
} from "../api/temperatureEntriesApi";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  createMobileIllnessEntryFromAdministration,
  createMobileIllnessEntryFromComment,
  createMobileIllnessEntryFromTemperature,
  type IllnessQuickActionKind,
  type MobileIllnessObservation,
} from "./illnessObservation";
import {
  buildReminderPlanObservationState,
  hasMatchingReminderAdministration,
} from "./illnessReminderPlanState";
import {
  hasActiveIllnessObservation,
  hydrateObservationFromEpisode,
  resolveActiveIllnessChildId,
  toIllnessEpisodeDate,
} from "./illnessObservationState";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

type SetSelectedIllnessActionKind = Dispatch<SetStateAction<IllnessQuickActionKind>>;

export function useIllnessFlowController({
  authSession,
  activeIllnessObservationsByChildId,
  locale,
  selectedChildId,
  setSelectedChildId,
  setSelectedIllnessActionKind,
  setIllnessActionReturnScreen,
  setActiveIllnessObservationsByChildId,
  navigateToChildrenRoot,
  navigateToIllnessJournalRoot,
  navigateToIllnessReminders,
  navigateToIllnessAction,
}: {
  authSession: MobileAuthSession | null;
  activeIllnessObservationsByChildId: Record<
    string,
    MobileIllnessObservation | undefined
  >;
  locale: MobileLocale;
  selectedChildId: string;
  setSelectedChildId: Dispatch<SetStateAction<string>>;
  setSelectedIllnessActionKind: SetSelectedIllnessActionKind;
  setIllnessActionReturnScreen: Dispatch<
    SetStateAction<"illnessJournal" | "illnessReminders">
  >;
  setActiveIllnessObservationsByChildId: Dispatch<
    SetStateAction<Record<string, MobileIllnessObservation | undefined>>
  >;
  navigateToChildrenRoot: () => void;
  navigateToIllnessJournalRoot: (childId?: string | null) => void;
  navigateToIllnessReminders: () => void;
  navigateToIllnessAction: () => void;
}) {
  const openObservationJournal = useCallback(
    (childId: string) => {
      navigateToIllnessJournalRoot(childId);
    },
    [navigateToIllnessJournalRoot],
  );

  const replaceObservationEntry = useCallback(
    (
      childId: string,
      entryId: string,
      nextEntry: MobileIllnessObservation["entries"][number],
    ) => {
      setActiveIllnessObservationsByChildId((current) => {
        const currentObservation = current[childId];

        if (!currentObservation) {
          return current;
        }

        const nextEntries = [
          nextEntry,
          ...currentObservation.entries.filter(
            (currentEntry) => currentEntry.id !== entryId,
          ),
        ].sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        );

        return {
          ...current,
          [childId]: {
            ...currentObservation,
            entries: nextEntries,
          },
        };
      });
    },
    [setActiveIllnessObservationsByChildId],
  );

  const removeObservationEntry = useCallback(
    (childId: string, entryId: string) => {
      setActiveIllnessObservationsByChildId((current) => {
        const observation = current[childId];

        if (!observation) {
          return current;
        }

        return {
          ...current,
          [childId]: {
            ...observation,
            entries: observation.entries.filter((entry) => entry.id !== entryId),
          },
        };
      });
    },
    [setActiveIllnessObservationsByChildId],
  );

  const applyReminderPlanToObservation = useCallback(
    ({
      childId,
      plan,
      administrationEntryForState,
      notificationRecipientAccountIds,
    }: {
      childId: string;
      plan: MobileEpisodeMedicationPlan;
      administrationEntryForState?: ReturnType<
        typeof createMobileIllnessEntryFromAdministration
      > | null;
      notificationRecipientAccountIds?: string[];
    }) => {
      setActiveIllnessObservationsByChildId((current) => {
        const currentObservation = current[childId];

        if (!currentObservation) {
          return current;
        }

        return {
          ...current,
          [childId]: buildReminderPlanObservationState(currentObservation, plan, locale, {
            administrationEntryForState,
            notificationRecipientAccountIds,
          }),
        };
      });
    },
    [locale, setActiveIllnessObservationsByChildId],
  );

  const persistReminderPlan = useCallback(
    async ({
      childId,
      customMedicineName,
      doseAmount,
      minIntervalMinutes,
      maxDosesPerDay,
      alreadyGiven,
      lastGivenAt,
      notes,
      existingPlanId,
    }: {
      childId: string;
      customMedicineName: string;
      doseAmount: string;
      minIntervalMinutes: number;
      maxDosesPerDay?: number | null;
      alreadyGiven?: boolean;
      lastGivenAt?: string | null;
      notes?: string | null;
      existingPlanId?: string;
    }) => {
      if (!authSession) {
        return;
      }

      const observation = activeIllnessObservationsByChildId[childId];

      if (!observation) {
        return;
      }

      const recipientIds =
        observation.notificationRecipientAccountIds.length > 0
          ? observation.notificationRecipientAccountIds
          : [authSession.account.id];

      const plan = existingPlanId
        ? await updateMobileEpisodeMedicationPlan(authSession, existingPlanId, {
            customMedicineName,
            doseAmount,
            minIntervalMinutes,
            maxDosesPerDay,
            notes,
          })
        : await createMobileEpisodeMedicationPlan(authSession, {
            episodeId: observation.episodeId,
            customMedicineName,
            doseAmount,
            minIntervalMinutes,
            maxDosesPerDay,
            memberAccountIds: recipientIds,
            notes,
          });

      let administrationEntryForState:
        | ReturnType<typeof createMobileIllnessEntryFromAdministration>
        | null = null;

      if (alreadyGiven && lastGivenAt) {
        const alreadyLogged = hasMatchingReminderAdministration(
          observation,
          customMedicineName,
          lastGivenAt,
        );

        if (!alreadyLogged) {
          const createAdministration = async () => {
            const administrationEntry = await createMobileAdministrationEvent(
              authSession,
              {
                episodeId: observation.episodeId,
                customMedicineName,
                amount: doseAmount,
                administeredAt: lastGivenAt,
              },
            );
            return createMobileIllnessEntryFromAdministration(
              administrationEntry,
              locale,
            );
          };

          if (existingPlanId) {
            administrationEntryForState = await createAdministration();
          } else {
            try {
              administrationEntryForState = await createAdministration();
            } catch (error) {
              await deleteMobileEpisodeMedicationPlan(authSession, plan.id);
              throw error;
            }
          }
        }
      }

      applyReminderPlanToObservation({
        childId,
        plan,
        administrationEntryForState,
        notificationRecipientAccountIds: existingPlanId ? undefined : recipientIds,
      });
      navigateToIllnessReminders();
    },
    [
      activeIllnessObservationsByChildId,
      applyReminderPlanToObservation,
      authSession,
      locale,
      navigateToIllnessReminders,
    ],
  );

  const handleCloseIllnessOnboarding = useCallback(() => {
    navigateToChildrenRoot();
  }, [navigateToChildrenRoot]);

  const handleCloseIllnessJournal = useCallback(() => {
    navigateToChildrenRoot();
  }, [navigateToChildrenRoot]);

  const handleCloseIllnessReminders = useCallback(() => {
    navigateToIllnessJournalRoot();
  }, [navigateToIllnessJournalRoot]);

  const handleStartIllnessObservation = useCallback(
    async ({ startedAt, reason }: { startedAt: string; reason: string }) => {
      if (!authSession || !selectedChildId) {
        return;
      }

      const episode = await createMobileIllnessEpisode(authSession, {
        childId: selectedChildId,
        startedAt: toIllnessEpisodeDate(startedAt),
        note: reason.trim() || null,
      });
      const observation = await hydrateObservationFromEpisode(
        authSession,
        episode,
        locale,
      );

      setActiveIllnessObservationsByChildId((current) => ({
        ...current,
        [selectedChildId]: observation,
      }));
      navigateToIllnessJournalRoot(selectedChildId);
    },
    [
      authSession,
      locale,
      navigateToIllnessJournalRoot,
      selectedChildId,
      setActiveIllnessObservationsByChildId,
    ],
  );

  const handleAddIllnessEntry = useCallback(
    (childId: string, kind: IllnessQuickActionKind) => {
      setSelectedChildId(childId);
      if (kind === "reminder") {
        navigateToIllnessReminders();
        return;
      }
      setSelectedIllnessActionKind(kind);
      setIllnessActionReturnScreen("illnessJournal");
      navigateToIllnessAction();
    },
    [
      navigateToIllnessAction,
      navigateToIllnessReminders,
      setIllnessActionReturnScreen,
      setSelectedChildId,
      setSelectedIllnessActionKind,
    ],
  );

  const handleOpenIllnessReminders = useCallback(
    (childId: string) => {
      setSelectedChildId(childId);
      navigateToIllnessReminders();
    },
    [navigateToIllnessReminders, setSelectedChildId],
  );

  const handleOpenReminderComposer = useCallback(
    (childId: string) => {
      setSelectedChildId(childId);
      setSelectedIllnessActionKind("reminder");
      setIllnessActionReturnScreen("illnessReminders");
      navigateToIllnessAction();
    },
    [
      navigateToIllnessAction,
      setIllnessActionReturnScreen,
      setSelectedChildId,
      setSelectedIllnessActionKind,
    ],
  );

  const handleSaveTemperatureEntry = useCallback(
    async ({
      childId,
      valueCelsius,
      measuredAt,
    }: {
      childId: string;
      valueCelsius: number;
      measuredAt: string;
    }) => {
      if (!authSession) {
        return;
      }

      const observation = activeIllnessObservationsByChildId[childId];

      if (!observation) {
        return;
      }

      const entry = await createMobileTemperatureEntry(authSession, {
        episodeId: observation.episodeId,
        valueCelsius,
        measuredAt,
      });

      replaceObservationEntry(
        childId,
        entry.id,
        createMobileIllnessEntryFromTemperature(entry, locale),
      );
      openObservationJournal(childId);
    },
    [
      activeIllnessObservationsByChildId,
      authSession,
      locale,
      openObservationJournal,
      replaceObservationEntry,
    ],
  );

  const handleSaveIllnessNoteEntry = useCallback(
    async ({
      childId,
      text,
      createdAt,
    }: {
      childId: string;
      text: string;
      createdAt: string;
    }) => {
      if (!authSession) {
        return;
      }

      const observation = activeIllnessObservationsByChildId[childId];

      if (!observation) {
        return;
      }

      const entry = await createMobileIllnessComment(authSession, {
        episodeId: observation.episodeId,
        text,
        createdAt,
      });

      replaceObservationEntry(
        childId,
        entry.id,
        createMobileIllnessEntryFromComment(entry, locale),
      );
      openObservationJournal(childId);
    },
    [
      activeIllnessObservationsByChildId,
      authSession,
      locale,
      openObservationJournal,
      replaceObservationEntry,
    ],
  );

  const handleSaveAdministrationEntry = useCallback(
    async ({
      childId,
      customMedicineName,
      amount,
      administeredAt,
      reason,
    }: {
      childId: string;
      customMedicineName: string;
      amount: string;
      administeredAt: string;
      reason?: string | null;
    }) => {
      if (!authSession) {
        return;
      }

      const observation = activeIllnessObservationsByChildId[childId];

      if (!observation) {
        return;
      }

      const entry = await createMobileAdministrationEvent(authSession, {
        episodeId: observation.episodeId,
        customMedicineName,
        amount,
        administeredAt,
        reason: reason ?? null,
      });

      replaceObservationEntry(
        childId,
        entry.id,
        createMobileIllnessEntryFromAdministration(entry, locale),
      );
      openObservationJournal(childId);
    },
    [
      activeIllnessObservationsByChildId,
      authSession,
      locale,
      openObservationJournal,
      replaceObservationEntry,
    ],
  );

  const handleTakeReminderDose = useCallback(
    async ({
      childId,
      plan,
      administeredAt,
    }: {
      childId: string;
      plan: MobileEpisodeMedicationPlan;
      administeredAt?: string | null;
    }) => {
      if (!authSession) {
        return;
      }

      const observation = activeIllnessObservationsByChildId[childId];

      if (!observation) {
        return;
      }

      const entry = await createMobileAdministrationEvent(authSession, {
        episodeId: observation.episodeId,
        customMedicineName: plan.customMedicineName?.trim() || "",
        amount: plan.doseAmount,
        administeredAt: administeredAt ?? new Date().toISOString(),
        reason: locale === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
      });

      replaceObservationEntry(
        childId,
        entry.id,
        createMobileIllnessEntryFromAdministration(entry, locale),
      );
    },
    [
      activeIllnessObservationsByChildId,
      authSession,
      locale,
      replaceObservationEntry,
    ],
  );

  const handleSaveReminderEntry = useCallback(
    async ({
      childId,
      customMedicineName,
      doseAmount,
      minIntervalMinutes,
      maxDosesPerDay,
      alreadyGiven,
      lastGivenAt,
      notes,
    }: {
      childId: string;
      customMedicineName: string;
      doseAmount: string;
      minIntervalMinutes: number;
      maxDosesPerDay?: number | null;
      alreadyGiven?: boolean;
      lastGivenAt?: string | null;
      notes?: string | null;
    }) => {
      await persistReminderPlan({
        childId,
        customMedicineName,
        doseAmount,
        minIntervalMinutes,
        maxDosesPerDay,
        alreadyGiven,
        lastGivenAt,
        notes,
      });
    },
    [persistReminderPlan],
  );

  const handleUpdateReminderEntry = useCallback(
    async ({
      childId,
      planId,
      customMedicineName,
      doseAmount,
      minIntervalMinutes,
      maxDosesPerDay,
      alreadyGiven,
      lastGivenAt,
      notes,
    }: {
      childId: string;
      planId: string;
      customMedicineName: string;
      doseAmount: string;
      minIntervalMinutes: number;
      maxDosesPerDay?: number | null;
      alreadyGiven?: boolean;
      lastGivenAt?: string | null;
      notes?: string | null;
    }) => {
      await persistReminderPlan({
        childId,
        customMedicineName,
        doseAmount,
        minIntervalMinutes,
        maxDosesPerDay,
        alreadyGiven,
        lastGivenAt,
        notes,
        existingPlanId: planId,
      });
    },
    [persistReminderPlan],
  );

  const handleDeleteIllnessEntry = useCallback(
    async ({
      childId,
      entryId,
      kind,
    }: {
      childId: string;
      entryId: string;
      kind: "temperature" | "note" | "medicine" | "reminder";
    }) => {
      if (!authSession) {
        return;
      }

      if (kind === "temperature") {
        await deleteMobileTemperatureEntry(authSession, entryId);
      } else if (kind === "medicine") {
        await deleteMobileAdministrationEvent(authSession, entryId);
      } else if (kind === "reminder") {
        await deleteMobileEpisodeMedicationPlan(authSession, entryId);
      } else {
        await deleteMobileIllnessComment(authSession, entryId);
      }

      removeObservationEntry(childId, entryId);
      if (kind === "reminder") {
        setActiveIllnessObservationsByChildId((current) => {
          const observation = current[childId];

          if (!observation) {
            return current;
          }

          return {
            ...current,
            [childId]: {
              ...observation,
              medicationPlans: observation.medicationPlans.filter(
                (plan) => plan.id !== entryId,
              ),
            },
          };
        });
      }
    },
    [
      authSession,
      removeObservationEntry,
      setActiveIllnessObservationsByChildId,
    ],
  );

  const handleSaveReminderRecipients = useCallback(
    async ({
      childId,
      memberAccountIds,
    }: {
      childId: string;
      memberAccountIds: string[];
    }) => {
      if (!authSession) {
        return;
      }

      const observation = activeIllnessObservationsByChildId[childId];

      if (!observation) {
        return;
      }

      const updatedEpisode = await updateMobileIllnessEpisode(
        authSession,
        observation.episodeId,
        {
          memberAccountIds,
        },
      );
      const updatedPlans = await Promise.all(
        observation.medicationPlans.map((plan) =>
          updateMobileEpisodeMedicationPlan(authSession, plan.id, {
            memberAccountIds,
          }),
        ),
      );

      setActiveIllnessObservationsByChildId((current) => {
        const currentObservation = current[childId];

        if (!currentObservation) {
          return current;
        }

        return {
          ...current,
          [childId]: {
            ...currentObservation,
            notificationRecipientAccountIds: updatedEpisode.memberAccountIds,
            medicationPlans: updatedPlans,
          },
        };
      });
    },
    [
      activeIllnessObservationsByChildId,
      authSession,
      setActiveIllnessObservationsByChildId,
    ],
  );

  const handleFinishIllnessObservation = useCallback(
    async (childId: string) => {
      const observation = activeIllnessObservationsByChildId[childId];

      if (!authSession || !observation) {
        return;
      }

      await updateMobileIllnessEpisode(authSession, observation.episodeId, {
        status: "closed",
        closedAt: new Date().toISOString(),
      });

      const nextObservationsByChildId = {
        ...activeIllnessObservationsByChildId,
        [childId]: undefined,
      };

      setActiveIllnessObservationsByChildId(nextObservationsByChildId);

      if (hasActiveIllnessObservation(nextObservationsByChildId)) {
        const nextActiveChildId = resolveActiveIllnessChildId(
          nextObservationsByChildId,
          selectedChildId,
        );

        if (nextActiveChildId) {
          setSelectedChildId(nextActiveChildId);
        }

        navigateToIllnessJournalRoot();
        return;
      }

      navigateToChildrenRoot();
    },
    [
      activeIllnessObservationsByChildId,
      authSession,
      navigateToChildrenRoot,
      navigateToIllnessJournalRoot,
      selectedChildId,
      setActiveIllnessObservationsByChildId,
      setSelectedChildId,
    ],
  );

  return {
    handleAddIllnessEntry,
    handleCloseIllnessReminders,
    handleCloseIllnessJournal,
    handleCloseIllnessOnboarding,
    handleDeleteIllnessEntry,
    handleFinishIllnessObservation,
    handleOpenIllnessReminders,
    handleOpenReminderComposer,
    handleSaveAdministrationEntry,
    handleSaveIllnessNoteEntry,
    handleTakeReminderDose,
    handleSaveReminderRecipients,
    handleSaveReminderEntry,
    handleUpdateReminderEntry,
    handleSaveTemperatureEntry,
    handleStartIllnessObservation,
  };
}
