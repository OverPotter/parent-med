/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdministrationEventsByEpisodeId,
  createAdministrationEvent,
} from "@shared/api/administrationEvents";
import { fetchChild } from "@shared/api/children";
import {
  createEpisodeMedicationPlan,
  deleteEpisodeMedicationPlan,
  fetchEpisodeMedicationPlansByEpisodeId,
  updateEpisodeMedicationPlan,
} from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { createIllnessComment, fetchIllnessCommentsByEpisodeId } from "@shared/api/illnessComments";
import {
  createIllnessEpisode,
  deleteIllnessEpisode,
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodesByChildId,
  updateIllnessEpisode,
} from "@shared/api/illnessEpisodes";
import {
  fetchTemperatureEntriesByEpisodeId,
  createTemperatureEntry,
} from "@shared/api/temperatureEntries";
import { createWeightEntry, fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import {
  trackIllnessEpisodeStarted,
  trackMedicationAdministered,
  trackTemperatureLogged,
} from "@shared/analytics";
import { DateField } from "@shared/components/DateField";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { DisclosureHeader } from "@shared/components/DisclosureHeader";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type {
  AdministrationEvent,
  EpisodeMedicationPlan,
  HouseholdMedicine,
  IllnessComment,
  IllnessEpisode,
  TemperatureEntry,
  WeightEntry,
} from "@shared/types/api";
import {
  buildPlanAdministrationStats,
  buildWeightDoseHint,
  formatRelativeDateTime,
  formatIntervalForDisplay,
  getAdministrationActorLabel,
  getPrioritizedMedicationPlanItems,
  type MedicationPlanPriorityItem,
} from "../utils/medicationPlans";
import { formatDate, formatDateTime } from "@shared/utils/date";

export function ChildIllnessPage() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const [openHistoryEpisodeId, setOpenHistoryEpisodeId] = useState<string | null>(null);
  const historyOnlyView = searchParams.get("view") === "history";
  const createMode = searchParams.get("mode") === "create";
  const focusMode = searchParams.get("focus") ?? searchParams.get("compose");
  const quickComposeMode =
    focusMode === "temperature" || focusMode === "administration" || focusMode === "comment"
      ? focusMode
      : null;
  const quickTimelineMode = focusMode === "timeline";
  const quickReminderMode = focusMode === "reminders";
  const quickReminderCreateMode = focusMode === "reminder-create";
  const quickReminderDetailMode = focusMode === "reminder-detail";
  const reminderPlanId = searchParams.get("plan");
  const initialComposerMode = quickComposeMode ?? "temperature";
  const liveQueryOptions = useLiveQueryOptions(3000);

  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: activeEpisode } = useQuery({
    queryKey: ["illness-episode-active", childId],
    queryFn: () => fetchActiveIllnessEpisodeByChildId(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: familyMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const closeEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => updateIllnessEpisode(episodeId, { status: "closed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
  const createEpisodeMutation = useMutation({
    mutationFn: async (payload: {
      started_at: string;
      title?: string | null;
      medication_mode: string;
      note?: string | null;
      temperatures: Array<{ value_celsius: number }>;
      administrations: Array<{
        household_medicine_id?: string | null;
        custom_medicine_name?: string | null;
        amount: string;
      }>;
      comments: Array<{ text: string }>;
      medication_plans: Array<{
        household_medicine_id?: string | null;
        custom_medicine_name?: string | null;
        dose_amount: string;
        min_interval_minutes: number;
        max_doses_per_day?: number | null;
        weight_kg?: number | null;
        dose_mg_per_kg?: number | null;
        notes?: string | null;
      }>;
    }) => {
      const episode = await createIllnessEpisode({
        child_id: childId!,
        started_at: payload.started_at,
        title: payload.title,
        medication_mode: payload.medication_mode,
        note: payload.note,
      });

      await Promise.all([
        ...payload.temperatures.map((item) =>
          createTemperatureEntry({
            episode_id: episode.id,
            value_celsius: item.value_celsius,
          })
        ),
        ...payload.administrations.map((item) =>
          createAdministrationEvent({
            episode_id: episode.id,
            household_medicine_id: item.household_medicine_id,
            custom_medicine_name: item.custom_medicine_name,
            amount: item.amount,
          })
        ),
        ...payload.comments.map((item) =>
          createIllnessComment({
            episode_id: episode.id,
            text: item.text,
          })
        ),
        ...payload.medication_plans.map((item) =>
          createEpisodeMedicationPlan({
            episode_id: episode.id,
            household_medicine_id: item.household_medicine_id,
            custom_medicine_name: item.custom_medicine_name,
            dose_amount: item.dose_amount,
            min_interval_minutes: item.min_interval_minutes,
            max_doses_per_day: item.max_doses_per_day ?? null,
            weight_kg: item.weight_kg ?? null,
            dose_mg_per_kg: item.dose_mg_per_kg ?? null,
            notes: item.notes ?? null,
          })
        ),
      ]);

      return episode;
    },
    onSuccess: (episode) => {
      void trackIllnessEpisodeStarted(episode.id);
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      navigate("/illnesses/active");
    },
    onError: async (error) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["illness-episodes", childId] }),
        queryClient.refetchQueries({ queryKey: ["illness-episode-active", childId] }),
      ]);

      const detail =
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "";
      if (detail.includes("активный эпизод")) {
        navigate("/illnesses/active");
      }
    },
  });

  if (!childId || childLoading || !child) {
    return (
      <div>
        <p className="text-muted">Загрузка…</p>
      </div>
    );
  }

  const historyEpisodes = episodes.filter((episode) => episode.status === "closed");
  const visibleHistoryEpisodes = openHistoryEpisodeId
    ? historyEpisodes.filter((episode) => episode.id === openHistoryEpisodeId)
    : historyEpisodes;

  return (
    <div className="min-w-0 space-y-7">
      <Link to="/children" className="inline-flex text-sm text-primary hover:underline">
        ← К списку детей
      </Link>

      {((!activeEpisode && !createMode) || historyOnlyView) && (
        <section
          className={`soft-panel soft-hero relative overflow-hidden rounded-[28px] ${
            historyOnlyView ? "hidden lg:block" : ""
          }`}
        >
          <div className="relative p-4 sm:p-5">
            <div className="min-w-0">
              <h1 className="app-title text-[2rem] sm:text-[2.5rem]">{child.name}</h1>
              <p className="mt-3 text-sm text-muted lg:hidden">
                {historyOnlyView
                  ? "Завершённые наблюдения по ребёнку."
                  : createMode
                    ? "Заполните короткую карточку и начните наблюдение."
                    : "Сейчас активного наблюдения нет."}
              </p>
            </div>

            <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-4">
              {child.ageLabel ? <SummaryCard label="Возраст" value={child.ageLabel} /> : null}
              {child.birthDate ? (
                <SummaryCard label="Дата рождения" value={formatDate(child.birthDate)} />
              ) : null}
              {latestWeight ? (
                <SummaryCard label="Вес" value={formatWeightValue(latestWeight.valueKg)} />
              ) : null}
              <SummaryCard label="Эпизоды" value={String(episodes.length)} />
            </div>

            {!currentFamilyId && (
              <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
                Семья не выбрана. Сначала открой страницу «Семья».
              </div>
            )}
          </div>
        </section>
      )}

      {activeEpisode && !historyOnlyView && (
        <section>
          <EpisodeBlock
            childName={child.name}
            childId={child.id}
            episode={activeEpisode}
            onClose={() => closeEpisodeMutation.mutate(activeEpisode.id)}
            familyId={currentFamilyId}
            latestWeight={latestWeight}
            initialComposerMode={initialComposerMode}
            quickComposeMode={quickComposeMode}
            quickTimelineMode={quickTimelineMode}
            quickReminderMode={quickReminderMode}
            quickReminderCreateMode={quickReminderCreateMode}
            quickReminderDetailMode={quickReminderDetailMode}
            reminderPlanId={reminderPlanId}
          />
        </section>
      )}

      {!activeEpisode && createMode && !historyOnlyView && (
        <section className="space-y-3">
          <SectionTitle
            title="Новое наблюдение"
            subtitle="Сначала просто начните наблюдение. Температуру, лекарства и напоминания можно добавить уже внутри записи."
          />
          <EpisodeActivationCard
            childName={child.name}
            isPending={createEpisodeMutation.isPending}
            errorMessage={
              (
                createEpisodeMutation.error as {
                  response?: { data?: { detail?: string } };
                }
              )?.response?.data?.detail ?? null
            }
            onActivate={(payload) => createEpisodeMutation.mutate(payload)}
            onCancel={() => navigate("/children")}
          />
        </section>
      )}

      {!activeEpisode && !createMode && !historyOnlyView && (
        <section className="soft-empty rounded-[28px] px-5 py-8 text-sm text-muted">
          Сейчас ничего не отслеживается. Новое наблюдение можно начать из раздела «Дети».
        </section>
      )}

      {historyOnlyView && (
        <section className="space-y-3">
          <SectionTitle
            title={`История${child.name ? ` · ${child.name}` : ""}`}
            subtitle={
              openHistoryEpisodeId
                ? "Открыта одна запись."
                : historyEpisodes.length > 0
                  ? "Завершённые наблюдения по ребёнку."
                  : "Завершённых наблюдений пока нет."
            }
          />

          {openHistoryEpisodeId && (
            <div className="soft-panel-muted flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3">
              <p className="text-sm text-muted">Показана 1 запись из {historyEpisodes.length}.</p>
              <button
                type="button"
                onClick={() => setOpenHistoryEpisodeId(null)}
                className="soft-button-secondary rounded-2xl px-3 py-1.5 text-sm"
              >
                Показать всю историю
              </button>
            </div>
          )}

          {historyEpisodes.length > 0 ? (
            <ul className="grid gap-4">
              {visibleHistoryEpisodes.map((episode) => (
                <HistoryEpisodeCard
                  key={episode.id}
                  childId={childId}
                  episode={episode}
                  episodeNumber={
                    historyEpisodes.length -
                    historyEpisodes.findIndex((item) => item.id === episode.id)
                  }
                  isOpen={openHistoryEpisodeId === episode.id}
                  medicines={familyMedicines}
                  onDeleted={() => setOpenHistoryEpisodeId(null)}
                  onToggle={() =>
                    setOpenHistoryEpisodeId((current) =>
                      current === episode.id ? null : episode.id
                    )
                  }
                />
              ))}
            </ul>
          ) : (
            <div className="soft-empty rounded-[28px] px-5 py-8 text-sm text-muted">
              История пока пустая.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function InfoPill({ label }: { label: string }) {
  return <span className="soft-pill rounded-full px-3 py-1 text-sm">{label}</span>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel-muted rounded-[22px] px-4 py-3">
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="app-card-title text-[1.08rem] sm:text-xl">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p>
    </div>
  );
}

function HistoryEpisodeCard({
  childId,
  episode,
  episodeNumber,
  isOpen,
  medicines,
  onDeleted,
  onToggle,
}: {
  childId: string;
  episode: IllnessEpisode;
  episodeNumber: number;
  isOpen: boolean;
  medicines: HouseholdMedicine[];
  onDeleted: () => void;
  onToggle: () => void;
}) {
  const queryClient = useQueryClient();
  const liveQueryOptions = useLiveQueryOptions(10000);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { data: temperatureEntries = [] } = useQuery({
    queryKey: ["temperature-entries", episode.id],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episode.id),
    enabled: isOpen,
    ...liveQueryOptions,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episode.id],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
    enabled: isOpen,
    ...liveQueryOptions,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["illness-comments", episode.id],
    queryFn: () => fetchIllnessCommentsByEpisodeId(episode.id),
    enabled: isOpen,
    ...liveQueryOptions,
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: () => deleteIllnessEpisode(episode.id),
    onSuccess: () => {
      onDeleted();
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
    },
  });

  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    medicines
  );

  return (
    <li
      className={`rounded-[28px] px-5 py-4 transition-colors sm:px-6 sm:py-5 ${
        isOpen ? "soft-panel soft-hero" : "soft-card"
      }`}
    >
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={`Удалить эпизод ${episodeNumber}`}
        description="Запись будет полностью удалена из истории ребёнка без возможности восстановления."
        confirmLabel={deleteEpisodeMutation.isPending ? "Удаляем…" : "Удалить из истории"}
        confirmTone="danger"
        isPending={deleteEpisodeMutation.isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() =>
          deleteEpisodeMutation.mutate(undefined, {
            onSuccess: () => setIsDeleteConfirmOpen(false),
          })
        }
      />
      <DisclosureHeader isOpen={isOpen} onToggle={onToggle}>
        <>
          <p className="text-xs tracking-[0.08em] text-muted">
            Эпизод {episodeNumber} · {formatEpisodePeriod(episode.startedAt, episode.closedAt)}
          </p>
          <p className="mt-2 text-base font-medium text-[color:color-mix(in_srgb,var(--color-primary)_62%,var(--color-foreground))]">
            {episode.title?.trim() || "Без названия"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {episode.closedAt
              ? `Закрыт ${formatDateTime(episode.closedAt)}`
              : "Дата закрытия не указана"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            {episode.note?.trim() || "Без описания"}
          </p>
        </>
      </DisclosureHeader>

      {isOpen && (
        <div className="mt-6 space-y-6 border-t border-border/70 pt-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Описание</h3>
              <p className="mt-1 text-sm text-muted">
                {formatEntrySummary(
                  temperatureEntries.length,
                  administrations.length,
                  comments.length
                )}
              </p>
            </div>

            <div className="soft-panel-muted mt-4 rounded-[22px] px-4 py-4">
              <p className="text-sm leading-6 text-muted">
                {episode.note?.trim() || "Без описания"}
              </p>
            </div>
          </section>

          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Что уже записано</h3>

            {timelineItems.length > 0 ? (
              <div className="mt-4">
                <EpisodeTimelineList items={timelineItems} />
              </div>
            ) : (
              <div className="soft-empty mt-4 rounded-[22px] px-4 py-6 text-sm text-muted">
                Для этого наблюдения ещё нет температур и отмеченных приёмов.
              </div>
            )}
          </section>

          <section className="border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Действия</h3>
                <p className="mt-1 text-sm text-muted">Запись можно удалить из истории.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={deleteEpisodeMutation.isPending}
                className="soft-button-danger inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
              >
                {deleteEpisodeMutation.isPending ? "Удаляем…" : "Удалить из истории"}
              </button>
            </div>
          </section>
        </div>
      )}
    </li>
  );
}

function EpisodeBlock({
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const liveQueryOptions = useLiveQueryOptions(3000);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const isActive = episode.status === "active";
  const [commentText, setCommentText] = useState("");
  const [quickComposeSuccessMessage, setQuickComposeSuccessMessage] = useState<string | null>(null);
  const composerMode = quickComposeMode ?? initialComposerMode;
  const quickComposeMeta =
    composerMode === "temperature"
      ? {
          title: "Запись температуры",
          subtitle: "Сохраните новый замер.",
          success: "Температура сохранена",
        }
      : composerMode === "administration"
        ? {
            title: "Запись приёма",
            subtitle: "Сохраните приём.",
            success: "Приём сохранён",
          }
        : {
            title: "Заметка",
            subtitle: "Добавьте заметку о состоянии.",
            success: "Заметка сохранена",
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
      if (quickComposeMode) {
        setQuickComposeSuccessMessage(quickComposeMeta.success);
      }
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
      if (quickComposeMode) {
        setQuickComposeSuccessMessage(quickComposeMeta.success);
      }
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
      if (quickReminderCreateMode) {
        navigate(`/children/${childId}/illness?focus=reminders`);
      }
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
      if (quickComposeMode) {
        setQuickComposeSuccessMessage(quickComposeMeta.success);
      }
    },
  });

  const [tempValue, setTempValue] = useState("");
  const [adminCustomMedicineName, setAdminCustomMedicineName] = useState("");
  const [adminAmount, setAdminAmount] = useState("");
  const now = useNow();
  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    householdMedicines
  );
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
    if (!quickComposeSuccessMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      navigate("/illnesses/active");
    }, 700);
    return () => window.clearTimeout(timeoutId);
  }, [navigate, quickComposeSuccessMessage]);
  const composerContent = (
    <div className="mt-4">
      {composerMode === "temperature" && (
        <TemperatureForm
          value={tempValue}
          onChange={setTempValue}
          onSubmit={() => {
            const parsed = parseFloat(tempValue);
            if (Number.isNaN(parsed)) return;
            addTempMutation.mutate(parsed);
            setTempValue("");
          }}
          isPending={addTempMutation.isPending}
        />
      )}

      {composerMode === "administration" && (
        <>
          <AdministrationForm
            customMedicineName={adminCustomMedicineName}
            amount={adminAmount}
            onCustomMedicineNameChange={setAdminCustomMedicineName}
            onAmountChange={setAdminAmount}
            onSubmit={() => {
              if (!adminCustomMedicineName.trim()) {
                return;
              }
              addAdminMutation.mutate({
                custom_medicine_name: adminCustomMedicineName.trim(),
                amount: adminAmount.trim(),
              });
              setAdminCustomMedicineName("");
              setAdminAmount("");
            }}
            isPending={addAdminMutation.isPending}
          />
        </>
      )}
      {composerMode === "administration" && addAdminMutation.isError && (
        <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
          {(addAdminMutation.error as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ?? "Ошибка записи. Проверь срок годности и срок после вскрытия."}
        </p>
      )}

      {composerMode === "comment" && (
        <div className="grid gap-3">
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Например: к вечеру бодрее, после сна снова температура."
            className="soft-input w-full px-4"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!commentText.trim()) return;
                addCommentMutation.mutate();
              }}
              disabled={addCommentMutation.isPending || !commentText.trim()}
              className="soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
            >
              {addCommentMutation.isPending ? "Сохраняем…" : "Добавить комментарий"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
  const manualComposerSection = quickComposeMode ? (
    <section>{composerContent}</section>
  ) : (
    <section className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_24%,transparent)] px-4 py-5 sm:px-5 sm:py-6">
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-foreground">Быстрые записи</h4>
        <p className="mt-1 text-sm text-muted">Температура, приёмы и заметки.</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          to={`/children/${childId}/illness?focus=temperature`}
          className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-center text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
        >
          Записать температуру
        </Link>
        <Link
          to={`/children/${childId}/illness?focus=administration`}
          className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-center text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
        >
          Записать приём
        </Link>
        <Link
          to={`/children/${childId}/illness?focus=comment`}
          className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-center text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
        >
          Добавить заметку
        </Link>
      </div>
    </section>
  );
  const timelineSection = quickTimelineMode ? (
    <section className="space-y-4">
      {timelineItems.length > 0 ? (
        <EpisodeTimelineList items={timelineItems} />
      ) : (
        <div className="soft-empty rounded-[22px] px-4 py-6 text-sm text-muted">
          Пока записей нет.
        </div>
      )}
    </section>
  ) : (
    <section className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_24%,transparent)] px-4 py-5 sm:px-5 sm:py-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-foreground">Лента наблюдения</h4>
          <p className="mt-1 text-sm text-muted">Все записи по времени.</p>
        </div>
        <Link
          to={`/children/${childId}/illness?focus=timeline`}
          className="soft-button-secondary inline-flex min-h-[2.85rem] w-full self-start items-center justify-center px-3.5 text-center text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:w-auto sm:px-4 sm:text-[0.89rem]"
        >
          Открыть
        </Link>
      </div>

      {timelineItems.length > 0 ? (
        <div className="mt-4">
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            Записей: {timelineItems.length}
          </span>
        </div>
      ) : null}
    </section>
  );
  const reminderOverviewSection =
    episode.medicationMode === "guided" ? (
      <section className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_28%,transparent)] px-4 py-5 sm:px-5 sm:py-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-foreground">Напоминания о приёме</h4>
            <p className="mt-1 text-sm text-muted">Приёмы по интервалу и статус на сейчас.</p>
          </div>
          <Link
            to={
              medicationPlans.length > 0
                ? `/children/${childId}/illness?focus=reminders`
                : `/children/${childId}/illness?focus=reminder-create`
            }
            className="soft-button-secondary inline-flex min-h-[2.85rem] w-full self-start items-center justify-center px-3.5 text-center text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:w-auto sm:px-4 sm:text-[0.89rem]"
          >
            {medicationPlans.length > 0 ? "Открыть" : "Добавить"}
          </Link>
        </div>

        {reminderLead ? (
          <div className="mt-4">
            <span className="soft-pill-success rounded-full px-3 py-1.5 text-xs">
              Активных напоминаний: {medicationPlans.length}
            </span>
          </div>
        ) : null}
      </section>
    ) : null;

  if (quickComposeMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">{quickComposeMeta.title}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{quickComposeMeta.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {quickComposeSuccessMessage && (
            <div className="soft-note-info rounded-2xl px-4 py-3 text-sm">
              {quickComposeSuccessMessage}
            </div>
          )}
          {manualComposerSection}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/illnesses/active"
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              К активным болезням
            </Link>
            <Link
              to={`/children/${childId}/illness?focus=timeline`}
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              К ленте
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickTimelineMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">Лента наблюдения</span>
            </p>
            <p className="mt-1 text-sm text-muted">Все записи по времени.</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {timelineSection}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/illnesses/active"
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              К активным болезням
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickReminderMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">График приёма</span>
            </p>
            <p className="mt-1 text-sm text-muted">Активные напоминания по приёмам.</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {medicationPlans.length > 0 ? (
            <MedicationPlanList
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
                  reason: "Отмечено по напоминанию",
                })
              }
              isSubmittingAdministration={addAdminMutation.isPending}
            />
          ) : (
            <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
              Напоминаний пока нет.
            </div>
          )}

          {(
            (createPlanMutation.error ?? updatePlanMutation.error) as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {
                (
                  (createPlanMutation.error ?? updatePlanMutation.error) as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail
              }
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              to="/illnesses/active"
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              К активным болезням
            </Link>
            <Link
              to={`/children/${childId}/illness?focus=reminder-create`}
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              Добавить напоминание
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickReminderDetailMode) {
    if (!selectedReminderItem) {
      return (
        <div className="soft-panel rounded-[30px]">
          <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
              Напоминание не найдено.
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/children/${childId}/illness?focus=reminders`}
                className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
              >
                К графику приёма
              </Link>
              <Link
                to="/illnesses/active"
                className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
              >
                К активным болезням
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">Напоминание о приёме</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <MedicationPlanDetail
            item={selectedReminderItem}
            childId={childId}
            latestWeight={latestWeight}
            isSubmittingAdministration={addAdminMutation.isPending}
            isUpdating={updatePlanMutation.isPending}
            isDeleting={deletePlanMutation.isPending}
            medicines={householdMedicines}
            onTakeDose={(plan) =>
              addAdminMutation.mutate({
                household_medicine_id: plan.householdMedicineId,
                custom_medicine_name: plan.customMedicineName ?? undefined,
                amount: plan.doseAmount,
                reason: "Отмечено по напоминанию",
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
          {(
            (updatePlanMutation.error ?? deletePlanMutation.error) as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {
                (
                  (updatePlanMutation.error ?? deletePlanMutation.error) as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail
              }
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              К графику приёма
            </Link>
            <Link
              to="/illnesses/active"
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              К активным болезням
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickReminderCreateMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">Новое напоминание</span>
            </p>
            <p className="mt-1 text-sm text-muted">Настройте интервал и сохраните.</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <MedicationPlanComposer
            childId={childId}
            medicines={householdMedicines.filter(
              (medicine) =>
                medicine.status !== "expired" && medicine.status !== "expired_after_opening"
            )}
            latestWeight={latestWeight}
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
            submitLabel="Сохранить напоминание"
            isPending={createPlanMutation.isPending}
            onCancel={() => navigate(`/children/${childId}/illness?focus=reminders`)}
          />
          {(
            createPlanMutation.error as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {
                (
                  createPlanMutation.error as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail
              }
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              К напоминаниям
            </Link>
            <Link
              to="/illnesses/active"
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              К активным болезням
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="soft-panel rounded-[30px]">
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        title={`Закрыть наблюдение · ${childName}`}
        description="Текущее наблюдение будет завершено и попадёт в историю. При необходимости новое наблюдение можно будет начать заново."
        confirmLabel="Закрыть наблюдение"
        confirmTone="danger"
        onCancel={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => {
          onClose();
          setIsCloseConfirmOpen(false);
        }}
      />
      <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
        {isActive ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {childName}
              </p>
              {episode.title?.trim() ? (
                <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                  {episode.title.trim()}
                </h3>
              ) : null}
              <p className="mt-1 text-sm text-muted">
                Быстрые записи, напоминания и лента наблюдения.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCloseConfirmOpen(true)}
              className="soft-button-danger hidden min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] sm:inline-flex"
            >
              Закрыть наблюдение
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {childName}
            </p>
            {episode.title?.trim() ? (
              <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                {episode.title.trim()}
              </h3>
            ) : null}
            <p className="mt-1 text-sm text-muted">
              Быстрые записи, напоминания и лента наблюдения.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-7 px-5 py-5 sm:px-6 sm:py-6">
        <section>{manualComposerSection}</section>

        {reminderOverviewSection}
        {timelineSection}

        {isActive && (
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setIsCloseConfirmOpen(true)}
              className="soft-button-danger inline-flex min-h-[2.95rem] w-full items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em]"
            >
              Закрыть наблюдение
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EpisodeActivationCard({
  childName,
  isPending,
  errorMessage,
  onActivate,
  onCancel,
}: {
  childName: string;
  isPending: boolean;
  errorMessage: string | null;
  onActivate: (payload: {
    started_at: string;
    title?: string | null;
    medication_mode: string;
    note?: string | null;
    temperatures: Array<{ value_celsius: number }>;
    administrations: Array<{
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      amount: string;
    }>;
    comments: Array<{ text: string }>;
    medication_plans: Array<{
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      dose_amount: string;
      min_interval_minutes: number;
      max_doses_per_day?: number | null;
      weight_kg?: number | null;
      dose_mg_per_kg?: number | null;
      notes?: string | null;
    }>;
  }) => void;
  onCancel: () => void;
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");

  return (
    <div className="soft-panel rounded-[30px]">
      <div className="soft-hero rounded-t-[30px] px-5 py-6 sm:px-6 sm:py-7">
        <p className="text-xs tracking-[0.1em] text-muted">Старт наблюдения</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{childName}</h3>
        <p className="mt-3 text-sm text-muted">
          Создайте запись о болезни, а дальше просто отмечайте температуру, приёмы и важные
          изменения.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        {errorMessage && (
          <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{errorMessage}</div>
        )}
        <label className="block space-y-1.5">
          <span className="soft-field-label">Дата начала</span>
          <DateField
            value={startedAt}
            onChange={setStartedAt}
            max={new Date().toISOString().slice(0, 10)}
            className=""
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">Что случилось?</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: температура и кашель"
            className="soft-input w-full px-4"
          />
          <p className="mt-2 text-xs text-muted">
            Необязательно. Нужен только короткий ориентир, чтобы потом быстрее найти запись.
          </p>
        </label>
        <div className="soft-panel-muted rounded-[24px] p-4 sm:p-5">
          <h4 className="text-base font-semibold text-foreground">Что будет дальше</h4>
          <p className="mt-2 text-sm leading-6 text-muted">
            Сразу после запуска откроется экран болезни. Там можно будет отдельно:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">Записать температуру</span>
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">Отметить приём</span>
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">Добавить комментарий</span>
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">Добавить напоминание</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onActivate({
                started_at: startedAt,
                title: title.trim() ? title.trim() : null,
                medication_mode: "guided",
                note: null,
                temperatures: [],
                administrations: [],
                comments: [],
                medication_plans: [],
              })
            }
            disabled={isPending || !startedAt}
            className="soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
          >
            {isPending ? "Запускаем…" : "Начать наблюдение"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineHint({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const showTouchHint = () => {
    setIsOpen(true);
    window.setTimeout(() => {
      setIsOpen(false);
    }, 1400);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        title={text}
        aria-label={text}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onTouchStart={(event) => {
          event.preventDefault();
          showTouchHint();
        }}
        className="soft-pill-warning inline-flex h-5 w-5 items-center justify-center rounded-full px-0 text-[11px] font-semibold leading-none"
      >
        !
      </button>
      {isOpen && (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-border/80 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs font-normal leading-5 text-foreground shadow-lg shadow-black/10">
          {text}
        </span>
      )}
    </span>
  );
}

function TemperatureForm({
  value,
  onChange,
  onSubmit,
  isPending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,168px)_auto] sm:items-end">
      <label className="block max-w-[11rem] space-y-1.5">
        <span className="soft-field-label">Температура</span>
        <input
          type="number"
          step={0.1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="36.6"
          className="soft-input w-full px-4"
        />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !value}
        className="soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:w-auto sm:px-5 sm:text-[0.92rem]"
      >
        {isPending ? "Сохраняем…" : "Добавить"}
      </button>
    </div>
  );
}

function CabinetMedicinePicker({
  medicines,
  value,
  onChange,
  label = "Упаковка",
}: {
  medicines: HouseholdMedicine[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedMedicine = medicines.find((medicine) => medicine.id === value) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMedicines = normalizedQuery
    ? medicines.filter((medicine) =>
        [
          medicine.medicineName,
          medicine.medicineConcentration ?? "",
          medicine.medicineForm ?? "",
          medicine.statusLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : medicines;

  const selectMedicine = (medicineId: string) => {
    onChange(medicineId);
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!value) {
      return;
    }
    setIsOpen(false);
    setQuery("");
  }, [value]);

  return (
    <>
      <div className="block min-w-0">
        <span className="soft-field-label">{label}</span>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            className="soft-button-secondary flex min-h-[2.95rem] w-full items-center justify-between gap-3 px-4 text-left text-[0.88rem] tracking-[-0.025em] sm:min-h-[3.1rem] sm:text-[0.92rem]"
          >
            <span className="min-w-0">
              {selectedMedicine ? (
                <>
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {selectedMedicine.medicineName}
                    {selectedMedicine.medicineConcentration
                      ? ` · ${selectedMedicine.medicineConcentration}`
                      : ""}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {selectedMedicine.statusLabel} · до {formatDate(selectedMedicine.expiryDate)}
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-sm font-semibold text-foreground">
                    Выбрать из аптечки
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {medicines.length} {formatMedicineCountLabel(medicines.length)}
                  </span>
                </>
              )}
            </span>
            <span className="soft-choice-check" aria-hidden="true">
              Выбрать
            </span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-end bg-black/28 p-3 sm:items-center sm:justify-center sm:p-6">
          <button
            type="button"
            aria-label="Закрыть выбор лекарства"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0"
          />
          <div className="soft-panel relative z-10 w-full max-w-xl rounded-[28px]">
            <div className="soft-hero rounded-t-[28px] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.1em] text-muted">Аптечка</p>
                  <h4 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    Выбрать препарат
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
                >
                  Закрыть
                </button>
              </div>
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-6 sm:py-6">
              {medicines.length > 6 && (
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск по аптечке"
                  className="soft-input w-full px-4"
                />
              )}
              <div className="soft-choice-list max-h-[min(55vh,28rem)] overflow-y-auto pr-1">
                {filteredMedicines.map((medicine) => {
                  const isActive = medicine.id === value;

                  return (
                    <button
                      key={medicine.id}
                      type="button"
                      onClick={() => selectMedicine(medicine.id)}
                      aria-pressed={isActive}
                      className={[
                        "soft-choice-row text-left",
                        isActive ? "soft-choice-row-active" : "",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {medicine.medicineName}
                          {medicine.medicineConcentration
                            ? ` · ${medicine.medicineConcentration}`
                            : ""}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {medicine.statusLabel} · до {formatDate(medicine.expiryDate)}
                        </span>
                      </span>
                      <span className="soft-choice-check" aria-hidden="true">
                        {isActive ? "Выбрано" : "Выбрать"}
                      </span>
                    </button>
                  );
                })}
                {filteredMedicines.length === 0 && (
                  <div className="rounded-2xl bg-[color:color-mix(in_srgb,var(--color-surface-soft)_92%,transparent)] px-4 py-3 text-sm text-muted">
                    Ничего не найдено.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatMedicineCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "препарат";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "препарата";
  }
  return "препаратов";
}

function AdministrationForm({
  customMedicineName,
  amount,
  onCustomMedicineNameChange,
  onAmountChange,
  onSubmit,
  isPending,
}: {
  customMedicineName: string;
  amount: string;
  onCustomMedicineNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_auto] md:items-end">
        <label className="block min-w-0 space-y-1.5">
          <span className="soft-field-label">Что дали</span>
          <input
            type="text"
            value={customMedicineName}
            onChange={(e) => onCustomMedicineNameChange(e.target.value)}
            placeholder="Например: Уголь"
            className="soft-input w-full px-4"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="soft-field-label">Доза, если нужно</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Например: 5 мл или 1 таб."
            className="soft-input w-full px-4"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !customMedicineName.trim()}
            className="soft-button-primary inline-flex min-h-[2.95rem] w-full items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
          >
            {isPending ? "Сохраняем…" : "Отметить приём"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted">Дозу можно не указывать для быстрой записи.</p>
    </div>
  );
}

type MedicationPlanPayload = {
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay: number | null;
  weightKg: number | null;
  doseMgPerKg: number | null;
  notes: string | null;
};

function intervalMinutesToInputValue(intervalMinutes: number, unit: "hours" | "minutes") {
  if (unit === "minutes") {
    return String(intervalMinutes);
  }
  const hours = intervalMinutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

function parseIntervalInputToMinutes(value: string, unit: "hours" | "minutes"): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return unit === "minutes" ? Math.round(parsed) : Math.round(parsed * 60);
}

function MedicationPlanComposer({
  childId,
  medicines,
  latestWeight,
  onSubmit,
  submitLabel,
  isPending,
  initialValue,
  onCancel,
}: {
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  onSubmit: (payload: MedicationPlanPayload) => void;
  submitLabel: string;
  isPending: boolean;
  initialValue?: MedicationPlanPayload | null;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const defaultPlanMode: "cabinet" | "manual" = initialValue?.householdMedicineId
    ? "cabinet"
    : medicines.length > 0
      ? "cabinet"
      : "manual";
  const hasAdvancedInitialValue = Boolean(
    initialValue?.maxDosesPerDay || initialValue?.weightKg || initialValue?.doseMgPerKg
  );
  const [planMode, setPlanMode] = useState<"cabinet" | "manual">(defaultPlanMode);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(hasAdvancedInitialValue);
  const [selectedMedicineId, setSelectedMedicineId] = useState(
    initialValue?.householdMedicineId ?? ""
  );
  const [customMedicineName, setCustomMedicineName] = useState(
    initialValue?.customMedicineName ?? ""
  );
  const [doseAmount, setDoseAmount] = useState(initialValue?.doseAmount ?? "");
  const [minIntervalInput, setMinIntervalInput] = useState(
    initialValue
      ? intervalMinutesToInputValue(initialValue.minIntervalMinutes, intervalUnit)
      : intervalUnit === "minutes"
        ? "180"
        : "3"
  );
  const [maxDosesPerDay, setMaxDosesPerDay] = useState(
    initialValue?.maxDosesPerDay ? String(initialValue.maxDosesPerDay) : ""
  );
  const [weightKg, setWeightKg] = useState(
    initialValue?.weightKg
      ? String(initialValue.weightKg)
      : latestWeight
        ? String(latestWeight.valueKg)
        : ""
  );
  const [doseMgPerKg, setDoseMgPerKg] = useState(
    initialValue?.doseMgPerKg ? String(initialValue.doseMgPerKg) : ""
  );
  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId) ?? null;
  const parsedWeightKg = parseNullableNumber(weightKg);
  const weightHint = buildWeightDoseHint(
    selectedMedicine,
    parsedWeightKg,
    parseNullableNumber(doseMgPerKg)
  );
  const hasDoseUnitHint = doseAmount.trim().length > 0 && !/[A-Za-zА-Яа-я]/.test(doseAmount);
  const hasInvalidDose = doseAmount.trim().length > 0 && hasDoseUnitHint;
  const parsedIntervalMinutes = parseIntervalInputToMinutes(minIntervalInput, intervalUnit);
  const latestWeightValue = latestWeight?.valueKg ?? null;
  const shouldOfferWeightSync =
    parsedWeightKg !== null &&
    (latestWeightValue === null || Math.abs(parsedWeightKg - latestWeightValue) >= 0.1);

  const syncWeightMutation = useMutation({
    mutationFn: (valueKg: number) =>
      createWeightEntry({
        child_id: childId,
        value_kg: valueKg,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", childId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="min-w-0">
          {planMode === "cabinet" ? (
            <div className="space-y-2">
              <CabinetMedicinePicker
                medicines={medicines}
                value={selectedMedicineId}
                onChange={setSelectedMedicineId}
                label="Лекарство"
              />
              {medicines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPlanMode("manual")}
                  className="text-sm font-medium text-muted transition hover:text-foreground"
                >
                  Нет в аптечке? Вписать вручную
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block min-w-0 space-y-1.5">
                <span className="soft-field-label">Лекарство</span>
                <input
                  type="text"
                  value={customMedicineName}
                  onChange={(event) => setCustomMedicineName(event.target.value)}
                  placeholder="Например: Ибуклин"
                  className="soft-input w-full px-4"
                />
              </label>
              {medicines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPlanMode("cabinet")}
                  className="text-sm font-medium text-muted transition hover:text-foreground"
                >
                  Выбрать из аптечки
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block space-y-1.5">
            <span className="soft-field-label">Разовая доза, если нужна</span>
            <input
              type="text"
              value={doseAmount}
              onChange={(e) => setDoseAmount(e.target.value)}
              placeholder="Например: 10 мл или 1 таб."
              className="soft-input w-full px-4"
            />
            {hasDoseUnitHint && (
              <p className="mt-2 text-xs text-muted">
                Лучше добавить единицу: мл, таб., кап. и т.д.
              </p>
            )}
            {hasInvalidDose && (
              <p className="soft-text-danger mt-2 text-xs">
                Укажи единицу дозы: мл, таб., мг, кап. и т.д.
              </p>
            )}
          </label>
        </div>

        <div>
          <label className="block space-y-1.5">
            <span className="soft-field-label">
              Интервал напоминания, {intervalUnit === "minutes" ? "минут" : "часов"}
            </span>
            <input
              type="number"
              min="1"
              max={intervalUnit === "minutes" ? "1440" : "24"}
              step={intervalUnit === "minutes" ? "1" : "0.5"}
              value={minIntervalInput}
              onChange={(e) => setMinIntervalInput(e.target.value)}
              className="soft-input w-full px-4"
            />
          </label>
        </div>
      </div>

      <div className="mt-3">
        <div className="border-t border-border/60 pt-4">
          <DisclosureHeader
            isOpen={isAdvancedOpen}
            onToggle={() => setIsAdvancedOpen((current) => !current)}
            desktopClosedLabel="Дополнительно"
            desktopOpenLabel="Скрыть"
            mobileClosedLabel="Доп."
            mobileOpenLabel="Скрыть"
          >
            <div>
              <h5 className="text-sm font-semibold text-foreground">Дополнительные настройки</h5>
              <p className="mt-1 text-sm text-muted">
                Нужны не всегда: суточный лимит и расчёт по весу можно заполнить позже.
              </p>
            </div>
          </DisclosureHeader>

          {isAdvancedOpen && (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              <div>
                <label className="block space-y-1.5">
                  <span className="soft-field-label">Максимум в сутки</span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={maxDosesPerDay}
                    onChange={(e) => setMaxDosesPerDay(e.target.value)}
                    placeholder="Необязательно"
                    className="soft-input w-full px-4"
                  />
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-2 soft-field-label">
                    Вес ребёнка, кг
                    <InlineHint text="Нужно только для расчёта по весу. Если разовая доза уже известна, это поле можно не заполнять." />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder={latestWeight ? String(latestWeight.valueKg) : "Необязательно"}
                    className="soft-input w-full px-4"
                  />
                  {latestWeight && (
                    <p className="mt-2 text-xs text-muted">
                      Последний вес: {latestWeight.valueKg} кг от{" "}
                      {formatDate(latestWeight.measuredAt)}
                    </p>
                  )}
                  {shouldOfferWeightSync && (
                    <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">
                      <p>
                        В плане указан вес {parsedWeightKg} кг. Обновить его и в карточке ребёнка?
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (parsedWeightKg === null) {
                              return;
                            }
                            syncWeightMutation.mutate(parsedWeightKg);
                          }}
                          disabled={syncWeightMutation.isPending}
                          className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
                        >
                          {syncWeightMutation.isPending ? "Сохраняем вес…" : "Обновить вес ребёнка"}
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="xl:col-span-2">
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-2 soft-field-label">
                    Расчёт, мг/кг
                    <InlineHint text="Используй это поле, если дозировку знают как мг на кг веса. Это только подсказка и не заменяет вручную указанную разовую дозу." />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={doseMgPerKg}
                    onChange={(e) => setDoseMgPerKg(e.target.value)}
                    placeholder="Необязательно"
                    className="soft-input w-full px-4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {weightHint && (
        <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">{weightHint}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (
              parsedIntervalMinutes === null ||
              hasInvalidDose ||
              (planMode === "cabinet" ? !selectedMedicineId : !customMedicineName.trim())
            ) {
              return;
            }

            onSubmit({
              householdMedicineId: planMode === "cabinet" ? selectedMedicineId : null,
              customMedicineName: planMode === "manual" ? customMedicineName.trim() : null,
              doseAmount: doseAmount.trim(),
              minIntervalMinutes: parsedIntervalMinutes,
              maxDosesPerDay: parseNullableInteger(maxDosesPerDay),
              weightKg: parseNullableNumber(weightKg),
              doseMgPerKg: parseNullableNumber(doseMgPerKg),
              notes: null,
            });

            if (!initialValue) {
              setPlanMode("cabinet");
              setSelectedMedicineId("");
              setCustomMedicineName("");
              setDoseAmount("");
              setMinIntervalInput(intervalUnit === "minutes" ? "180" : "3");
              setMaxDosesPerDay("");
              setDoseMgPerKg("");
            }
            onCancel?.();
          }}
          disabled={
            isPending ||
            (planMode === "cabinet" ? !selectedMedicineId : !customMedicineName.trim()) ||
            !minIntervalInput ||
            hasInvalidDose ||
            parsedIntervalMinutes === null
          }
          className="soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
        >
          {isPending ? "Сохраняем…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}

function MedicationPlanList({
  plans,
  medicines,
  administrations,
  onOpen,
  onTakeDose,
  isSubmittingAdministration = false,
}: {
  plans: EpisodeMedicationPlan[];
  medicines: HouseholdMedicine[];
  administrations?: AdministrationEvent[];
  onOpen: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration?: boolean;
}) {
  const now = useNow();
  const currentTime = new Date(now);
  const prioritizedPlans = administrations
    ? getPrioritizedMedicationPlanItems(plans, administrations, medicines, currentTime)
    : plans.map((plan) => ({
        plan,
        medicine: medicines.find((item) => item.id === plan.householdMedicineId) ?? null,
        stats: buildPlanAdministrationStats(plan, [], currentTime),
        isUnavailable: false,
      }));

  return (
    <div className="grid gap-3">
      {prioritizedPlans.map(({ plan, medicine, stats, isUnavailable }) => {
        const planName = plan.customMedicineName ?? medicine?.medicineName ?? "Лекарство";
        const nextDoseLabel = isUnavailable
          ? "Упаковка сейчас недоступна"
          : stats?.blockedByDailyLimit
            ? `Сегодня ${planName.toLowerCase()}: лимит приёмов уже достигнут`
            : stats?.nextAllowedAt
              ? stats.nextAllowedAt <= currentTime
                ? "Следующий приём: можно сейчас"
                : `Следующий приём: ${formatRelativeDateTime(stats.nextAllowedAt, currentTime)}`
              : "Следующий приём: можно сейчас";
        const nextDoseToneClass = isUnavailable
          ? "soft-pill-danger"
          : stats?.blockedByDailyLimit
            ? "soft-pill-danger"
            : stats?.nextAllowedAt
              ? stats.nextAllowedAt <= currentTime
                ? "soft-pill-success"
                : "soft-pill-warning"
              : "soft-pill-info";

        return (
          <article
            key={plan.id}
            className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_24%,transparent)] px-4 py-4"
          >
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">{planName}</p>
                  <span className={`${nextDoseToneClass} rounded-full px-2.5 py-1 text-[11px]`}>
                    {stats?.nextAllowedAt &&
                    stats.nextAllowedAt <= currentTime &&
                    !stats.blockedByDailyLimit &&
                    !isUnavailable
                      ? "Сейчас"
                      : isUnavailable
                        ? "Недоступно"
                        : stats?.blockedByDailyLimit
                          ? "Лимит"
                          : "По графику"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{nextDoseLabel}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {plan.doseAmount ? <span>Доза: {plan.doseAmount}</span> : null}
                  {plan.maxDosesPerDay ? (
                    <span>
                      Сегодня отмечено: {stats?.todayCount ?? 0} из {plan.maxDosesPerDay}
                    </span>
                  ) : (stats?.todayCount ?? 0) > 0 ? (
                    <span>Сегодня отмечено: {stats?.todayCount ?? 0}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {onTakeDose && (
                  <button
                    type="button"
                    onClick={() => onTakeDose(plan)}
                    disabled={isSubmittingAdministration || !!stats?.isBlocked || isUnavailable}
                    className={`inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] transition disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem] ${
                      isUnavailable || stats?.isBlocked
                        ? "soft-button-secondary text-muted"
                        : "soft-button-primary"
                    }`}
                  >
                    {isSubmittingAdministration
                      ? "Отмечаем…"
                      : isUnavailable
                        ? "Недоступно"
                        : stats?.isBlocked
                          ? "Пока рано"
                          : "Отметить"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpen(plan.id)}
                  className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
                >
                  Открыть
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MedicationPlanDetail({
  item,
  childId,
  medicines,
  latestWeight,
  onUpdate,
  onDelete,
  onTakeDose,
  isSubmittingAdministration = false,
  isUpdating = false,
  isDeleting = false,
}: {
  item: MedicationPlanPriorityItem<EpisodeMedicationPlan>;
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  onUpdate: (planId: string, payload: MedicationPlanPayload) => void;
  onDelete: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const { plan, medicine, stats, isUnavailable } = item;
  const planName = plan.customMedicineName ?? medicine?.medicineName ?? "Лекарство";
  const doseBadge = plan.doseAmount?.trim() ?? "";
  const weightHint = buildWeightDoseHint(medicine, plan.weightKg, plan.doseMgPerKg);
  const editableMedicines = Array.from(
    new Map(
      medicines
        .filter(
          (entry) =>
            entry.id === plan.householdMedicineId ||
            (entry.status !== "expired" && entry.status !== "expired_after_opening")
        )
        .map((entry) => [entry.id, entry])
    ).values()
  );

  if (isEditing) {
    return (
      <section className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-foreground">{planName}</h4>
          <p className="mt-1 text-sm text-muted">Измените интервал и параметры напоминания.</p>
        </div>
        <MedicationPlanComposer
          key={plan.id}
          childId={childId}
          medicines={editableMedicines}
          latestWeight={latestWeight}
          initialValue={{
            householdMedicineId: plan.householdMedicineId,
            customMedicineName: plan.customMedicineName,
            doseAmount: plan.doseAmount,
            minIntervalMinutes: plan.minIntervalMinutes,
            maxDosesPerDay: plan.maxDosesPerDay,
            weightKg: plan.weightKg,
            doseMgPerKg: plan.doseMgPerKg,
            notes: plan.notes,
          }}
          onSubmit={(payload) => {
            onUpdate(plan.id, payload);
            setIsEditing(false);
          }}
          submitLabel="Сохранить напоминание"
          isPending={isUpdating}
          onCancel={() => setIsEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={`Удалить напоминание · ${planName}`}
        description="Напоминание будет удалено из текущего наблюдения. История уже отмеченных приёмов останется."
        confirmLabel={isDeleting ? "Удаляем…" : "Удалить"}
        confirmTone="danger"
        isPending={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => onDelete(plan.id)}
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="min-w-0 text-xl font-semibold tracking-tight text-foreground">
              {planName}
            </h4>
            {doseBadge ? (
              <span className="soft-note-info rounded-full px-2.5 py-1 text-xs font-medium">
                {doseBadge}
              </span>
            ) : null}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isUnavailable
                ? "soft-pill-danger"
                : stats?.blockedByDailyLimit
                  ? "soft-pill-danger"
                  : stats?.isBlocked
                    ? "soft-pill-warning"
                    : "soft-pill-success"
            }`}
          >
            {isUnavailable
              ? "Недоступно"
              : stats?.blockedByDailyLimit
                ? "Лимит"
                : stats?.isBlocked
                  ? "По графику"
                  : "Можно сейчас"}
          </span>
        </div>
        <p className="text-sm leading-6 text-foreground/78">
          {isUnavailable
            ? "Упаковка недоступна для приёма."
            : stats?.blockedByDailyLimit
              ? "Лимит приёмов на сегодня уже достигнут."
              : stats?.nextAllowedAt
                ? stats.nextAllowedAt <= new Date()
                  ? "Приём можно отметить сейчас."
                  : `Следующий приём ${formatRelativeDateTime(stats.nextAllowedAt, new Date())}.`
                : "Приём можно отметить сейчас."}
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Схема</h5>
          <DetailRow
            label="Интервал"
            value={formatIntervalForDisplay(plan.minIntervalMinutes, intervalUnit)}
          />
          {plan.maxDosesPerDay ? (
            <DetailRow label="Ограничение" value={`До ${plan.maxDosesPerDay} раз в сутки`} />
          ) : null}
          {medicine && (medicine.medicineForm || medicine.medicineConcentration) ? (
            <DetailRow
              label="Форма"
              value={[medicine.medicineForm ?? null, medicine.medicineConcentration ?? null]
                .filter(Boolean)
                .join(" · ")}
            />
          ) : null}
          {weightHint ? <DetailRow label="По весу" value={weightHint} /> : null}
        </section>

        <section className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">История</h5>
          {stats?.lastAdministration ? (
            <DetailRow
              label="Последний приём"
              value={[
                formatDateTime(stats.lastAdministration.administeredAt),
                getAdministrationActorLabel(stats.lastAdministration),
              ]
                .filter(Boolean)
                .join(" • ")}
            />
          ) : null}
          {(stats?.todayCount ?? 0) > 0 ? (
            <DetailRow
              label="Сегодня"
              value={
                plan.maxDosesPerDay
                  ? `Отмечено ${stats?.todayCount ?? 0} из ${plan.maxDosesPerDay}`
                  : `Отмечено ${stats?.todayCount ?? 0}`
              }
            />
          ) : null}
          {plan.notes?.trim() ? <DetailRow label="Заметка" value={plan.notes.trim()} /> : null}
        </section>
      </div>

      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {onTakeDose && (
            <button
              type="button"
              onClick={() => onTakeDose(plan)}
              disabled={isSubmittingAdministration || !!stats?.isBlocked || isUnavailable}
              className="soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
            >
              {isSubmittingAdministration
                ? "Отмечаем…"
                : isUnavailable
                  ? "Недоступно"
                  : stats?.isBlocked
                    ? "Рано"
                    : "Отметить приём"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
          >
            Изменить
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsDeleteConfirmOpen(true)}
          disabled={isDeleting}
          className="soft-button-danger inline-flex min-h-[2.95rem] w-full items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
        >
          {isDeleting ? "Удаляем…" : "Удалить"}
        </button>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-1 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <p className="text-xs font-medium tracking-[0.04em] text-muted">{label}</p>
      <p className="text-sm font-medium leading-6 text-foreground sm:text-right">{value}</p>
    </div>
  );
}

type EpisodeTimelineItem = {
  id: string;
  at: string;
  kind: "temperature" | "administration" | "comment";
  title: string;
  description: string;
};

function EpisodeTimelineList({ items }: { items: EpisodeTimelineItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="soft-card rounded-[24px] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TimelineKindPill kind={item.kind} />
                <p className="text-base font-semibold text-foreground">{item.title}</p>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                {item.description}
              </p>
            </div>
            <InfoPill label={formatDateTime(item.at)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TimelineKindPill({ kind }: { kind: EpisodeTimelineItem["kind"] }) {
  const config: Record<EpisodeTimelineItem["kind"], { label: string; className: string }> = {
    temperature: {
      label: "Температура",
      className: "soft-note-danger",
    },
    administration: {
      label: "Лекарство",
      className: "soft-note-info",
    },
    comment: {
      label: "Комментарий",
      className: "soft-note-warning",
    },
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${config[kind].className}`}>
      {config[kind].label}
    </span>
  );
}

function formatEpisodePeriod(startedAt: string, closedAt: string | null) {
  return closedAt
    ? `${formatDate(startedAt)} - ${formatDate(closedAt)}`
    : `с ${formatDate(startedAt)}`;
}

function formatWeightValue(valueKg: number): string {
  return `${new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} кг`;
}

function formatEntrySummary(
  temperatureCount: number,
  administrationCount: number,
  commentCount: number
) {
  return [
    `${temperatureCount} темп.`,
    `${administrationCount} приёма`,
    `${commentCount} комм.`,
  ].join(" • ");
}

function buildEpisodeTimeline(
  temperatures: TemperatureEntry[],
  administrations: AdministrationEvent[],
  comments: IllnessComment[],
  medicines: HouseholdMedicine[]
): EpisodeTimelineItem[] {
  const temperatureItems = temperatures.map((entry) => ({
    id: `temp-${entry.id}`,
    at: entry.measuredAt,
    kind: "temperature" as const,
    title: `${entry.valueCelsius} °C`,
    description: entry.comment?.trim() || "Замер температуры",
  }));

  const administrationItems = administrations.map((entry) => {
    const medicine = entry.householdMedicineId
      ? medicines.find((item) => item.id === entry.householdMedicineId)
      : null;
    const reason = entry.reason?.trim();
    const actorLabel = getAdministrationActorLabel(entry);
    const doseLabel = entry.amount?.trim();
    const descriptionLines: string[] = [];

    if (doseLabel) {
      descriptionLines.push(`Доза: ${doseLabel}`);
    }

    if (actorLabel) {
      descriptionLines.push(actorLabel);
    }
    if (reason) {
      descriptionLines.push(reason);
    }

    return {
      id: `admin-${entry.id}`,
      at: entry.administeredAt,
      kind: "administration" as const,
      title: entry.customMedicineName ?? medicine?.medicineName ?? "Приём лекарства",
      description: descriptionLines.join("\n"),
    };
  });

  const commentItems = comments.map((entry) => ({
    id: `comment-${entry.id}`,
    at: entry.createdAt,
    kind: "comment" as const,
    title: "Комментарий",
    description: entry.text,
  }));

  return [...temperatureItems, ...administrationItems, ...commentItems].sort((left, right) =>
    right.at.localeCompare(left.at)
  );
}

function parseNullableInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) {
    return null;
  }

  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}
