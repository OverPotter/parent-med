import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdministrationEvent,
  fetchAdministrationEventsByEpisodeId,
} from "@shared/api/administrationEvents";
import {
  deleteEpisodeMedicationPlan,
  fetchEpisodeMedicationPlansByEpisodeId,
  updateEpisodeMedicationPlan,
} from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { createIllnessComment, fetchIllnessCommentsByEpisodeId } from "@shared/api/illnessComments";
import {
  createTemperatureEntry,
  fetchTemperatureEntriesByEpisodeId,
} from "@shared/api/temperatureEntries";
import { updateIllnessEpisode } from "@shared/api/illnessEpisodes";
import { trackMedicationAdministered, trackTemperatureLogged } from "@shared/analytics";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { canEditChild, canViewCabinet } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import type {
  EpisodeMedicationPlan,
  FamilyMember,
  IllnessEpisode,
  WeightEntry,
} from "@shared/types/api";
import { getCurrentDeviceTimestampIso } from "@shared/utils/date";
import { requestLiveActivityRefresh } from "@shared/utils/liveActivityRuntimeEvents";
import { getPrioritizedMedicationPlanItems } from "@client/utils/medicationPlans";
import {
  AdministrationQuickView,
  CommentQuickView,
  ReminderCreateQuickView,
  ReminderDetailQuickView,
  ReminderListQuickView,
  TemperatureQuickView,
  TimelineQuickView,
} from "./EpisodeQuickViews";
import {
  EpisodeMainPanel,
  ManualComposerOverview,
  ReminderOverviewPanel,
  TimelineOverviewPanel,
} from "./EpisodeOverviewPanels";
import { createReminderWithOptionalFirstAdministration } from "./reminderCreation";
import { DoseTimeSheet, useDoseLoggingFlow } from "./doseLogging";
import { upsertIllnessEpisodeForChild } from "./episodeCache";
import { buildEpisodeTimeline } from "./timeline";

