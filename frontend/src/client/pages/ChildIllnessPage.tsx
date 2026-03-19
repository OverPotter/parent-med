/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useState } from "react";
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
import { DateField } from "@shared/components/DateField";
import { DisclosureHeader } from "@shared/components/DisclosureHeader";
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
  formatIntervalForDisplay,
  buildWeightDoseHint,
} from "../utils/medicationPlans";
import { formatDate, formatDateTime } from "@shared/utils/date";

export function ChildIllnessPage() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const [openHistoryEpisodeId, setOpenHistoryEpisodeId] = useState<string | null>(null);
  const [isChildSummaryExpanded, setIsChildSummaryExpanded] = useState(false);
  const historyOnlyView = searchParams.get("view") === "history";
  const createMode = searchParams.get("mode") === "create";

  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId,
  });

  const { data: activeEpisode } = useQuery({
    queryKey: ["illness-episode-active", childId],
    queryFn: () => fetchActiveIllnessEpisodeByChildId(childId!),
    enabled: !!childId,
  });

  const { data: familyMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!currentFamilyId,
  });

  const closeEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => updateIllnessEpisode(episodeId, { status: "closed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
    },
  });
  const createEpisodeMutation = useMutation({
    mutationFn: async (payload: {
      started_at: string;
      title?: string | null;
      medication_mode: string;
      note?: string | null;
      temperatures: Array<{ value_celsius: number }>;
      administrations: Array<{ household_medicine_id: string; amount: string }>;
      comments: Array<{ text: string }>;
      medication_plans: Array<{
        household_medicine_id: string;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      navigate(`/children/${childId}/illness`);
    },
    onError: async (error) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["illness-episodes", childId] }),
        queryClient.refetchQueries({ queryKey: ["illness-episode-active", childId] }),
      ]);

      const detail =
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "";
      if (detail.includes("активный эпизод")) {
        navigate(`/children/${childId}/illness`);
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
        <section className="soft-panel soft-hero relative overflow-hidden rounded-[28px]">
          <div className="relative p-4 sm:p-5">
            <DisclosureHeader
              isOpen={isChildSummaryExpanded}
              onToggle={() => setIsChildSummaryExpanded((current) => !current)}
              desktopClosedLabel="Данные"
              desktopOpenLabel="Скрыть"
              className="gap-4"
            >
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {child.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="soft-pill rounded-full px-3 py-1 text-xs">
                    {historyOnlyView ? "История" : createMode ? "Новый эпизод" : "Без эпизода"}
                  </span>
                  {child.ageLabel && (
                    <span className="soft-pill rounded-full px-3 py-1 text-xs">
                      {child.ageLabel}
                    </span>
                  )}
                </div>
              </div>
            </DisclosureHeader>

            {isChildSummaryExpanded && (
              <>
                <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SnapshotItem label="Возраст" value={child.ageLabel || "Не указан"} />
                  <SnapshotItem
                    label="Дата рождения"
                    value={child.birthDate ? formatDate(child.birthDate) : "Не указана"}
                  />
                  <SnapshotItem label="Всего эпизодов" value={String(episodes.length)} />
                  <SnapshotItem
                    label="Состояние"
                    value={
                      historyOnlyView
                        ? "Просмотр истории"
                        : createMode
                          ? "Подготовка нового эпизода"
                          : "Без активного эпизода"
                    }
                  />
                </div>

                {!currentFamilyId && (
                  <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
                    Семья не выбрана. Сначала открой страницу «Семья».
                  </div>
                )}
              </>
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
          />
        </section>
      )}

      {!activeEpisode && createMode && !historyOnlyView && (
        <section className="space-y-3">
          <SectionTitle
            title="Новый эпизод"
            subtitle="Пока ты только готовишь эпизод. Он появится в активных болезнях только после активации."
          />
          <EpisodeActivationCard
            childName={child.name}
            childId={child.id}
            medicines={familyMedicines}
            latestWeight={latestWeight}
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
          Активного эпизода сейчас нет. Новый эпизод можно начать из раздела «Дети».
        </section>
      )}

      {historyOnlyView && (
        <section className="space-y-3">
          <SectionTitle
            title="История"
            subtitle={
              openHistoryEpisodeId
                ? "Открыт один эпизод. Остальные скрыты, чтобы было проще читать и редактировать."
                : historyEpisodes.length > 0
                  ? "Краткие карточки с описанием. При необходимости эпизод можно раскрыть и исправить."
                  : "Когда появятся завершённые эпизоды, они будут показаны здесь."
            }
          />

          {openHistoryEpisodeId && (
            <div className="soft-panel-muted flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3">
              <p className="text-sm text-muted">
                Показан 1 эпизод из {historyEpisodes.length}. Остальные скрыты.
              </p>
              <button
                type="button"
                onClick={() => setOpenHistoryEpisodeId(null)}
                className="soft-button-secondary rounded-2xl px-3 py-1.5 text-sm"
              >
                Показать все эпизоды
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

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
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
  const { data: temperatureEntries = [] } = useQuery({
    queryKey: ["temperature-entries", episode.id],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episode.id),
    enabled: isOpen,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episode.id],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
    enabled: isOpen,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["illness-comments", episode.id],
    queryFn: () => fetchIllnessCommentsByEpisodeId(episode.id),
    enabled: isOpen,
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
      <DisclosureHeader isOpen={isOpen} onToggle={onToggle}>
        <>
          <p className="text-xs tracking-[0.08em] text-muted">
            Эпизод {episodeNumber} · {formatEpisodePeriod(episode.startedAt, episode.closedAt)}
          </p>
          <p className="mt-2 text-base font-medium text-foreground">
            {episode.title?.trim() || `Начался ${formatDate(episode.startedAt)}`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {episode.closedAt
              ? `Закрыт ${formatDateTime(episode.closedAt)}`
              : "Дата закрытия не указана"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            {episode.note?.trim() || "Описание не заполнено."}
          </p>
        </>
      </DisclosureHeader>

      {isOpen && (
        <div className="mt-6 space-y-6 border-t border-border/70 pt-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Описание</h3>
              <p className="mt-1 text-sm text-muted">
                {formatEpisodePeriod(episode.startedAt, episode.closedAt)} ·{" "}
                {formatEntrySummary(
                  temperatureEntries.length,
                  administrations.length,
                  comments.length
                )}
              </p>
            </div>

            <div className="soft-panel-muted mt-4 rounded-[22px] px-4 py-4">
              <p className="text-sm leading-6 text-muted">
                {episode.note?.trim() || "Описание не заполнено."}
              </p>
            </div>
          </section>

          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Записи эпизода</h3>

            {timelineItems.length > 0 ? (
              <div className="mt-4">
                <EpisodeTimelineList items={timelineItems} />
              </div>
            ) : (
              <div className="soft-empty mt-4 rounded-[22px] px-4 py-6 text-sm text-muted">
                Для этого эпизода ещё нет температур и записей о приёмах.
              </div>
            )}
          </section>

          <section className="border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Действия с эпизодом</h3>
                <p className="mt-1 text-sm text-muted">
                  Удаление скрывает этот эпизод из истории, но не стирает его из базы.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm("Удалить эпизод из истории болезней?")) {
                    return;
                  }
                  deleteEpisodeMutation.mutate();
                }}
                disabled={deleteEpisodeMutation.isPending}
                className="soft-button-danger rounded-2xl px-3 py-1.5 text-sm disabled:opacity-50"
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
}: {
  childName: string;
  childId: string;
  episode: IllnessEpisode;
  onClose: () => void;
  familyId: string | null;
  latestWeight: WeightEntry | null;
}) {
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const isActive = episode.status === "active";
  const [commentText, setCommentText] = useState("");
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isManualComposerExpanded, setIsManualComposerExpanded] = useState(
    episode.medicationMode !== "guided"
  );
  const [composerMode, setComposerMode] = useState<"temperature" | "administration" | "comment">(
    "temperature"
  );

  const { data: temperatureEntries = [] } = useQuery({
    queryKey: ["temperature-entries", episode.id],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episode.id),
    enabled: !!episode.id,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episode.id],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
    enabled: !!episode.id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["illness-comments", episode.id],
    queryFn: () => fetchIllnessCommentsByEpisodeId(episode.id),
    enabled: !!episode.id,
  });

  const { data: medicationPlans = [] } = useQuery({
    queryKey: ["episode-medication-plans", episode.id],
    queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(episode.id),
    enabled: !!episode.id,
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!familyId && !!accountId,
  });

  const usableHouseholdMedicines = householdMedicines.filter(
    (medicine) => medicine.status !== "expired" && medicine.status !== "expired_after_opening"
  );

  const addTempMutation = useMutation({
    mutationFn: (valueCelsius: number) =>
      createTemperatureEntry({ episode_id: episode.id, value_celsius: valueCelsius }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["temperature-entries", episode.id] }),
  });

  const addAdminMutation = useMutation({
    mutationFn: (payload: { household_medicine_id: string; amount: string; reason?: string }) =>
      createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: payload.household_medicine_id,
        amount: payload.amount,
        reason: payload.reason,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] }),
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: {
      household_medicine_id: string;
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
        dose_amount: payload.dose_amount,
        min_interval_minutes: payload.min_interval_minutes,
        max_doses_per_day: payload.max_doses_per_day ?? null,
        weight_kg: payload.weight_kg ?? null,
        dose_mg_per_kg: payload.dose_mg_per_kg ?? null,
        notes: payload.notes ?? null,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] }),
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
        household_medicine_id?: string;
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
    },
  });

  const [tempValue, setTempValue] = useState("");
  const [adminMedicineId, setAdminMedicineId] = useState("");
  const [adminAmount, setAdminAmount] = useState("");
  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    householdMedicines
  );

  return (
    <div className="soft-panel rounded-[30px]">
      <div className="soft-hero rounded-t-[30px] border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5">
        {isActive ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {childName}
                </p>
                <p className="pb-0.5 text-xs text-muted">С {formatDate(episode.startedAt)}</p>
              </div>
              <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                {episode.title?.trim() || `Начался ${formatDate(episode.startedAt)}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Закрыть текущий эпизод?")) {
                  return;
                }
                onClose();
              }}
              className="soft-button-secondary w-full rounded-2xl px-4 py-2.5 text-sm sm:w-auto"
            >
              Закрыть эпизод
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {childName}
              </p>
              <p className="pb-0.5 text-xs text-muted">С {formatDate(episode.startedAt)}</p>
            </div>
            <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
              {episode.title?.trim() || `Начался ${formatDate(episode.startedAt)}`}
            </h3>
          </div>
        )}
      </div>

      <div className="space-y-7 px-5 py-5 sm:px-6 sm:py-6">
        <section>
          {episode.medicationMode === "guided" && (
            <GuidedMedicationSection
              childId={childId}
              plans={medicationPlans}
              medicines={householdMedicines}
              administrations={administrations}
              latestWeight={latestWeight}
              isSubmittingAdministration={addAdminMutation.isPending}
              isSubmittingPlan={createPlanMutation.isPending}
              isUpdatingPlan={updatePlanMutation.isPending}
              isDeletingPlan={deletePlanMutation.isPending}
              planErrorMessage={
                (
                  (createPlanMutation.error ?? updatePlanMutation.error) as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail ?? null
              }
              onCreatePlan={(payload) => createPlanMutation.mutate(payload)}
              onUpdatePlan={(planId, payload) =>
                updatePlanMutation.mutate({
                  id: planId,
                  payload: {
                    household_medicine_id: payload.householdMedicineId,
                    dose_amount: payload.doseAmount,
                    min_interval_minutes: payload.minIntervalMinutes,
                    max_doses_per_day: payload.maxDosesPerDay,
                    weight_kg: payload.weightKg,
                    dose_mg_per_kg: payload.doseMgPerKg,
                    notes: payload.notes,
                  },
                })
              }
              onDeletePlan={(planId) => deletePlanMutation.mutate(planId)}
              onTakeDose={(plan) =>
                addAdminMutation.mutate({
                  household_medicine_id: plan.householdMedicineId,
                  amount: plan.doseAmount,
                  reason: "Дали по плану",
                })
              }
            />
          )}

          <div
            className={[
              episode.medicationMode === "guided" ? "mt-2" : "",
              "soft-panel-muted rounded-[24px] px-4 py-5 sm:px-5 sm:py-6",
            ].join(" ")}
          >
            <DisclosureHeader
              isOpen={isManualComposerExpanded}
              onToggle={() => setIsManualComposerExpanded((current) => !current)}
            >
              <>
                <h4 className="text-base font-semibold text-foreground">
                  {episode.medicationMode === "guided"
                    ? "Добавить запись вручную"
                    : "Добавить запись"}
                </h4>
                <p className="mt-1 text-sm text-muted">
                  {episode.medicationMode === "guided"
                    ? "Отдельно можно внести температуру, лекарство или комментарий."
                    : "Выбери тип записи и внеси одно новое действие."}
                </p>
              </>
            </DisclosureHeader>

            {isManualComposerExpanded && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ComposerToggle
                    label="Температура"
                    active={composerMode === "temperature"}
                    onClick={() => setComposerMode("temperature")}
                  />
                  <ComposerToggle
                    label="Лекарство"
                    active={composerMode === "administration"}
                    onClick={() => setComposerMode("administration")}
                  />
                  <ComposerToggle
                    label="Комментарий"
                    active={composerMode === "comment"}
                    onClick={() => setComposerMode("comment")}
                  />
                </div>

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

                  {composerMode === "administration" &&
                    (usableHouseholdMedicines.length === 0 ? (
                      <div className="soft-note-info rounded-2xl px-4 py-3 text-sm">
                        В аптечке нет доступных упаковок для приёма. Просроченные скрыты
                        автоматически.
                      </div>
                    ) : (
                      <AdministrationForm
                        medicines={usableHouseholdMedicines}
                        selectedMedicineId={adminMedicineId}
                        amount={adminAmount}
                        onMedicineChange={setAdminMedicineId}
                        onAmountChange={setAdminAmount}
                        onSubmit={() => {
                          if (!adminMedicineId || !adminAmount.trim()) return;
                          addAdminMutation.mutate({
                            household_medicine_id: adminMedicineId,
                            amount: adminAmount.trim(),
                          });
                          setAdminMedicineId("");
                          setAdminAmount("");
                        }}
                        isPending={addAdminMutation.isPending}
                      />
                    ))}
                  {composerMode === "administration" && addAdminMutation.isError && (
                    <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
                      {(addAdminMutation.error as { response?: { data?: { detail?: string } } })
                        .response?.data?.detail ??
                        "Ошибка записи. Проверь срок годности и срок после вскрытия."}
                    </p>
                  )}

                  {composerMode === "comment" && (
                    <div className="soft-panel-muted grid gap-3 rounded-[24px] p-3">
                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Например: к вечеру стал бодрее, после сна снова поднялась температура."
                        className="soft-input w-full rounded-2xl px-3 py-2"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!commentText.trim()) return;
                            addCommentMutation.mutate();
                          }}
                          disabled={addCommentMutation.isPending || !commentText.trim()}
                          className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
                        >
                          {addCommentMutation.isPending ? "Сохраняем…" : "Добавить комментарий"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="soft-panel-muted rounded-[24px] px-4 py-5 sm:px-5 sm:py-6">
          <DisclosureHeader
            isOpen={isTimelineExpanded}
            onToggle={() => {
              setIsTimelineExpanded((current) => !current);
            }}
            desktopClosedLabel={`Показать ленту (${timelineItems.length})`}
            desktopOpenLabel="Скрыть ленту"
            disabled={timelineItems.length === 0}
          >
            <>
              <h4 className="text-base font-semibold text-foreground">Лента эпизода</h4>
              <p className="mt-1 text-sm text-muted">Последние записи по времени.</p>
            </>
          </DisclosureHeader>

          <div className="mt-4">
            {timelineItems.length > 0 ? (
              isTimelineExpanded ? (
                <EpisodeTimelineList items={timelineItems} />
              ) : (
                <div className="soft-panel-muted rounded-[22px] px-4 py-4 text-sm text-muted">
                  Лента свернута. Открой её, если нужно посмотреть предыдущие записи.
                </div>
              )
            ) : (
              <div className="soft-empty rounded-[22px] px-4 py-6 text-sm text-muted">
                Записей по эпизоду пока нет.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function EpisodeActivationCard({
  childName,
  childId,
  medicines,
  latestWeight,
  isPending,
  errorMessage,
  onActivate,
  onCancel,
}: {
  childName: string;
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  isPending: boolean;
  errorMessage: string | null;
  onActivate: (payload: {
    started_at: string;
    title?: string | null;
    medication_mode: string;
    note?: string | null;
    temperatures: Array<{ value_celsius: number }>;
    administrations: Array<{ household_medicine_id: string; amount: string }>;
    comments: Array<{ text: string }>;
    medication_plans: Array<{
      household_medicine_id: string;
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
  const [composerMode, setComposerMode] = useState<"temperature" | "administration" | "comment">(
    "temperature"
  );
  const [tempValue, setTempValue] = useState("");
  const [adminMedicineId, setAdminMedicineId] = useState("");
  const [adminAmount, setAdminAmount] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isActivationPlansExpanded, setIsActivationPlansExpanded] = useState(true);
  const [medicationPlans, setMedicationPlans] = useState<DraftMedicationPlan[]>([]);
  const [temperatures, setTemperatures] = useState<Array<{ id: string; valueCelsius: number }>>([]);
  const [administrations, setAdministrations] = useState<
    Array<{ id: string; householdMedicineId: string; amount: string }>
  >([]);
  const [comments, setComments] = useState<Array<{ id: string; text: string }>>([]);
  const usableMedicines = medicines.filter(
    (medicine) => medicine.status !== "expired" && medicine.status !== "expired_after_opening"
  );
  const pendingItems = buildPendingActivationTimeline(
    temperatures,
    administrations,
    comments,
    medicines
  );

  return (
    <div className="soft-panel rounded-[30px]">
      <div className="soft-hero rounded-t-[30px] border-b border-border/70 px-5 py-6 sm:px-6 sm:py-7">
        <p className="text-xs tracking-[0.1em] text-muted">Подготовка эпизода</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{childName}</h3>
        <p className="mt-3 text-sm text-muted">
          Пока эпизод не активирован, он не появляется в активных болезнях и ничего не сохраняет.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        {errorMessage && (
          <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{errorMessage}</div>
        )}
        <label className="block">
          <span className="block text-sm text-muted">Дата начала</span>
          <DateField
            value={startedAt}
            onChange={setStartedAt}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-1"
          />
        </label>
        <label className="block">
          <span className="block text-sm text-muted">Название эпизода</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: ОРВИ с температурой"
            className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
          />
        </label>
        <section className="border-t border-border pt-6">
          <DisclosureHeader
            isOpen={isActivationPlansExpanded}
            onToggle={() => setIsActivationPlansExpanded((current) => !current)}
          >
            <>
              <h4 className="text-base font-semibold text-foreground">Планы лекарства</h4>
              <p className="mt-1 text-sm text-muted">
                Здесь можно сразу настроить интервалы и будущие приёмы. Ручной журнал ниже тоже
                останется доступен.
              </p>
            </>
          </DisclosureHeader>

          {isActivationPlansExpanded &&
            (usableMedicines.length === 0 ? (
              <div className="soft-note-info mt-4 rounded-2xl px-4 py-3 text-sm">
                В аптечке нет доступных упаковок для планов лекарства.
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <MedicationPlanComposer
                    childId={childId}
                    medicines={usableMedicines}
                    latestWeight={latestWeight}
                    onSubmit={(plan) =>
                      setMedicationPlans((current) => [...current, { id: makeLocalId(), ...plan }])
                    }
                    submitLabel="Добавить план"
                    isPending={false}
                  />
                </div>

                {medicationPlans.length > 0 && (
                  <div className="mt-4">
                    <MedicationPlanList
                      plans={medicationPlans}
                      childId={childId}
                      medicines={usableMedicines}
                      latestWeight={latestWeight}
                      onUpdate={(planId, payload) =>
                        setMedicationPlans((current) =>
                          current.map((plan) =>
                            plan.id === planId ? { id: plan.id, ...payload } : plan
                          )
                        )
                      }
                      onDelete={(planId) =>
                        setMedicationPlans((current) =>
                          current.filter((plan) => plan.id !== planId)
                        )
                      }
                    />
                  </div>
                )}
              </>
            ))}
        </section>
        <section className="border-t border-border pt-6">
          <div>
            <h4 className="text-base font-semibold text-foreground">Подготовить записи</h4>
            <p className="mt-1 text-sm text-muted">
              Можно заранее добавить температуры, лекарства и комментарии. Они сохранятся вместе с
              активацией.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ComposerToggle
              label="Температура"
              active={composerMode === "temperature"}
              onClick={() => setComposerMode("temperature")}
            />
            <ComposerToggle
              label="Лекарство"
              active={composerMode === "administration"}
              onClick={() => setComposerMode("administration")}
            />
            <ComposerToggle
              label="Комментарий"
              active={composerMode === "comment"}
              onClick={() => setComposerMode("comment")}
            />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {composerMode === "temperature" && (
              <TemperatureForm
                value={tempValue}
                onChange={setTempValue}
                onSubmit={() => {
                  const parsed = parseFloat(tempValue);
                  if (Number.isNaN(parsed)) return;
                  setTemperatures((current) => [
                    ...current,
                    { id: makeLocalId(), valueCelsius: parsed },
                  ]);
                  setTempValue("");
                }}
                isPending={false}
              />
            )}

            {composerMode === "administration" &&
              (usableMedicines.length === 0 ? (
                <div className="soft-note-info rounded-2xl px-4 py-3 text-sm">
                  В аптечке нет доступных упаковок для приёма. Просроченные скрыты автоматически.
                </div>
              ) : (
                <AdministrationForm
                  medicines={usableMedicines}
                  selectedMedicineId={adminMedicineId}
                  amount={adminAmount}
                  onMedicineChange={setAdminMedicineId}
                  onAmountChange={setAdminAmount}
                  onSubmit={() => {
                    if (!adminMedicineId || !adminAmount.trim()) return;
                    setAdministrations((current) => [
                      ...current,
                      {
                        id: makeLocalId(),
                        householdMedicineId: adminMedicineId,
                        amount: adminAmount.trim(),
                      },
                    ]);
                    setAdminMedicineId("");
                    setAdminAmount("");
                  }}
                  isPending={false}
                />
              ))}

            {composerMode === "comment" && (
              <div className="soft-panel-muted grid gap-3 rounded-[24px] p-3">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Например: к вечеру стал бодрее, после сна снова поднялась температура."
                  className="soft-input w-full rounded-2xl px-3 py-2"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!commentText.trim()) return;
                      setComments((current) => [
                        ...current,
                        { id: makeLocalId(), text: commentText.trim() },
                      ]);
                      setCommentText("");
                    }}
                    disabled={!commentText.trim()}
                    className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    Добавить комментарий
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {pendingItems.length > 0 && (
          <section className="border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-foreground">Что будет сохранено</h4>
                <p className="mt-1 text-sm text-muted">
                  Этот набор запишется сразу после активации эпизода.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <TimelineKindPill kind={item.kind} />
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.kind === "temperature") {
                        setTemperatures((current) =>
                          current.filter((entry) => entry.id !== item.id)
                        );
                        return;
                      }
                      if (item.kind === "administration") {
                        setAdministrations((current) =>
                          current.filter((entry) => entry.id !== item.id)
                        );
                        return;
                      }
                      setComments((current) => current.filter((entry) => entry.id !== item.id));
                    }}
                    className="soft-button-secondary rounded-2xl px-3 py-1.5 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onActivate({
                started_at: startedAt,
                title: title.trim() ? title.trim() : null,
                medication_mode: "guided",
                note: null,
                temperatures: temperatures.map((item) => ({ value_celsius: item.valueCelsius })),
                administrations: administrations.map((item) => ({
                  household_medicine_id: item.householdMedicineId,
                  amount: item.amount,
                })),
                comments: comments.map((item) => ({ text: item.text })),
                medication_plans: medicationPlans.map((item) => ({
                  household_medicine_id: item.householdMedicineId,
                  dose_amount: item.doseAmount,
                  min_interval_minutes: item.minIntervalMinutes,
                  max_doses_per_day: item.maxDosesPerDay ?? null,
                  weight_kg: item.weightKg ?? null,
                  dose_mg_per_kg: item.doseMgPerKg ?? null,
                  notes: item.notes ?? null,
                })),
              })
            }
            disabled={isPending || !startedAt}
            className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {isPending ? "Активируем…" : "Активировать эпизод"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

function ComposerToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2.5 text-sm transition-colors",
        active ? "soft-tab-active" : "soft-tab",
      ].join(" ")}
    >
      {label}
    </button>
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
    <div className="soft-panel-muted rounded-[24px] p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-sm text-muted">Температура</span>
          <input
            type="number"
            step={0.1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="36.6"
            className="soft-input mt-1 w-24 rounded-2xl px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !value}
          className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {isPending ? "Сохраняем…" : "Добавить"}
        </button>
      </div>
    </div>
  );
}

function AdministrationForm({
  medicines,
  selectedMedicineId,
  amount,
  onMedicineChange,
  onAmountChange,
  onSubmit,
  isPending,
}: {
  medicines: HouseholdMedicine[];
  selectedMedicineId: string;
  amount: string;
  onMedicineChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="soft-panel-muted grid gap-3 rounded-[24px] p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
      <label className="block min-w-0">
        <span className="block text-sm text-muted">Упаковка</span>
        <select
          value={selectedMedicineId}
          onChange={(e) => onMedicineChange(e.target.value)}
          className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
        >
          <option value="">Выберите упаковку</option>
          {medicines.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.medicineName} · {medicine.statusLabel} · до{" "}
              {formatDate(medicine.expiryDate)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm text-muted">Доза</span>
        <input
          type="text"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="5 мл"
          className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
        />
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !selectedMedicineId || !amount.trim()}
        className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
      >
        {isPending ? "Сохраняем…" : "Записать"}
      </button>
    </div>
  );
}

type MedicationPlanPayload = {
  householdMedicineId: string;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay: number | null;
  weightKg: number | null;
  doseMgPerKg: number | null;
  notes: string | null;
};

type DraftMedicationPlan = MedicationPlanPayload & {
  id: string;
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

function GuidedMedicationSection({
  childId,
  plans,
  medicines,
  administrations,
  latestWeight,
  isSubmittingAdministration,
  isSubmittingPlan,
  isUpdatingPlan,
  isDeletingPlan,
  planErrorMessage,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onTakeDose,
}: {
  childId: string;
  plans: EpisodeMedicationPlan[];
  medicines: HouseholdMedicine[];
  administrations: AdministrationEvent[];
  latestWeight: WeightEntry | null;
  isSubmittingAdministration: boolean;
  isSubmittingPlan: boolean;
  isUpdatingPlan: boolean;
  isDeletingPlan: boolean;
  planErrorMessage: string | null;
  onCreatePlan: (payload: {
    household_medicine_id: string;
    dose_amount: string;
    min_interval_minutes: number;
    max_doses_per_day?: number | null;
    weight_kg?: number | null;
    dose_mg_per_kg?: number | null;
    notes?: string | null;
  }) => void;
  onUpdatePlan: (planId: string, payload: MedicationPlanPayload) => void;
  onDeletePlan: (planId: string) => void;
  onTakeDose: (plan: EpisodeMedicationPlan) => void;
}) {
  const usableMedicines = medicines.filter(
    (medicine) => medicine.status !== "expired" && medicine.status !== "expired_after_opening"
  );
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <div className="space-y-4">
      <DisclosureHeader
        isOpen={isComposerOpen}
        onToggle={() => {
          if (usableMedicines.length === 0) {
            return;
          }
          setIsComposerOpen((current) => !current);
        }}
        desktopClosedLabel="Добавить план"
        desktopOpenLabel="Скрыть форму"
        mobileClosedLabel="Добавить"
        mobileOpenLabel="Скрыть"
        disabled={usableMedicines.length === 0}
      >
        <div>
          <h4 className="text-base font-semibold text-foreground">Лекарства с подсказками</h4>
        </div>
      </DisclosureHeader>

      {plans.length > 0 ? (
        <MedicationPlanList
          plans={plans}
          childId={childId}
          medicines={medicines}
          administrations={administrations}
          latestWeight={latestWeight}
          onUpdate={onUpdatePlan}
          onDelete={onDeletePlan}
          onTakeDose={onTakeDose}
          isUpdating={isUpdatingPlan}
          isDeleting={isDeletingPlan}
          isSubmittingAdministration={isSubmittingAdministration}
        />
      ) : (
        <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
          Планов лекарства пока нет. Ниже можно добавить новый план, если в эпизоде появилось ещё
          одно лекарство или нужно восстановить забытый сценарий.
        </div>
      )}

      {usableMedicines.length === 0 ? (
        <div className="soft-note-info rounded-2xl px-4 py-3 text-sm">
          В аптечке нет доступных упаковок для guided-режима.
        </div>
      ) : isComposerOpen ? (
        <MedicationPlanComposer
          childId={childId}
          medicines={usableMedicines}
          latestWeight={latestWeight}
          onSubmit={(plan) =>
            onCreatePlan({
              household_medicine_id: plan.householdMedicineId,
              dose_amount: plan.doseAmount,
              min_interval_minutes: plan.minIntervalMinutes,
              max_doses_per_day: plan.maxDosesPerDay,
              weight_kg: plan.weightKg,
              dose_mg_per_kg: plan.doseMgPerKg,
              notes: plan.notes,
            })
          }
          submitLabel="Добавить план"
          isPending={isSubmittingPlan}
          onCancel={() => setIsComposerOpen(false)}
        />
      ) : null}

      {planErrorMessage && (
        <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{planErrorMessage}</div>
      )}
    </div>
  );
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
  const [selectedMedicineId, setSelectedMedicineId] = useState(
    initialValue?.householdMedicineId ?? ""
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
  const [notes, setNotes] = useState(initialValue?.notes ?? "");

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
    <div className="soft-panel-muted rounded-[24px] p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="block min-w-0">
          <span className="block text-sm text-muted">Упаковка</span>
          <select
            value={selectedMedicineId}
            onChange={(e) => setSelectedMedicineId(e.target.value)}
            className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
          >
            <option value="">Выберите упаковку</option>
            {medicines.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.medicineName}
                {medicine.medicineConcentration ? ` · ${medicine.medicineConcentration}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm text-muted">Разовая доза, если нужна</span>
          <input
            type="text"
            value={doseAmount}
            onChange={(e) => setDoseAmount(e.target.value)}
            placeholder="Например: 10 мл или 1 таб."
            className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
          />
          {hasDoseUnitHint && (
            <p className="mt-1 text-xs text-muted">Лучше добавить единицу: мл, таб., кап. и т.д.</p>
          )}
          {hasInvalidDose && (
            <p className="mt-1 text-xs text-[color:var(--color-danger)]">
              Укажи единицу дозы: мл, таб., мг, кап. и т.д.
            </p>
          )}
        </label>

        <label className="block">
          <span className="block text-sm text-muted">
            Минимальный интервал, {intervalUnit === "minutes" ? "минут" : "часов"}
          </span>
          <input
            type="number"
            min="1"
            max={intervalUnit === "minutes" ? "1440" : "24"}
            step={intervalUnit === "minutes" ? "1" : "0.5"}
            value={minIntervalInput}
            onChange={(e) => setMinIntervalInput(e.target.value)}
            className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="block text-sm text-muted">Максимум в сутки</span>
          <input
            type="number"
            min="1"
            max="24"
            value={maxDosesPerDay}
            onChange={(e) => setMaxDosesPerDay(e.target.value)}
            placeholder="Необязательно"
            className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-sm text-muted">
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
            className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
          />
          {latestWeight && (
            <p className="mt-1 text-xs text-muted">
              Последний вес: {latestWeight.valueKg} кг от {formatDate(latestWeight.measuredAt)}
            </p>
          )}
          {shouldOfferWeightSync && (
            <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">
              <p>В плане указан вес {parsedWeightKg} кг. Обновить его и в карточке ребёнка?</p>
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
                  className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {syncWeightMutation.isPending ? "Сохраняем вес…" : "Обновить вес ребёнка"}
                </button>
              </div>
            </div>
          )}
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-sm text-muted">
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
            className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="block text-sm text-muted">Комментарий к схеме</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Например: по назначению врача, только при высокой температуре."
          className="soft-input mt-1 w-full rounded-2xl px-3 py-2"
        />
      </label>

      {weightHint && (
        <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">{weightHint}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!selectedMedicineId || parsedIntervalMinutes === null || hasInvalidDose) {
              return;
            }

            onSubmit({
              householdMedicineId: selectedMedicineId,
              doseAmount: doseAmount.trim(),
              minIntervalMinutes: parsedIntervalMinutes,
              maxDosesPerDay: parseNullableInteger(maxDosesPerDay),
              weightKg: parseNullableNumber(weightKg),
              doseMgPerKg: parseNullableNumber(doseMgPerKg),
              notes: notes.trim() || null,
            });

            if (!initialValue) {
              setSelectedMedicineId("");
              setDoseAmount("");
              setMinIntervalInput(intervalUnit === "minutes" ? "180" : "3");
              setMaxDosesPerDay("");
              setDoseMgPerKg("");
              setNotes("");
            }
            onCancel?.();
          }}
          disabled={
            isPending ||
            !selectedMedicineId ||
            !minIntervalInput ||
            hasInvalidDose ||
            parsedIntervalMinutes === null
          }
          className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {isPending ? "Сохраняем…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
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
  childId,
  medicines,
  administrations,
  latestWeight,
  onUpdate,
  onDelete,
  onTakeDose,
  isUpdating = false,
  isDeleting = false,
  isSubmittingAdministration = false,
}: {
  plans: Array<DraftMedicationPlan | EpisodeMedicationPlan>;
  childId: string;
  medicines: HouseholdMedicine[];
  administrations?: AdministrationEvent[];
  latestWeight: WeightEntry | null;
  onUpdate: (planId: string, payload: MedicationPlanPayload) => void;
  onDelete: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isSubmittingAdministration?: boolean;
}) {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [actionMenuPlanId, setActionMenuPlanId] = useState<string | null>(null);
  const now = useNow();
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);

  const collapsePlan = (planId: string) => {
    setActionMenuPlanId((current) => (current === planId ? null : current));
    setExpandedPlanId((current) => (current === planId ? null : current));
    setEditingPlanId((current) => (current === planId ? null : current));
  };

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const medicine = medicines.find((item) => item.id === plan.householdMedicineId) ?? null;
        const stats = administrations
          ? buildPlanAdministrationStats(plan, administrations, new Date(now))
          : null;
        const weightHint = buildWeightDoseHint(medicine, plan.weightKg, plan.doseMgPerKg);
        const isMedicineUnavailable =
          medicine?.status === "expired" || medicine?.status === "expired_after_opening";
        const editableMedicines = Array.from(
          new Map(
            medicines
              .filter(
                (item) =>
                  item.id === plan.householdMedicineId ||
                  (item.status !== "expired" && item.status !== "expired_after_opening")
              )
              .map((item) => [item.id, item])
          ).values()
        );
        const isExpanded = expandedPlanId === plan.id;
        const isEditing = editingPlanId === plan.id;
        const todayCountLabel = plan.maxDosesPerDay
          ? `Сегодня ${stats?.todayCount ?? 0} из ${plan.maxDosesPerDay}`
          : `Сегодня ${stats?.todayCount ?? 0}`;
        const nextDoseLabel = stats?.blockedByDailyLimit
          ? "Следующий приём: лимит на сегодня достигнут"
          : stats?.nextAllowedAt
            ? stats.nextAllowedAt <= new Date()
              ? "Следующий приём: можно сейчас"
              : `Следующий приём: ${formatClockTime(stats.nextAllowedAt)}`
            : "Следующий приём: можно сейчас";
        const nextDoseToneClass = stats?.blockedByDailyLimit
          ? "soft-pill-danger"
          : stats?.nextAllowedAt
            ? stats.nextAllowedAt <= new Date()
              ? "soft-pill-success"
              : "soft-pill-warning"
            : "soft-pill-info";
        const togglePlanActions = () => {
          if (
            actionMenuPlanId === plan.id ||
            expandedPlanId === plan.id ||
            editingPlanId === plan.id
          ) {
            collapsePlan(plan.id);
            return;
          }
          setActionMenuPlanId(plan.id);
        };

        return (
          <div key={plan.id} className="soft-card rounded-[24px] px-4 py-4">
            <div
              className="flex cursor-pointer flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              onClick={togglePlanActions}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  togglePlanActions();
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={actionMenuPlanId === plan.id || isExpanded || isEditing}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-foreground">
                    {medicine?.medicineName ?? "Лекарство"}
                  </p>
                  <span className="soft-pill rounded-full px-2.5 py-1 text-[11px] sm:hidden">
                    {actionMenuPlanId === plan.id || isExpanded || isEditing ? "Скрыть" : "Открыть"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="soft-pill rounded-full px-2.5 py-1 text-xs">
                    {todayCountLabel}
                  </span>
                  <p className={`${nextDoseToneClass} rounded-full px-2.5 py-1 text-xs`}>
                    {nextDoseLabel}
                  </p>
                </div>
                {isMedicineUnavailable && (
                  <p className="mt-2 text-sm text-[color:var(--color-danger)]">
                    Эта упаковка сейчас недоступна для приёма.
                  </p>
                )}
              </div>

              <div className="hidden flex-wrap gap-2 sm:flex">
                {onTakeDose && "createdAt" in plan && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onTakeDose(plan as EpisodeMedicationPlan);
                    }}
                    disabled={
                      isSubmittingAdministration || !!stats?.isBlocked || isMedicineUnavailable
                    }
                    className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    {isSubmittingAdministration
                      ? "Отмечаем…"
                      : isMedicineUnavailable
                        ? "Недоступно"
                        : stats?.isBlocked
                          ? "Пока рано"
                          : "Дать препарат"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (
                      actionMenuPlanId === plan.id ||
                      expandedPlanId === plan.id ||
                      editingPlanId === plan.id
                    ) {
                      collapsePlan(plan.id);
                      return;
                    }
                    setActionMenuPlanId(plan.id);
                  }}
                  className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
                >
                  Ещё
                </button>
              </div>
            </div>

            {onTakeDose && "createdAt" in plan && (
              <div className="mt-3 sm:hidden">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTakeDose(plan as EpisodeMedicationPlan);
                  }}
                  disabled={
                    isSubmittingAdministration || !!stats?.isBlocked || isMedicineUnavailable
                  }
                  className="soft-button-primary w-full rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {isSubmittingAdministration
                    ? "Отмечаем…"
                    : isMedicineUnavailable
                      ? "Недоступно"
                      : stats?.isBlocked
                        ? "Пока рано"
                        : "Дать препарат"}
                </button>
              </div>
            )}

            {actionMenuPlanId === plan.id && (
              <div className="mt-3 grid gap-2 border-t border-border/70 pt-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedPlanId((current) => (current === plan.id ? null : plan.id));
                    setActionMenuPlanId(null);
                  }}
                  className="soft-button-secondary w-full rounded-2xl px-4 py-3 text-sm sm:w-auto sm:py-2.5"
                >
                  {isExpanded ? "Скрыть детали" : "Подробнее"}
                </button>
                {"createdAt" in plan && (
                  <button
                    type="button"
                    onClick={() => {
                      const shouldFinish = window.confirm(
                        `Завершить план для «${medicine?.medicineName ?? "лекарства"}»? Он исчезнет из активного эпизода.`
                      );
                      if (!shouldFinish) {
                        return;
                      }
                      onDelete(plan.id);
                      setActionMenuPlanId(null);
                    }}
                    disabled={isDeleting}
                    className="soft-button-secondary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50 sm:w-auto sm:py-2.5"
                  >
                    {isDeleting ? "Завершаем…" : "Завершить план"}
                  </button>
                )}
                {"createdAt" in plan && (
                  <button
                    type="button"
                    onClick={() => {
                      const shouldEdit = window.confirm(
                        `Точно изменить план для «${medicine?.medicineName ?? "лекарства"}»?`
                      );
                      if (!shouldEdit) {
                        return;
                      }
                      setExpandedPlanId(plan.id);
                      setEditingPlanId(plan.id);
                      setActionMenuPlanId(null);
                    }}
                    className="soft-button-secondary w-full rounded-2xl px-4 py-3 text-sm sm:w-auto sm:py-2.5"
                  >
                    Изменить план
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const shouldDelete = window.confirm(
                      `Точно удалить план для «${medicine?.medicineName ?? "лекарства"}»?`
                    );
                    if (!shouldDelete) {
                      return;
                    }
                    onDelete(plan.id);
                    setActionMenuPlanId(null);
                  }}
                  disabled={isDeleting}
                  className="soft-button-secondary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50 sm:w-auto sm:py-2.5"
                >
                  {isDeleting ? "Удаляем…" : "Удалить план"}
                </button>
              </div>
            )}

            {isExpanded && (
              <div className="mt-4 border-t border-border/70 pt-4">
                {isEditing ? (
                  <MedicationPlanComposer
                    key={plan.id}
                    childId={childId}
                    medicines={editableMedicines}
                    latestWeight={latestWeight}
                    initialValue={{
                      householdMedicineId: plan.householdMedicineId,
                      doseAmount: plan.doseAmount,
                      minIntervalMinutes: plan.minIntervalMinutes,
                      maxDosesPerDay: plan.maxDosesPerDay,
                      weightKg: plan.weightKg,
                      doseMgPerKg: plan.doseMgPerKg,
                      notes: plan.notes,
                    }}
                    onSubmit={(payload) => {
                      onUpdate(plan.id, payload);
                      setEditingPlanId(null);
                    }}
                    submitLabel="Сохранить план"
                    isPending={isUpdating}
                    onCancel={() => setEditingPlanId(null)}
                  />
                ) : (
                  <div className="space-y-2 text-sm text-muted">
                    {plan.doseAmount && <p>Разовая доза: {plan.doseAmount}</p>}
                    <p>
                      {medicine?.medicineForm ?? "Форма не указана"}
                      {medicine?.medicineConcentration
                        ? ` · ${medicine.medicineConcentration}`
                        : ""}
                    </p>
                    <p>
                      Интервал: {formatIntervalForDisplay(plan.minIntervalMinutes, intervalUnit)}
                      {plan.maxDosesPerDay ? ` · до ${plan.maxDosesPerDay} раз в сутки` : ""}
                    </p>
                    {stats && (
                      <>
                        <p>
                          Последний приём:{" "}
                          {stats.lastAdministration
                            ? formatDateTime(stats.lastAdministration.administeredAt)
                            : "ещё не отмечен"}
                        </p>
                        {plan.maxDosesPerDay && (
                          <p>
                            Сегодня: {stats.todayCount} из {plan.maxDosesPerDay}
                          </p>
                        )}
                      </>
                    )}
                    {weightHint && <p>{weightHint}</p>}
                    {plan.notes && <p>{plan.notes}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
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

function formatClockTime(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const timePart = value.slice(11, 16);
  if (timePart && timePart.length === 5) {
    return timePart;
  }

  return formatDateTime(value);
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
    const medicine = medicines.find((item) => item.id === entry.householdMedicineId);
    const reason = entry.reason?.trim();

    return {
      id: `admin-${entry.id}`,
      at: entry.administeredAt,
      kind: "administration" as const,
      title: medicine?.medicineName ?? "Приём лекарства",
      description: reason ? `Доза: ${entry.amount}\n${reason}` : `Доза: ${entry.amount}`,
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

function buildPendingActivationTimeline(
  temperatures: Array<{ id: string; valueCelsius: number }>,
  administrations: Array<{ id: string; householdMedicineId: string; amount: string }>,
  comments: Array<{ id: string; text: string }>,
  medicines: HouseholdMedicine[]
): EpisodeTimelineItem[] {
  const at = new Date().toISOString();

  const temperatureItems = temperatures.map((entry) => ({
    id: entry.id,
    at,
    kind: "temperature" as const,
    title: `${entry.valueCelsius} °C`,
    description: "Будет сохранено как начальный замер температуры",
  }));

  const administrationItems = administrations.map((entry) => {
    const medicine = medicines.find((item) => item.id === entry.householdMedicineId);

    return {
      id: entry.id,
      at,
      kind: "administration" as const,
      title: medicine?.medicineName ?? "Приём лекарства",
      description: `Доза: ${entry.amount}`,
    };
  });

  const commentItems = comments.map((entry) => ({
    id: entry.id,
    at,
    kind: "comment" as const,
    title: "Комментарий",
    description: entry.text,
  }));

  return [...temperatureItems, ...administrationItems, ...commentItems];
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

function makeLocalId() {
  return Math.random().toString(36).slice(2, 10);
}
