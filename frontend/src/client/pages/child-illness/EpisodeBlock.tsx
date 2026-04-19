import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type { IllnessEpisode, WeightEntry } from "@shared/types/api";
import { getPrioritizedMedicationPlanItems } from "@client/utils/medicationPlans";
import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import { AdministrationForm, TemperatureForm, illnessCompactTextareaClass } from "./forms";
import { MedicationPlanComposer, MedicationPlanDetail, MedicationPlanList } from "./reminders";
import {
  SectionTitle,
  appBtnDangerClass,
  appPillActionClass,
  illnessCompactPrimaryButtonClass,
  illnessCompactSecondaryButtonClass,
  illnessListClass,
  illnessPanelSoftClass,
} from "./shared";
import { EpisodeTimelineList, buildEpisodeTimeline } from "./timeline";

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
  const isActive = episode.status === "active";
  const isReminderCabinetPickerOpen = searchParams.get("picker") === "cabinet";
  const [isReminderEditing, setIsReminderEditing] = useState(false);
  const [editingReminderName, setEditingReminderName] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [quickComposeSuccessMessage, setQuickComposeSuccessMessage] = useState<string | null>(null);
  const composerMode = quickComposeMode ?? initialComposerMode;
  const quickComposeMeta =
    composerMode === "temperature"
      ? {
          title: language === "ru" ? "Запись температуры" : "Temperature log",
          subtitle: language === "ru" ? "Сохраните новый замер." : "Save a new reading.",
          success: language === "ru" ? "Температура сохранена" : "Temperature saved",
        }
      : composerMode === "administration"
        ? {
            title: language === "ru" ? "Запись приёма" : "Dose log",
            subtitle: language === "ru" ? "Сохраните приём." : "Save the dose.",
            success: language === "ru" ? "Приём сохранён" : "Dose saved",
          }
        : {
            title: language === "ru" ? "Заметка" : "Note",
            subtitle:
              language === "ru"
                ? "Добавьте заметку о состоянии."
                : "Add a note about the current state.",
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
      )}
      {composerMode === "administration" && addAdminMutation.isError && (
        <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
          {(addAdminMutation.error as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ??
            (language === "ru"
              ? "Ошибка записи. Проверь срок годности и срок после вскрытия."
              : "Failed to save. Check the expiry date and the after-opening limit.")}
        </p>
      )}

      {composerMode === "comment" && (
        <div className="grid gap-3">
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              language === "ru"
                ? "Например: к вечеру бодрее, после сна снова температура."
                : "Example: more active by evening, fever came back after sleep."
            }
            className={illnessCompactTextareaClass}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!commentText.trim()) return;
                addCommentMutation.mutate();
              }}
              disabled={addCommentMutation.isPending || !commentText.trim()}
              className={illnessCompactPrimaryButtonClass}
            >
              {addCommentMutation.isPending
                ? language === "ru"
                  ? "Сохраняем…"
                  : "Saving…"
                : language === "ru"
                  ? "Добавить комментарий"
                  : "Add comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const manualComposerSection = quickComposeMode ? (
    <section>{composerContent}</section>
  ) : (
    <section className={`${illnessPanelSoftClass} space-y-4 rounded-[28px] p-4 sm:p-5`}>
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-foreground">
          {language === "ru" ? "Быстрые записи" : "Quick logs"}
        </h4>
        <p className="mt-1 text-sm text-muted">
          {language === "ru" ? "Температура, приёмы и заметки." : "Temperature, doses and notes."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link
          to={`/children/${childId}/illness?focus=temperature`}
          className={`${appPillActionClass} w-full`}
        >
          {language === "ru" ? "+ Температура" : "+ Temperature"}
        </Link>
        <Link
          to={`/children/${childId}/illness?focus=administration`}
          className={`${appPillActionClass} w-full`}
        >
          {language === "ru" ? "+ Приём" : "+ Dose"}
        </Link>
        <Link
          to={`/children/${childId}/illness?focus=comment`}
          className={`${appPillActionClass} w-full`}
        >
          {language === "ru" ? "+ Заметка" : "+ Note"}
        </Link>
      </div>
    </section>
  );

  const timelineSection = (
    <section className={`${illnessPanelSoftClass} space-y-4 rounded-[28px] p-4 sm:p-5`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-foreground">
            {language === "ru" ? "Лента наблюдения" : "Tracking timeline"}
          </h4>
          <p className="mt-1 text-sm text-muted">
            {language === "ru"
              ? "Температуры, лекарства и заметки в одном месте."
              : "Temperatures, doses and notes in one place."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/children/${childId}/illness?focus=timeline`}
            className={`${appPillActionClass} px-4`}
          >
            {language === "ru" ? "К ленте" : "Open timeline"}
          </Link>
        </div>
      </div>

      {timelineItems.length > 0 ? (
        <div>
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            {language === "ru" ? "Записей" : "Entries"}: {timelineItems.length}
          </span>
        </div>
      ) : null}
    </section>
  );

  const reminderOverviewSection =
    episode.medicationMode === "guided" ? (
      <section className={`${illnessPanelSoftClass} space-y-4 rounded-[28px] p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-foreground">
              {language === "ru" ? "Напоминания о приёме" : "Dose reminders"}
            </h4>
            <p className="mt-1 text-sm text-muted">
              {language === "ru"
                ? "Приёмы по интервалу и статус на сейчас."
                : "Dose intervals and their current status."}
            </p>
          </div>
          <Link
            to={
              medicationPlans.length > 0
                ? `/children/${childId}/illness?focus=reminders`
                : `/children/${childId}/illness?focus=reminder-create`
            }
            className={`${illnessCompactSecondaryButtonClass} w-full self-start sm:w-auto`}
          >
            {medicationPlans.length > 0
              ? language === "ru"
                ? "Напоминания"
                : "Reminders"
              : language === "ru"
                ? "Добавить напоминание"
                : "Add reminder"}
          </Link>
        </div>

        {reminderLead ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>
              {language === "ru" ? "Активных напоминаний" : "Active reminders"}:{" "}
              <span className="font-semibold text-foreground">{medicationPlans.length}</span>
            </span>
            <span className="text-foreground/80">
              {language === "ru" ? "Ближайшее" : "Next"}:{" "}
              {reminderLead.plan.customMedicineName ??
                reminderLead.medicine?.medicineName ??
                (language === "ru" ? "Лекарство" : "Medicine")}
            </span>
          </div>
        ) : null}
      </section>
    ) : null;

  if (quickComposeMode) {
    if (composerMode === "temperature") {
      return (
        <div className="min-w-0 space-y-5">
          <SectionTitle
            title={`${language === "ru" ? "Температура" : "Temperature"} · ${childName}`}
            subtitle={
              language === "ru"
                ? "Сохраните новый замер и сразу сверяйтесь с последними значениями."
                : "Save a new reading and immediately check the latest values."
            }
          />

          {quickComposeSuccessMessage ? (
            <div className="soft-note-info rounded-[20px] px-4 py-3 text-sm">
              {quickComposeSuccessMessage}
            </div>
          ) : null}

          <section className="soft-panel rounded-[28px] p-4 sm:p-5">
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
          </section>

          <section className="space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <h2 className="app-card-title text-[1.05rem] sm:text-[1.15rem]">
                  {language === "ru" ? "Последние замеры" : "Recent readings"}
                </h2>
              </div>
              <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
                {temperatureEntries.length}{" "}
                {language === "ru"
                  ? temperatureEntries.length === 1
                    ? "запись"
                    : temperatureEntries.length < 5
                      ? "записи"
                      : "записей"
                  : temperatureEntries.length === 1
                    ? "entry"
                    : "entries"}
              </span>
            </div>

            {temperatureEntries.length > 0 ? (
              <div className={illnessListClass}>
                {temperatureEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
                  >
                    <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
                      <span className="block leading-4 text-foreground">
                        {formatChildTime(entry.measuredAt)}
                      </span>
                      <span className="block truncate text-[0.68rem] leading-4">
                        {formatChildDate(entry.measuredAt, language, { month: "short" })}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            entry.valueCelsius >= 38 ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          aria-hidden="true"
                        />
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {entry.valueCelsius.toFixed(1)}°C
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                        {entry.valueCelsius >= 38
                          ? language === "ru"
                            ? "Нужен контроль температуры"
                            : "Keep an eye on temperature"
                          : language === "ru"
                            ? "Замер сохранён"
                            : "Reading saved"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
                {language === "ru"
                  ? "Пока нет ни одного замера температуры."
                  : "No temperature readings yet."}
              </div>
            )}
          </section>
        </div>
      );
    }

    if (composerMode === "administration") {
      return (
        <div className="min-w-0 space-y-5">
          <SectionTitle
            title={language === "ru" ? "Приём" : "Dose"}
            subtitle={
              language === "ru"
                ? "Быстро отметьте лекарство и дозу, если она известна."
                : "Quickly log the medicine and dose if you know it."
            }
          />

          {quickComposeSuccessMessage ? (
            <div className="soft-note-info rounded-[20px] px-4 py-3 text-sm">
              {quickComposeSuccessMessage}
            </div>
          ) : null}

          <section className="soft-panel rounded-[28px] p-4 sm:p-5">
            <div className="space-y-4">
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
              {addAdminMutation.isError ? (
                <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
                  {(addAdminMutation.error as { response?: { data?: { detail?: string } } })
                    .response?.data?.detail ??
                    (language === "ru"
                      ? "Ошибка записи. Проверь срок годности и срок после вскрытия."
                      : "Failed to save. Check the expiry date and the after-opening limit.")}
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <h2 className="app-card-title text-[1.05rem] sm:text-[1.15rem]">
                  {language === "ru" ? "Последние приёмы" : "Recent doses"}
                </h2>
              </div>
              <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
                {administrations.length}{" "}
                {language === "ru"
                  ? administrations.length === 1
                    ? "запись"
                    : administrations.length < 5
                      ? "записи"
                      : "записей"
                  : administrations.length === 1
                    ? "entry"
                    : "entries"}
              </span>
            </div>

            {administrations.length > 0 ? (
              <div className={illnessListClass}>
                {administrations.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
                  >
                    <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
                      <span className="block leading-4 text-foreground">
                        {formatChildTime(entry.administeredAt)}
                      </span>
                      <span className="block truncate text-[0.68rem] leading-4">
                        {formatChildDate(entry.administeredAt, language, { month: "short" })}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {entry.customMedicineName ??
                            (language === "ru" ? "Приём лекарства" : "Dose logged")}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                        {[entry.amount || null, entry.reason || null].filter(Boolean).join(" · ") ||
                          (language === "ru" ? "Запись сохранена" : "Dose saved")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
                {language === "ru" ? "Пока нет ни одного приёма." : "No doses logged yet."}
              </div>
            )}
          </section>
        </div>
      );
    }

    if (composerMode === "comment") {
      return (
        <div className="min-w-0 space-y-5">
          <SectionTitle
            title={language === "ru" ? "Заметка" : "Note"}
            subtitle={
              language === "ru"
                ? "Добавьте короткое наблюдение о состоянии ребёнка."
                : "Add a short note about the child's current condition."
            }
          />

          {quickComposeSuccessMessage ? (
            <div className="soft-note-info rounded-[20px] px-4 py-3 text-sm">
              {quickComposeSuccessMessage}
            </div>
          ) : null}

          <section className="soft-panel rounded-[28px] p-4 sm:p-5">
            <div className="space-y-4">
              <div className="grid gap-3">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    language === "ru"
                      ? "Например: к вечеру бодрее, после сна снова температура."
                      : "Example: more active by evening, fever came back after sleep."
                  }
                  className={illnessCompactTextareaClass}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!commentText.trim()) return;
                      addCommentMutation.mutate();
                    }}
                    disabled={addCommentMutation.isPending || !commentText.trim()}
                    className={illnessCompactPrimaryButtonClass}
                  >
                    {addCommentMutation.isPending
                      ? language === "ru"
                        ? "Сохраняем…"
                        : "Saving…"
                      : language === "ru"
                        ? "Добавить заметку"
                        : "Add note"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <h2 className="app-card-title text-[1.05rem] sm:text-[1.15rem]">
                  {language === "ru" ? "Последние заметки" : "Recent notes"}
                </h2>
              </div>
              <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
                {comments.length}{" "}
                {language === "ru"
                  ? comments.length === 1
                    ? "запись"
                    : comments.length < 5
                      ? "записи"
                      : "записей"
                  : comments.length === 1
                    ? "entry"
                    : "entries"}
              </span>
            </div>

            {comments.length > 0 ? (
              <div className={illnessListClass}>
                {comments.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-start gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
                  >
                    <span className="min-w-0 pt-0.5 text-xs font-semibold tabular-nums text-muted">
                      <span className="block leading-4 text-foreground">
                        {formatChildTime(entry.createdAt)}
                      </span>
                      <span className="block truncate text-[0.68rem] leading-4">
                        {formatChildDate(entry.createdAt, language, { month: "short" })}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {language === "ru" ? "Наблюдение" : "Observation"}
                        </p>
                      </div>
                      <p className="mt-1 break-words text-sm leading-6 text-muted">{entry.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
                {language === "ru" ? "Пока нет ни одной заметки." : "No notes yet."}
              </div>
            )}
          </section>
        </div>
      );
    }
  }

  if (quickTimelineMode) {
    return (
      <div className="min-w-0 space-y-5">
        <SectionTitle
          title={language === "ru" ? "Лента" : "Timeline"}
          subtitle={
            language === "ru"
              ? "Все температуры, приёмы и заметки по текущему наблюдению."
              : "All temperatures, doses and notes for the current tracking session."
          }
        />

        <section className={`${illnessPanelSoftClass} space-y-4 rounded-[28px] p-4 sm:p-5`}>
          <div className="grid gap-2">
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ["all", language === "ru" ? "Все" : "All", null],
                  ["temperature", language === "ru" ? "Темп." : "Temp", "bg-rose-500"],
                  ["administration", language === "ru" ? "Приемы" : "Doses", "bg-sky-500"],
                  ["comment", language === "ru" ? "Заметки" : "Notes", "bg-sky-500"],
                ] as const
              ).map(([key, label, dotClass]) => {
                const isActiveFilter = timelineFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTimelineFilter(key)}
                    className={`app-profile-action inline-flex min-h-[2.45rem] w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-1 text-[0.76rem] font-bold tracking-[-0.02em] leading-none transition sm:min-h-[2.5rem] sm:text-[0.78rem] ${
                      isActiveFilter
                        ? "app-profile-action--active soft-pill-warning"
                        : "soft-pill bg-[color:color-mix(in_srgb,var(--color-card)_90%,transparent)] text-foreground/80 shadow-none"
                    }`}
                  >
                    {dotClass ? (
                      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                    ) : null}
                    <span className="min-w-0 truncate text-center">{label}</span>
                  </button>
                );
              })}
            </div>
            {timelineActorOptions.length > 0 ? (
              <div className="grid gap-2">
                <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted/85">
                  {language === "ru" ? "Кто записал" : "Who logged it"}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {["all", ...timelineActorOptions].map((actor) => {
                    const isAll = actor === "all";
                    const isActiveActor = timelineActorFilter === actor;
                    return (
                      <button
                        key={actor}
                        type="button"
                        onClick={() => setTimelineActorFilter(actor)}
                        className={`inline-flex min-h-[2.28rem] min-w-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-1 text-[0.74rem] font-semibold leading-none transition sm:min-h-[2.34rem] sm:text-[0.76rem] ${
                          isActiveActor
                            ? "soft-pill-warning text-foreground shadow-[0_12px_28px_-22px_rgba(242,163,72,0.85)]"
                            : "soft-pill text-foreground/75 shadow-none"
                        }`}
                      >
                        {isAll ? null : (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                        )}
                        <span className="min-w-0 truncate text-center">
                          {isAll ? (language === "ru" ? "Все" : "All") : actor}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <EpisodeTimelineList items={visibleTimelineItems} language={language} />
        </section>
      </div>
    );
  }

  if (quickReminderMode) {
    return (
      <div className="min-w-0 space-y-5">
        <SectionTitle
          title={language === "ru" ? "Напоминания" : "Reminders"}
          subtitle={
            language === "ru"
              ? "Список схем приёма для текущего наблюдения."
              : "Dose plans for the current tracking session."
          }
          action={
            <Link
              to={`/children/${childId}/illness?focus=reminder-create`}
              className={illnessCompactSecondaryButtonClass}
            >
              {language === "ru" ? "Добавить" : "Add"}
            </Link>
          }
        />

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
              reason: language === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
            })
          }
          isSubmittingAdministration={addAdminMutation.isPending}
        />
      </div>
    );
  }

  if (quickReminderDetailMode) {
    if (!selectedReminderItem) {
      return (
        <div className="min-w-0 space-y-5">
          <SectionTitle
            title={language === "ru" ? "Напоминание" : "Reminder"}
            subtitle={
              language === "ru"
                ? "Выбранное напоминание не найдено."
                : "The selected reminder could not be found."
            }
            action={
              <Link
                to={`/children/${childId}/illness?focus=reminders`}
                className={illnessCompactSecondaryButtonClass}
              >
                {language === "ru" ? "К списку" : "Back"}
              </Link>
            }
          />

          <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
            {language === "ru" ? "Напоминание не найдено." : "Reminder not found."}
          </div>
        </div>
      );
    }

    return (
      <div
        className={isReminderCabinetPickerOpen ? "min-w-0 overflow-hidden" : "min-w-0 space-y-5"}
      >
        {!isReminderCabinetPickerOpen ? (
          <SectionTitle
            title={
              isReminderEditing
                ? language === "ru"
                  ? `${editingReminderName ?? selectedReminderItem.plan.customMedicineName ?? selectedReminderItem.medicine?.medicineName ?? "Лекарство"} · Изменить`
                  : `${editingReminderName ?? selectedReminderItem.plan.customMedicineName ?? selectedReminderItem.medicine?.medicineName ?? "Medicine"} · Edit`
                : language === "ru"
                  ? "Напоминание"
                  : "Reminder"
            }
            subtitle={
              isReminderEditing
                ? language === "ru"
                  ? "Обновите схему приёма и упаковку."
                  : "Update the schedule and the selected pack."
                : language === "ru"
                  ? "Параметры и история выбранного напоминания."
                  : "Selected reminder details and history."
            }
            action={
              <Link
                to={`/children/${childId}/illness?focus=reminders`}
                className={illnessCompactSecondaryButtonClass}
              >
                {language === "ru" ? "К списку" : "Back"}
              </Link>
            }
          />
        ) : null}

        <div className="space-y-4">
          <MedicationPlanDetail
            item={selectedReminderItem}
            childId={childId}
            latestWeight={latestWeight}
            isSubmittingAdministration={addAdminMutation.isPending}
            isUpdating={updatePlanMutation.isPending}
            isDeleting={deletePlanMutation.isPending}
            medicines={householdMedicines}
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
        </div>
      </div>
    );
  }

  if (quickReminderCreateMode) {
    return (
      <div
        className={isReminderCabinetPickerOpen ? "min-w-0 overflow-hidden" : "min-w-0 space-y-5"}
      >
        {!isReminderCabinetPickerOpen ? (
          <SectionTitle
            title={language === "ru" ? "Новое напоминание" : "New reminder"}
            subtitle={language === "ru" ? "Настройте схему приёма." : "Set up the dosing schedule."}
            action={
              <Link
                to={`/children/${childId}/illness?focus=reminders`}
                className={illnessCompactSecondaryButtonClass}
              >
                {language === "ru" ? "К списку" : "Back"}
              </Link>
            }
          />
        ) : null}

        <div className="space-y-4">
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
            submitLabel={language === "ru" ? "Сохранить напоминание" : "Save reminder"}
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
        </div>
      </div>
    );
  }

  return (
    <div className="soft-panel rounded-[30px]">
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        title={
          language === "ru" ? `Закрыть наблюдение · ${childName}` : `Close tracking · ${childName}`
        }
        description={
          language === "ru"
            ? "Текущее наблюдение будет завершено и попадёт в историю. При необходимости новое наблюдение можно будет начать заново."
            : "This tracking session will be closed and moved to history. You can start a new one later if needed."
        }
        confirmLabel={language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
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
                {language === "ru"
                  ? "Быстрые записи, напоминания и лента наблюдения."
                  : "Quick logs, reminders and the tracking timeline."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCloseConfirmOpen(true)}
              className={`${appBtnDangerClass} hidden sm:inline-flex`}
            >
              {language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
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
              {language === "ru"
                ? "Быстрые записи, напоминания и лента наблюдения."
                : "Quick logs, reminders and the tracking timeline."}
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
              className={`${appBtnDangerClass} w-full`}
            >
              {language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