export function EpisodeBlock({
  childName,
  childId,
  episode,
  familyMembers,
  onClose,
  familyId,
  latestWeight,
  initialComposerMode,
  quickComposeMode,
  quickTimelineMode,
  quickReminderMode,
  quickReminderCreateMode,
  quickReminderDetailMode,
  reminderPlanId,
  planLocksChildActions,
  onLockedActionAttempt,
}: {
  childName: string;
  childId: string;
  episode: IllnessEpisode;
  familyMembers: FamilyMember[];
  onClose: () => void;
  familyId: string | null;
  latestWeight: WeightEntry | null;
  initialComposerMode: "temperature" | "administration" | "comment";
  quickComposeMode: "temperature" | "administration" | "comment" | null;
  quickTimelineMode: boolean;
  quickReminderMode: boolean;
  quickReminderCreateMode: boolean;
  quickReminderDetailMode: boolean;
  reminderPlanId: string | null;
  planLocksChildActions: boolean;
  onLockedActionAttempt: () => void;
}) {
  const { language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const liveQueryOptions = useLiveQueryOptions(5_000);
  const canSeeCabinet = canViewCabinet(accountFamilyRole, accountAccessPolicy);
  const canEditEpisode = canEditChild(childId, accountFamilyRole, accountAccessPolicy);
  const canMutateEpisode = canEditEpisode && !planLocksChildActions;
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isReminderCabinetPickerOpen = searchParams.get("picker") === "cabinet";
  const [isReminderEditing, setIsReminderEditing] = useState(false);
  const [editingReminderName, setEditingReminderName] = useState<string | null>(null);
  const [recipientDraftIds, setRecipientDraftIds] = useState<string[]>(
    () => episode.notificationRecipientAccountIds
  );
  const [commentText, setCommentText] = useState("");
  const [quickComposeSuccessMessage, setQuickComposeSuccessMessage] = useState<string | null>(null);
  const now = useNow(5_000);
  const composerMode = quickComposeMode ?? initialComposerMode;
  const quickComposeMeta =
    composerMode === "temperature"
      ? {
          success: language === "ru" ? "Температура сохранена" : "Temperature saved",
        }
      : composerMode === "administration"
        ? {
            success: language === "ru" ? "Приём сохранён" : "Dose saved",
          }
        : {
            success: language === "ru" ? "Заметка сохранена" : "Note saved",
          };

  const { data: temperatureEntries = [] } = useQuery({
    queryKey: ["temperature-entries", episode.id],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episode.id],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["illness-comments", episode.id],
    queryFn: () => fetchIllnessCommentsByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: medicationPlans = [] } = useQuery({
    queryKey: ["episode-medication-plans", episode.id],
    queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!familyId && !!accountId && canSeeCabinet,
    ...liveQueryOptions,
  });

  const addTempMutation = useMutation({
    mutationFn: (valueCelsius: number) =>
      createTemperatureEntry({
        episode_id: episode.id,
        value_celsius: valueCelsius,
        measured_at: getCurrentDeviceTimestampIso(),
      }),
    onSuccess: () => {
      void trackTemperatureLogged(episode.id);
      queryClient.invalidateQueries({ queryKey: ["temperature-entries", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-insights", episode.id] });
      requestLiveActivityRefresh();
      if (quickComposeMode) setQuickComposeSuccessMessage(quickComposeMeta.success);
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: (payload: {
      household_medicine_id?: string | null;
      custom_medicine_name?: string;
      amount: string;
      reason?: string;
      administered_at?: string | null;
    }) =>
      createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: payload.household_medicine_id,
        custom_medicine_name: payload.custom_medicine_name,
        administered_at: payload.administered_at ?? getCurrentDeviceTimestampIso(),
        amount: payload.amount,
        reason: payload.reason,
      }),
    onSuccess: () => {
      trackMedicationAdministered("episode_detail");
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-insights", episode.id] });
      requestLiveActivityRefresh();
      doseLogging.close();
      if (quickComposeMode) setQuickComposeSuccessMessage(quickComposeMeta.success);
    },
  });
  const doseLogging = useDoseLoggingFlow<EpisodeMedicationPlan>({
    language,
    now: new Date(now),
    onSubmit: (plan, administeredAt) =>
      addAdminMutation.mutate({
        household_medicine_id: plan.householdMedicineId,
        custom_medicine_name: plan.customMedicineName ?? undefined,
        administered_at: administeredAt ?? getCurrentDeviceTimestampIso(),
        amount: plan.doseAmount,
        reason: language === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
      }),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (payload: {
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      dose_amount: string;
      min_interval_minutes: number;
      max_doses_per_day?: number | null;
      weight_kg?: number | null;
      dose_mg_per_kg?: number | null;
      calculated_dose_mg?: number | null;
      calculated_dose_value?: number | null;
      calculated_dose_unit?: string | null;
      dose_calc_mode?: string | null;
      dose_calc_warning?: string | null;
      manual_dose_override?: boolean;
      notes?: string | null;
      first_dose_status?: "already_given" | "not_given";
      first_dose_at?: string | null;
    }) =>
      createReminderWithOptionalFirstAdministration(
        {
          episodeId: episode.id,
          householdMedicineId: payload.household_medicine_id,
          customMedicineName: payload.custom_medicine_name,
          doseAmount: payload.dose_amount,
          minIntervalMinutes: payload.min_interval_minutes,
          maxDosesPerDay: payload.max_doses_per_day,
          weightKg: payload.weight_kg,
          doseMgPerKg: payload.dose_mg_per_kg,
          calculatedDoseMg: payload.calculated_dose_mg,
          calculatedDoseValue: payload.calculated_dose_value,
          calculatedDoseUnit: payload.calculated_dose_unit,
          doseCalcMode: payload.dose_calc_mode,
          doseCalcWarning: payload.dose_calc_warning,
          manualDoseOverride: payload.manual_dose_override,
          notes: payload.notes,
          firstDoseStatus: payload.first_dose_status,
          firstDoseAt: payload.first_dose_at,
        },
        language
      ),
    onSuccess: async (createdPlan) => {
      queryClient.setQueryData<EpisodeMedicationPlan[]>(
        ["episode-medication-plans", episode.id],
        (current) => {
          const items = current ?? [];
          if (items.some((item) => item.id === createdPlan.id)) {
            return items;
          }
          return [createdPlan, ...items];
        }
      );
      await queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      await queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      await queryClient.invalidateQueries({ queryKey: ["illness-episode-insights", episode.id] });
      requestLiveActivityRefresh();
      if (quickReminderCreateMode) {
        navigate(`/children/${childId}/illness?focus=reminders`, { replace: true });
      }
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      await queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      await queryClient.invalidateQueries({ queryKey: ["illness-episode-insights", episode.id] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deleteEpisodeMedicationPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      requestLiveActivityRefresh();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        household_medicine_id?: string | null;
        custom_medicine_name?: string | null;
        dose_amount?: string;
        min_interval_minutes?: number;
        max_doses_per_day?: number | null;
        weight_kg?: number | null;
        dose_mg_per_kg?: number | null;
        calculated_dose_mg?: number | null;
        calculated_dose_value?: number | null;
        calculated_dose_unit?: string | null;
        dose_calc_mode?: string | null;
        dose_calc_warning?: string | null;
        manual_dose_override?: boolean;
        notes?: string | null;
      };
    }) => updateEpisodeMedicationPlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      requestLiveActivityRefresh();
    },
  });

  const updateEpisodeRecipientsMutation = useMutation({
    mutationFn: (notificationRecipientAccountIds: string[]) =>
      updateIllnessEpisode(episode.id, {
        notification_recipient_account_ids: notificationRecipientAccountIds,
      }),
    onMutate: async (notificationRecipientAccountIds) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["illness-episode-active", childId] }),
        queryClient.cancelQueries({ queryKey: ["illness-episodes", childId] }),
      ]);

      const previousActiveEpisode = queryClient.getQueryData<IllnessEpisode | null>([
        "illness-episode-active",
        childId,
      ]);
      const previousEpisodes = queryClient.getQueryData<IllnessEpisode[]>([
        "illness-episodes",
        childId,
      ]);

      upsertIllnessEpisodeForChild(queryClient, childId, {
        ...episode,
        notificationRecipientAccountIds: [...notificationRecipientAccountIds],
      });

      return { previousActiveEpisode, previousEpisodes };
    },
    onError: (_error, _memberAccountIds, context) => {
      setRecipientDraftIds(
        context?.previousActiveEpisode?.notificationRecipientAccountIds ??
          episode.notificationRecipientAccountIds
      );
      if (context?.previousActiveEpisode !== undefined) {
        queryClient.setQueryData(
          ["illness-episode-active", childId],
          context.previousActiveEpisode
        );
      }
      if (context?.previousEpisodes !== undefined) {
        queryClient.setQueryData(["illness-episodes", childId], context.previousEpisodes);
      }
    },
    onSuccess: (updatedEpisode) => {
      setRecipientDraftIds(updatedEpisode.notificationRecipientAccountIds);
      upsertIllnessEpisodeForChild(queryClient, childId, updatedEpisode);
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
    },
  });
  const isUpdatingRecipients = updateEpisodeRecipientsMutation.isPending;

  useEffect(() => {
    if (isUpdatingRecipients) {
      return;
    }
    setRecipientDraftIds(episode.notificationRecipientAccountIds);
  }, [episode.notificationRecipientAccountIds, isUpdatingRecipients]);

  const recipientsEpisode = useMemo<IllnessEpisode>(
    () => ({ ...episode, notificationRecipientAccountIds: recipientDraftIds }),
    [episode, recipientDraftIds]
  );

  const addCommentMutation = useMutation({
    mutationFn: () =>
      createIllnessComment({
        episode_id: episode.id,
        text: commentText.trim(),
        created_at: getCurrentDeviceTimestampIso(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-comments", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-insights", episode.id] });
      requestLiveActivityRefresh();
      setCommentText("");
      if (quickComposeMode) setQuickComposeSuccessMessage(quickComposeMeta.success);
    },
  });

  const [tempValue, setTempValue] = useState("");
  const [adminCustomMedicineName, setAdminCustomMedicineName] = useState("");
  const [adminAmount, setAdminAmount] = useState("");
  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "temperature" | "administration" | "comment"
  >("all");
  const [timelineActorFilter, setTimelineActorFilter] = useState("all");
  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    householdMedicines,
    language,
    {
      accountId,
    },
    familyMembers
  );
  const filteredTimelineItems =
    timelineFilter === "all"
      ? timelineItems
      : timelineItems.filter((item) => item.kind === timelineFilter);
  const timelineActorOptions = Array.from(
    new Map(
      timelineItems
        .filter((item) => item.actorName)
        .map((item) => [item.actorName as string, item.actorName as string])
    ).values()
  );
  const visibleTimelineItems =
    timelineActorFilter === "all"
      ? filteredTimelineItems
      : filteredTimelineItems.filter((item) => item.actorName === timelineActorFilter);
  const reminderItems = getPrioritizedMedicationPlanItems(
    medicationPlans,
    administrations,
    householdMedicines,
    new Date(now)
  );
  const reminderLead = reminderItems[0] ?? null;
  const selectedReminderItem = reminderPlanId
    ? (reminderItems.find((item) => item.plan.id === reminderPlanId) ?? null)
    : null;
  const updateEpisodeRecipients = (memberIds: string[]) => {
    setRecipientDraftIds(memberIds);
    updateEpisodeRecipientsMutation.mutate(memberIds);
  };

  const handleTakeDose = (plan: EpisodeMedicationPlan) => {
    if (!canMutateEpisode) {
      onLockedActionAttempt();
      return;
    }
    const selectedReminder = reminderItems.find((item) => item.plan.id === plan.id) ?? null;
    doseLogging.open({
      item: plan,
      nextAllowedAt: selectedReminder?.stats.nextAllowedAt,
      planName:
        plan.customMedicineName ??
        selectedReminder?.medicine?.medicineName ??
        (language === "ru" ? "Лекарство" : "Medicine"),
    });
  };
  const doseTimeSheet = (
    <DoseTimeSheet
      language={language}
      isOpen={doseLogging.isOpen}
      closeDisabled={addAdminMutation.isPending}
      hint={doseLogging.hint}
      pendingDate={doseLogging.pendingDate}
      pendingTime={doseLogging.pendingTime}
      hasFuturePendingDoseSelection={doseLogging.hasFuturePendingDoseSelection}
      isPending={addAdminMutation.isPending || !doseLogging.pendingDoseAt}
      submitLabel={
        addAdminMutation.isPending
          ? language === "ru"
            ? "Сохраняем…"
            : "Saving…"
          : language === "ru"
            ? "Сохранить приём"
            : "Save dose"
      }
      onClose={() => {
        if (addAdminMutation.isPending) {
          return;
        }
        doseLogging.close();
      }}
      onDateChange={doseLogging.setPendingDate}
      onTimeChange={doseLogging.setPendingTime}
      onSubmit={doseLogging.submitPending}
    />
  );

  useEffect(() => {
    if (!quickReminderDetailMode || !reminderPlanId || selectedReminderItem) {
      return;
    }
    navigate(`/children/${childId}/illness?focus=reminders`, { replace: true });
  }, [childId, navigate, quickReminderDetailMode, reminderPlanId, selectedReminderItem]);

  useEffect(() => {
    if (!quickReminderDetailMode || !isReminderCabinetPickerOpen || isReminderEditing) {
      return;
    }
    navigate(`/children/${childId}/illness?focus=reminder-detail&plan=${reminderPlanId}`, {
      replace: true,
    });
  }, [
    childId,
    isReminderCabinetPickerOpen,
    isReminderEditing,
    navigate,
    quickReminderDetailMode,
    reminderPlanId,
  ]);

  useEffect(() => {
    setIsReminderEditing(false);
    setEditingReminderName(null);
  }, [reminderPlanId]);

  useEffect(() => {
    if (!quickComposeSuccessMessage) return;
    const timeoutId = window.setTimeout(() => {
      setQuickComposeSuccessMessage(null);
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [quickComposeSuccessMessage]);

  if (quickComposeMode) {
    if (composerMode === "temperature") {
      return (
        <div className="mx-auto w-full max-w-2xl">
          <TemperatureQuickView
            language={language}
            childName={childName}
            successMessage={quickComposeSuccessMessage}
            tempValue={tempValue}
            onTempChange={setTempValue}
            onSubmit={() => {
              const parsed = Number.parseFloat(tempValue.replace(",", ".").trim());
              if (Number.isNaN(parsed)) return;
              addTempMutation.mutate(parsed);
              setTempValue("");
            }}
            isPending={addTempMutation.isPending}
            entries={temperatureEntries}
          />
        </div>
      );
    }

    if (composerMode === "administration") {
      return (
        <div className="mx-auto w-full max-w-2xl">
          <AdministrationQuickView
            language={language}
            successMessage={quickComposeSuccessMessage}
            customMedicineName={adminCustomMedicineName}
            amount={adminAmount}
            onCustomMedicineNameChange={setAdminCustomMedicineName}
            onAmountChange={setAdminAmount}
            onSubmit={() => {
              if (!adminCustomMedicineName.trim()) return;
              addAdminMutation.mutate({
                custom_medicine_name: adminCustomMedicineName.trim(),
                amount: adminAmount.trim(),
              });
              setAdminCustomMedicineName("");
              setAdminAmount("");
            }}
            isPending={addAdminMutation.isPending}
            isError={addAdminMutation.isError}
            errorDetail={
              (addAdminMutation.error as { response?: { data?: { detail?: string } } })?.response
                ?.data?.detail ?? null
            }
            entries={administrations}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-2xl">
        <CommentQuickView
          language={language}
          successMessage={quickComposeSuccessMessage}
          commentText={commentText}
          onCommentChange={setCommentText}
          onSubmit={() => {
            if (!commentText.trim()) return;
            addCommentMutation.mutate();
          }}
          isPending={addCommentMutation.isPending}
          entries={comments}
        />
      </div>
    );
  }

  if (quickTimelineMode) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <TimelineQuickView
          language={language}
          timelineFilter={timelineFilter}
          setTimelineFilter={setTimelineFilter}
          timelineActorFilter={timelineActorFilter}
          setTimelineActorFilter={setTimelineActorFilter}
          timelineActorOptions={timelineActorOptions}
          visibleTimelineItems={visibleTimelineItems}
        />
      </div>
    );
  }

  if (quickReminderMode) {
    return (
      <>
        {doseTimeSheet}
        <div className="mx-auto w-full max-w-2xl">
          <ReminderListQuickView
            language={language}
            childId={childId}
            episode={recipientsEpisode}
            plans={medicationPlans}
            medicines={householdMedicines}
            familyMembers={familyMembers}
            currentAccountId={accountId}
            canEditEpisode={canMutateEpisode}
            administrations={administrations}
            onOpen={(planId) =>
              navigate(`/children/${childId}/illness?focus=reminder-detail&plan=${planId}`)
            }
            onTakeDose={canMutateEpisode ? handleTakeDose : undefined}
            isSubmittingAdministration={addAdminMutation.isPending}
            isUpdatingRecipients={isUpdatingRecipients}
            onChangeRecipients={updateEpisodeRecipients}
          />
        </div>
      </>
    );
  }

  if (quickReminderDetailMode) {
    return (
      <>
        {doseTimeSheet}
        <div className="mx-auto w-full max-w-2xl">
          <ReminderDetailQuickView
            language={language}
            childName={childName}
            childId={childId}
            selectedReminderItem={selectedReminderItem}
            latestWeight={latestWeight}
            isReminderCabinetPickerOpen={isReminderCabinetPickerOpen}
            isReminderEditing={isReminderEditing}
            editingReminderName={editingReminderName}
            medicines={householdMedicines}
            canEditEpisode={canMutateEpisode}
            isSubmittingAdministration={addAdminMutation.isPending}
            isUpdating={updatePlanMutation.isPending}
            isDeleting={deletePlanMutation.isPending}
            errorDetail={
              (
                (updatePlanMutation.error ?? deletePlanMutation.error) as {
                  response?: { data?: { detail?: string } };
                }
              )?.response?.data?.detail ?? null
            }
            onEditingChange={(nextIsEditing, planName) => {
              setIsReminderEditing(nextIsEditing);
              setEditingReminderName(nextIsEditing ? planName : null);
            }}
            onTakeDose={canMutateEpisode ? handleTakeDose : undefined}
            onUpdate={(planId, payload) =>
              updatePlanMutation.mutate({
                id: planId,
                payload: {
                  household_medicine_id: payload.householdMedicineId,
                  custom_medicine_name: payload.customMedicineName,
                  dose_amount: payload.doseAmount,
                  min_interval_minutes: payload.minIntervalMinutes,
                  max_doses_per_day: payload.maxDosesPerDay,
                  weight_kg: payload.weightKg,
                  dose_mg_per_kg: payload.doseMgPerKg,
                  calculated_dose_mg: payload.calculatedDoseMg,
                  calculated_dose_value: payload.calculatedDoseValue,
                  calculated_dose_unit: payload.calculatedDoseUnit,
                  dose_calc_mode: payload.doseCalcMode,
                  dose_calc_warning: payload.doseCalcWarning,
                  manual_dose_override: payload.manualDoseOverride,
                  notes: payload.notes,
                },
              })
            }
            onDelete={(planId) => {
              deletePlanMutation.mutate(planId, {
                onSuccess: () => {
                  const canGoBack =
                    typeof window !== "undefined" &&
                    (window.history.length > 1 ||
                      (typeof window.history.state === "object" &&
                        window.history.state !== null &&
                        typeof (window.history.state as { idx?: unknown }).idx === "number" &&
                        ((window.history.state as { idx: number }).idx ?? 0) > 0));

                  if (canGoBack) {
                    navigate(-1);
                    return;
                  }

                  navigate(`/children/${childId}/illness?focus=reminders`, { replace: true });
                },
              });
            }}
          />
        </div>
      </>
    );
  }

  if (quickReminderCreateMode) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ReminderCreateQuickView
          language={language}
          childName={childName}
          medicines={householdMedicines.filter(
            (medicine) =>
              medicine.status !== "expired" && medicine.status !== "expired_after_opening"
          )}
          latestWeight={latestWeight}
          isReminderCabinetPickerOpen={isReminderCabinetPickerOpen}
          submitLabel={language === "ru" ? "Сохранить напоминание" : "Save reminder"}
          isPending={createPlanMutation.isPending}
          errorDetail={
            (createPlanMutation.error as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? null
          }
          onSubmit={(payload) =>
            createPlanMutation.mutate({
              household_medicine_id: payload.householdMedicineId,
              custom_medicine_name: payload.customMedicineName,
              dose_amount: payload.doseAmount,
              min_interval_minutes: payload.minIntervalMinutes,
              max_doses_per_day: payload.maxDosesPerDay,
              weight_kg: payload.weightKg,
              dose_mg_per_kg: payload.doseMgPerKg,
              calculated_dose_mg: payload.calculatedDoseMg,
              calculated_dose_value: payload.calculatedDoseValue,
              calculated_dose_unit: payload.calculatedDoseUnit,
              dose_calc_mode: payload.doseCalcMode,
              dose_calc_warning: payload.doseCalcWarning,
              manual_dose_override: payload.manualDoseOverride,
              notes: payload.notes,
              first_dose_status: payload.firstDoseStatus,
              first_dose_at: payload.firstDoseAt,
            })
          }
          onCancel={() =>
            navigate(
              medicationPlans.length > 0
                ? `/children/${childId}/illness?focus=reminders`
                : `/children/${childId}`,
              { replace: true }
            )
          }
        />
      </div>
    );
  }

  return (
    <>
      {doseTimeSheet}
      <EpisodeMainPanel
        language={language}
        childName={childName}
        episode={episode}
        isCloseConfirmOpen={isCloseConfirmOpen}
        setIsCloseConfirmOpen={setIsCloseConfirmOpen}
        onClose={onClose}
        canEditEpisode={canMutateEpisode}
        onLockedActionAttempt={onLockedActionAttempt}
        manualComposerSection={
          <ManualComposerOverview
            language={language}
            childId={childId}
            canEditEpisode={canMutateEpisode}
            onLockedActionAttempt={onLockedActionAttempt}
          />
        }
        reminderOverviewSection={
          <ReminderOverviewPanel
            language={language}
            childId={childId}
            episode={episode}
            medicationPlans={medicationPlans}
            reminderLead={reminderLead}
            canEditEpisode={canMutateEpisode}
            onLockedActionAttempt={onLockedActionAttempt}
          />
        }
        timelineSection={
          <TimelineOverviewPanel
            language={language}
            childId={childId}
            timelineCount={timelineItems.length}
          />
        }
      />
    </>
  );
}
