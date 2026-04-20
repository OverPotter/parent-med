import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdministrationEvent,
  fetchAdministrationEventsByEpisodeId,
} from "@shared/api/administrationEvents";
import {
  createEpisodeMedicationPlan,
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
import { trackMedicationAdministered, trackTemperatureLogged } from "@shared/analytics";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type { IllnessEpisode, WeightEntry } from "@shared/types/api";
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
import { buildEpisodeTimeline } from "./timeline";

export function EpisodeBlock({
  childName,
  childId,
  episode,
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
}: {
  childName: string;
  childId: string;
  episode: IllnessEpisode;
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
}) {
  const { language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const liveQueryOptions = useLiveQueryOptions(3000);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isReminderCabinetPickerOpen = searchParams.get("picker") === "cabinet";
  const [isReminderEditing, setIsReminderEditing] = useState(false);
  const [editingReminderName, setEditingReminderName] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [quickComposeSuccessMessage, setQuickComposeSuccessMessage] = useState<string | null>(null);
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
    enabled: !!familyId && !!accountId,
    ...liveQueryOptions,
  });

  const addTempMutation = useMutation({
    mutationFn: (valueCelsius: number) =>
      createTemperatureEntry({ episode_id: episode.id, value_celsius: valueCelsius }),
    onSuccess: () => {
      void trackTemperatureLogged(episode.id);
      queryClient.invalidateQueries({ queryKey: ["temperature-entries", episode.id] });
      if (quickComposeMode) setQuickComposeSuccessMessage(quickComposeMeta.success);
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: (payload: {
      household_medicine_id?: string | null;
      custom_medicine_name?: string;
      amount: string;
      reason?: string;
    }) =>
      createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: payload.household_medicine_id,
        custom_medicine_name: payload.custom_medicine_name,
        amount: payload.amount,
        reason: payload.reason,
      }),
    onSuccess: () => {
      trackMedicationAdministered("episode_detail");
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      if (quickComposeMode) setQuickComposeSuccessMessage(quickComposeMeta.success);
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: {
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      dose_amount: string;
      min_interval_minutes: number;
      max_doses_per_day?: number | null;
      weight_kg?: number | null;
      dose_mg_per_kg?: number | null;
      notes?: string | null;
    }) =>
      createEpisodeMedicationPlan({
        episode_id: episode.id,
        household_medicine_id: payload.household_medicine_id,
        custom_medicine_name: payload.custom_medicine_name,
        dose_amount: payload.dose_amount,
        min_interval_minutes: payload.min_interval_minutes,
        max_doses_per_day: payload.max_doses_per_day ?? null,
        weight_kg: payload.weight_kg ?? null,
        dose_mg_per_kg: payload.dose_mg_per_kg ?? null,
        notes: payload.notes ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      if (quickReminderCreateMode) navigate(`/children/${childId}/illness?focus=reminders`);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deleteEpisodeMedicationPlan,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] }),
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
        notes?: string | null;
      };
    }) => updateEpisodeMedicationPlan(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: () =>
      createIllnessComment({
        episode_id: episode.id,
        text: commentText.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-comments", episode.id] });
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
  const now = useNow();
  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    householdMedicines,
    language
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

  useEffect(() => {
    if (!quickComposeSuccessMessage) return;
    const timeoutId = window.setTimeout(() => {
      navigate("/illnesses/active");
    }, 700);
    return () => window.clearTimeout(timeoutId);
  }, [navigate, quickComposeSuccessMessage]);

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
              const parsed = parseFloat(tempValue);
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
      <div className="mx-auto w-full max-w-2xl">
        <ReminderListQuickView
          language={language}
          childId={childId}
          plans={medicationPlans}
          medicines={householdMedicines}
          administrations={administrations}
          onOpen={(planId) =>
            navigate(`/children/${childId}/illness?focus=reminder-detail&plan=${planId}`)
          }
          onTakeDose={(plan) =>
            addAdminMutation.mutate({
              household_medicine_id: plan.householdMedicineId,
              custom_medicine_name: plan.customMedicineName ?? undefined,
              amount: plan.doseAmount,
              reason: language === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
            })
          }
          isSubmittingAdministration={addAdminMutation.isPending}
        />
      </div>
    );
  }

  if (quickReminderDetailMode) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ReminderDetailQuickView
          language={language}
          childId={childId}
          selectedReminderItem={selectedReminderItem}
          latestWeight={latestWeight}
          isReminderCabinetPickerOpen={isReminderCabinetPickerOpen}
          isReminderEditing={isReminderEditing}
          editingReminderName={editingReminderName}
          medicines={householdMedicines}
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
          onTakeDose={(plan) =>
            addAdminMutation.mutate({
              household_medicine_id: plan.householdMedicineId,
              custom_medicine_name: plan.customMedicineName ?? undefined,
              amount: plan.doseAmount,
              reason: language === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
            })
          }
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
                notes: payload.notes,
              },
            })
          }
          onDelete={(planId) => {
            deletePlanMutation.mutate(planId, {
              onSuccess: () => navigate(`/children/${childId}/illness?focus=reminders`),
            });
          }}
        />
      </div>
    );
  }

  if (quickReminderCreateMode) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ReminderCreateQuickView
          language={language}
          childId={childId}
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
              notes: payload.notes,
            })
          }
          onCancel={() => navigate(`/children/${childId}/illness?focus=reminders`)}
        />
      </div>
    );
  }

  return (
    <EpisodeMainPanel
      language={language}
      childName={childName}
      episode={episode}
      isCloseConfirmOpen={isCloseConfirmOpen}
      setIsCloseConfirmOpen={setIsCloseConfirmOpen}
      onClose={onClose}
      manualComposerSection={<ManualComposerOverview language={language} childId={childId} />}
      reminderOverviewSection={
        <ReminderOverviewPanel
          language={language}
          childId={childId}
          episode={episode}
          medicationPlans={medicationPlans}
          reminderLead={reminderLead}
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
  );
}
