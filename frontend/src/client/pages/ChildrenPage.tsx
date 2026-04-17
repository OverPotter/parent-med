/**
 * Дети: создание, редактирование, удаление и переход к истории болезней.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import {
  createFeedingRecord,
  fetchActiveFeedingRecordByChildId,
  startFeedingRecord,
  stopFeedingRecord,
} from "@shared/api/feedingRecords";
import {
  fetchActiveSleepSessionByChildId,
  startSleepSession,
  stopSleepSession,
} from "@shared/api/sleepSessions";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, WeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { FeedingRecordForm } from "@client/components/FeedingRecordForm";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";
import {
  getCurrentLocalDateInputValue,
  getCurrentLocalTimeInputValue,
  toApiDateTime,
} from "@client/utils/feedingRecordForm";

type FeedingDialogState = {
  child: Child;
};

export function ChildrenPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).childrenPage;
  const common = getChildrenCopy(language).common;
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [feedingDialog, setFeedingDialog] = useState<FeedingDialogState | null>(null);
  const liveQueryOptions = useLiveQueryOptions(10000);

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });

  const latestWeightQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["weight-entry-latest", child.id],
      queryFn: () => fetchLatestWeightEntryByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });

  const activeSleepQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["sleep-session-active", child.id],
      queryFn: () => fetchActiveSleepSessionByChildId(child.id),
      enabled: !!child.id && child.babyModeEnabled,
      ...liveQueryOptions,
    })),
  });

  const activeFeedingQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["feeding-record-active", child.id],
      queryFn: () => fetchActiveFeedingRecordByChildId(child.id),
      enabled: !!child.id && child.babyModeEnabled,
      ...liveQueryOptions,
    })),
  });

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="app-title">{copy.title}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        compactOnMobile
        hideOnMobile
        className="children-intro-hero"
        action={
          <button
            type="button"
            onClick={() => navigate("/children/new")}
            className={[
              "soft-pill-warning app-profile-action app-profile-action--active min-h-[2.65rem] w-full sm:w-auto",
              children.length > 0 ? "hidden sm:inline-flex" : "inline-flex",
            ].join(" ")}
          >
            {copy.addChild}
          </button>
        }
      />

      <div className="app-mobile-section-intro sm:hidden">
        <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
        <p className="app-mobile-section-intro__hint">{copy.mobileHint}</p>
      </div>

      {feedingDialog ? (
        <FeedingRecordDialog
          child={feedingDialog.child}
          copy={copy.childCard}
          language={language}
          onClose={() => setFeedingDialog(null)}
        />
      ) : null}

      {isLoading && <p className="text-muted">{common.loading}</p>}
      {error && (
        <p className="soft-note-danger">
          {(error as { message?: string }).message ?? copy.loadError}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && (
        <EmptyState className="text-foreground">
          <div className="space-y-4">
            <p>{copy.empty}</p>
            <button
              type="button"
              onClick={() => navigate("/children/new")}
              className="soft-pill-warning app-profile-action app-profile-action--active min-h-[2.65rem] w-full sm:w-auto"
            >
              {copy.addFirstChild}
            </button>
          </div>
        </EmptyState>
      )}

      {children.length > 0 && (
        <>
          <ul className="grid gap-4">
            {children.map((child, index) => {
              const activeEpisode = activeEpisodeQueries[index]?.data ?? null;

              return (
                <ChildCard
                  key={child.id}
                  child={child}
                  activeEpisodeStartedAt={activeEpisode?.startedAt ?? null}
                  latestWeightEntry={latestWeightQueries[index]?.data ?? null}
                  activeSleep={activeSleepQueries[index]?.data ?? null}
                  activeFeeding={activeFeedingQueries[index]?.data ?? null}
                  onAddFeeding={() => {
                    if (isDesktop) {
                      setFeedingDialog({ child });
                      return;
                    }
                    navigate(`/children/${child.id}/feeding/new`);
                  }}
                  onStartEpisode={() => {
                    if (activeEpisode) {
                      navigate("/illnesses/active");
                      return;
                    }
                    navigate(`/children/${child.id}/illness?mode=create`);
                  }}
                  isStartingEpisode={false}
                  hasActiveEpisode={!!activeEpisode}
                  copy={copy}
                  language={language}
                  t={t}
                />
              );
            })}
          </ul>

          <Surface className="soft-panel-muted p-4 sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-card-title">{copy.addAnotherPromptTitle}</p>
                {copy.addAnotherPromptText ? (
                  <p className="mt-1 text-sm text-muted">{copy.addAnotherPromptText}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => navigate("/children/new")}
                className="soft-pill app-profile-action min-h-[2.45rem]"
              >
                {copy.addButtonShort}
              </button>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}

function ChildCard({
  child,
  activeEpisodeStartedAt,
  latestWeightEntry,
  activeSleep,
  activeFeeding,
  onAddFeeding,
  onStartEpisode,
  isStartingEpisode,
  hasActiveEpisode,
  copy,
  language,
  t,
}: {
  child: Child;
  activeEpisodeStartedAt: string | null;
  latestWeightEntry: WeightEntry | null;
  activeSleep: import("@shared/types/api").SleepSession | null;
  activeFeeding: import("@shared/types/api").FeedingRecord | null;
  onAddFeeding: () => void;
  onStartEpisode: () => void;
  isStartingEpisode: boolean;
  hasActiveEpisode: boolean;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"];
  language: "ru" | "en";
  t: (text: string, variables?: Record<string, string | number>) => string;
}) {
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const latestWeightLabel = latestWeightEntry
    ? formatWeightValue(latestWeightEntry.valueKg, language)
    : null;
  const now = useNow(activeSleep || activeFeeding ? 1_000 : 60_000);
  const queryClient = useQueryClient();
  const [isStopSleepConfirmOpen, setIsStopSleepConfirmOpen] = useState(false);
  const [isStopFeedingDialogOpen, setIsStopFeedingDialogOpen] = useState(false);
  const sleepMutation = useMutation({
    mutationFn: async () => {
      if (activeSleep) {
        return stopSleepSession(activeSleep.id);
      }
      return startSleepSession(child.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-session-active", child.id] });
      setIsStopSleepConfirmOpen(false);
    },
  });
  const activeSleepElapsedLabel = activeSleep
    ? formatElapsedDuration(activeSleep.startedAt, now, language)
    : null;
  const activeSleepStartedLabel = activeSleep
    ? formatTimeOnly(activeSleep.startedAt, language)
    : "";
  const activeSleepCurrentTimeLabel = activeSleep ? formatTimeOnly(now, language) : "";
  const feedingMutation = useMutation({
    mutationFn: async () => {
      if (!activeFeeding) {
        return null;
      }
      return stopFeedingRecord(activeFeeding.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active", child.id] });
      queryClient.invalidateQueries({ queryKey: ["feeding-records", child.id] });
      setIsStopFeedingDialogOpen(false);
    },
  });
  const activeFeedingStartedAt = activeFeeding?.startedAt ?? activeFeeding?.recordedAt ?? null;
  const activeFeedingElapsedLabel = activeFeedingStartedAt
    ? formatElapsedDuration(activeFeedingStartedAt, now, language)
    : null;
  const primaryMeta = [
    ageLabel,
    latestWeightLabel ? `${copy.childCard.weight} ${latestWeightLabel}` : null,
  ].filter(Boolean) as string[];
  const quickActionClass = "soft-pill app-profile-action";
  const activeQuickActionClass = "soft-pill-warning app-profile-action app-profile-action--active";
  const activeSleepActionClass = "soft-pill-success app-profile-action app-profile-action--active";
  return (
    <li>
      <ConfirmDialog
        isOpen={isStopSleepConfirmOpen && !!activeSleep}
        title={copy.childCard.stopSleepConfirmTitle}
        description={t(copy.childCard.stopSleepConfirmDescription, {
          startedAt: activeSleepStartedLabel,
          currentTime: activeSleepCurrentTimeLabel,
        })}
        confirmLabel={
          sleepMutation.isPending
            ? copy.childCard.sleepStopping
            : copy.childCard.stopSleepConfirmAction
        }
        isPending={sleepMutation.isPending}
        onCancel={() => setIsStopSleepConfirmOpen(false)}
        onConfirm={() => sleepMutation.mutate()}
      />
      {activeFeeding && isStopFeedingDialogOpen ? (
        <FeedingStopDialog
          feeding={activeFeeding}
          copy={copy.childCard}
          isPending={feedingMutation.isPending}
          onClose={() => setIsStopFeedingDialogOpen(false)}
          onConfirm={() => feedingMutation.mutate()}
        />
      ) : null}
      <RowSurface
        className={`children-card-hero ${hasActiveEpisode ? "children-card-hero--active" : ""}`}
      >
        <div className="grid gap-4">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h2 className="app-card-title">{child.name}</h2>
                {hasActiveEpisode ? (
                  <span className="soft-pill-warning inline-flex rounded-full px-2.5 py-1 text-xs">
                    {activeEpisodeStartedAt
                      ? t(copy.childCard.activeSince, {
                          date: formatDate(activeEpisodeStartedAt),
                        })
                      : copy.childCard.activeObservation}
                  </span>
                ) : null}
              </div>
              <Link to={`/children/${child.id}`} className={`${quickActionClass} shrink-0`}>
                {copy.childCard.profile}
              </Link>
            </div>
            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
              {primaryMeta.map((chip) => (
                <span
                  key={chip}
                  className="landing-child-pill shrink-0 rounded-full px-3 py-1.5 text-[0.78rem] sm:px-3.5 sm:text-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {child.babyModeEnabled ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/children/${child.id}/feeding`}
                  onClick={(event) => {
                    event.preventDefault();
                    if (activeFeeding) {
                      setIsStopFeedingDialogOpen(true);
                      return;
                    }
                    onAddFeeding();
                  }}
                  className={activeFeeding ? activeQuickActionClass : quickActionClass}
                >
                  {activeFeeding
                    ? t(copy.childCard.feedingInProgress, {
                        elapsed: activeFeedingElapsedLabel ?? "00:00",
                      })
                    : copy.childCard.addFeeding}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (activeSleep) {
                      setIsStopSleepConfirmOpen(true);
                      return;
                    }
                    sleepMutation.mutate();
                  }}
                  disabled={sleepMutation.isPending}
                  className={`${activeSleep ? activeSleepActionClass : quickActionClass} disabled:opacity-60`}
                >
                  {sleepMutation.isPending
                    ? activeSleep
                      ? copy.childCard.sleepStopping
                      : copy.childCard.sleepStarting
                    : activeSleep
                      ? t(copy.childCard.sleepInProgress, {
                          elapsed: activeSleepElapsedLabel ?? "00:00",
                        })
                      : copy.childCard.addSleep}
                </button>
              </div>
            ) : null}
            <div>
              <button
                type="button"
                onClick={onStartEpisode}
                disabled={isStartingEpisode}
                className={`${hasActiveEpisode ? activeQuickActionClass : quickActionClass} w-full disabled:opacity-50`}
              >
                {hasActiveEpisode
                  ? copy.childCard.openObservation
                  : isStartingEpisode
                    ? commonLoading(language)
                    : copy.childCard.startObservation}
              </button>
            </div>
          </div>
        </div>
      </RowSurface>
    </li>
  );
}

function formatWeightValue(valueKg: number, language: "ru" | "en"): string {
  const unit = language === "ru" ? "кг" : "kg";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} ${unit}`;
}

function commonLoading(language: "ru" | "en") {
  return language === "ru" ? "Открываем…" : "Opening…";
}

function FeedingRecordDialog({
  child,
  copy,
  language,
  onClose,
}: {
  child: Child;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"]["childCard"];
  language: "ru" | "en";
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [feedingType, setFeedingType] = useState<"breast" | "formula">("breast");
  const [breastSide, setBreastSide] = useState<"left" | "right" | "both">("left");
  const [isExpressed, setIsExpressed] = useState(false);
  const [formulaVolume, setFormulaVolume] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [recordedDate, setRecordedDate] = useState(() => getCurrentLocalDateInputValue());
  const [recordedTime, setRecordedTime] = useState(() => getCurrentLocalTimeInputValue());
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createFeedingRecord({
        child_id: child.id,
        feeding_type: feedingType,
        breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
        is_expressed: feedingType === "breast" ? isExpressed : false,
        formula_volume_ml:
          feedingType === "formula" ? Number.parseInt(formulaVolume.trim(), 10) || null : null,
        duration_minutes:
          feedingType === "breast" && durationMinutes.trim()
            ? Number.parseInt(durationMinutes.trim(), 10) || null
            : null,
        recorded_at: toApiDateTime(recordedDate, recordedTime),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", child.id] });
      onClose();
    },
  });

  const startMutation = useMutation({
    mutationFn: () =>
      startFeedingRecord({
        child_id: child.id,
        feeding_type: feedingType,
        breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
        is_expressed: feedingType === "breast" ? isExpressed : false,
        formula_volume_ml:
          feedingType === "formula" ? Number.parseInt(formulaVolume.trim(), 10) || null : null,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", child.id] });
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active", child.id] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={copy.feedingCancel}
        className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-background)_45%,transparent)] backdrop-blur-sm"
        onClick={createMutation.isPending ? undefined : onClose}
      />
      <div className="soft-panel relative z-[161] w-full max-w-[28rem] rounded-[30px] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="space-y-2">
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.03em]">
            {child.name}
          </span>
          <h2 className="app-card-title text-[1.02rem] sm:text-[1.12rem]">
            {copy.feedingDialogTitle}
          </h2>
          <p className="text-sm leading-5 text-muted">{copy.feedingTypeLabel}</p>
        </div>
        <div className="mt-4 space-y-3.5">
          <FeedingRecordForm
            copy={copy}
            language={language}
            feedingType={feedingType}
            breastSide={breastSide}
            isExpressed={isExpressed}
            formulaVolume={formulaVolume}
            durationMinutes={durationMinutes}
            recordedDate={recordedDate}
            recordedTime={recordedTime}
            note={note}
            validationError={validationError}
            timeInputMode="native"
            onFeedingTypeChange={(value) => {
              setFeedingType(value);
              if (value === "formula") {
                setIsExpressed(false);
              }
            }}
            onBreastSideChange={setBreastSide}
            onExpressedChange={setIsExpressed}
            onFormulaVolumeChange={(value) => {
              setFormulaVolume(value);
              setValidationError(null);
            }}
            onDurationMinutesChange={setDurationMinutes}
            onRecordedDateChange={setRecordedDate}
            onRecordedTimeChange={setRecordedTime}
            onNoteChange={setNote}
            onValidationErrorChange={setValidationError}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending || startMutation.isPending}
            className="soft-pill app-profile-action min-h-[2.95rem] px-3 text-center text-[0.86rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:text-[0.89rem]"
          >
            {copy.feedingCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!recordedDate || !recordedTime || !toApiDateTime(recordedDate, recordedTime)) {
                setValidationError(copy.feedingValidationTime);
                return;
              }
              setValidationError(null);
              createMutation.mutate();
            }}
            disabled={createMutation.isPending || startMutation.isPending}
            className="soft-pill app-profile-action min-h-[2.95rem] px-3 text-center text-[0.86rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.05rem] sm:text-[0.89rem]"
          >
            {createMutation.isPending ? copy.feedingSaving : copy.feedingSave}
          </button>
          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              startMutation.mutate();
            }}
            disabled={createMutation.isPending || startMutation.isPending}
            className="soft-pill-success app-profile-action app-profile-action--active min-h-[2.95rem] px-3 text-center text-[0.86rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.05rem] sm:text-[0.89rem]"
          >
            {startMutation.isPending ? copy.feedingStarting : copy.feedingStart}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedingStopDialog({
  feeding,
  copy,
  isPending,
  onClose,
  onConfirm,
}: {
  feeding: import("@shared/types/api").FeedingRecord;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"]["childCard"];
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const typeLabel =
    feeding.feedingType === "breast" ? copy.feedingTypeBreast : copy.feedingTypeFormula;
  return (
    <div className="fixed inset-0 z-[165] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={copy.feedingCancel}
        className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-background)_45%,transparent)] backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />
      <div className="soft-panel relative z-[166] w-full max-w-[25rem] rounded-[28px] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="space-y-2">
          <h2 className="app-card-title text-[1.02rem] sm:text-[1.12rem]">
            {copy.stopFeedingConfirmTitle}
          </h2>
          <p className="text-sm leading-5 text-muted">{copy.stopFeedingConfirmDescription}</p>
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.03em]">
            {typeLabel}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="soft-pill app-profile-action min-h-[2.95rem] px-4 text-[0.86rem] disabled:opacity-50"
          >
            {copy.feedingCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="soft-pill-warning app-profile-action app-profile-action--active min-h-[2.95rem] px-4 text-[0.86rem] disabled:opacity-50"
          >
            {isPending ? copy.feedingSaving : copy.stopFeedingConfirmAction}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeOnly(value: string | number, language: "ru" | "en") {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatElapsedDuration(startedAt: string, now: number, _language: "ru" | "en") {
  const startedAtMs = Date.parse(startedAt);
  if (Number.isNaN(startedAtMs)) {
    return "00:00";
  }
  const totalSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
