import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { RowSurface } from "@shared/components/Surface";
import { useNow } from "@shared/hooks/useNow";
import type { Child, FeedingRecord, IllnessEpisode, SleepSession, WeightEntry } from "@shared/types/api";
import { useIllnessLiveWidgetState } from "@client/hooks/useIllnessLiveWidgetState";
import { buildScopedLiveActivityPreferences } from "@shared/utils/liveActivityAccess";
import {
  startSleepSessionResilient,
  stopFeedingRecordResilient,
  stopSleepSessionResilient,
} from "@shared/utils/offlineCareSync";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";
import {
  childActionSecondaryClass,
  childActionSuccessClass,
  commonLoading,
  formatElapsedDuration,
  formatIllnessActiveLabel,
  formatTimeOnly,
  formatWeightValue,
} from "./shared";
import { FeedingStopDialog } from "./FeedingDialogs";
import { syncFeedingLiveActivity, syncSleepLiveActivity } from "@shared/utils/liveActivities";

export function ChildCard({
  child,
  activeEpisode,
  activeEpisodeStartedAt,
  latestWeightEntry,
  activeSleep,
  activeFeeding,
  onAddFeeding,
  onStartEpisode,
  isStartingEpisode,
  hasActiveEpisode,
  canActChild,
  canEditChild,
  canUseLiveActivities,
  planLocksChildActions,
  isPrimaryFreeChild,
  onLockedActionAttempt,
  currentAccountId,
  copy,
  language,
  t,
}: {
  child: Child;
  activeEpisode: Pick<IllnessEpisode, "id" | "createdByAccountId"> | null;
  activeEpisodeStartedAt: string | null;
  latestWeightEntry: WeightEntry | null;
  activeSleep: SleepSession | null;
  activeFeeding: FeedingRecord | null;
  onAddFeeding: () => void;
  onStartEpisode: () => void;
  isStartingEpisode: boolean;
  hasActiveEpisode: boolean;
  canActChild: boolean;
  canEditChild: boolean;
  canUseLiveActivities: boolean;
  planLocksChildActions: boolean;
  isPrimaryFreeChild: boolean;
  onLockedActionAttempt: () => void;
  currentAccountId: string | null;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"];
  language: "ru" | "en";
  t: (text: string, variables?: Record<string, string | number>) => string;
}) {
  const hasLiveObservation = useIllnessLiveWidgetState(activeEpisode, currentAccountId);
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const latestWeightLabel = latestWeightEntry
    ? formatWeightValue(latestWeightEntry.valueKg, language)
    : null;
  const now = useNow(activeSleep || activeFeeding || hasActiveEpisode ? 1_000 : 60_000);
  const queryClient = useQueryClient();
  const [isStopSleepConfirmOpen, setIsStopSleepConfirmOpen] = useState(false);
  const [isStopFeedingDialogOpen, setIsStopFeedingDialogOpen] = useState(false);
  const sleepMutation = useMutation({
    mutationFn: async () => {
      if (activeSleep) {
        return stopSleepSessionResilient({ childId: child.id, sessionId: activeSleep.id });
      }
      return startSleepSessionResilient({ childId: child.id, currentAccountId });
    },
    onSuccess: (nextSleep) => {
      queryClient.invalidateQueries({ queryKey: ["sleep-session-active", child.id] });
      queryClient.invalidateQueries({ queryKey: ["sleep-sessions", child.id] });
      setIsStopSleepConfirmOpen(false);
      void syncSleepLiveActivity(
        child,
        nextSleep,
        language,
        buildScopedLiveActivityPreferences("sleep", canUseLiveActivities),
        currentAccountId
      );
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
      return stopFeedingRecordResilient({ childId: child.id, recordId: activeFeeding.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active", child.id] });
      queryClient.invalidateQueries({ queryKey: ["feeding-records", child.id] });
      setIsStopFeedingDialogOpen(false);
      void syncFeedingLiveActivity(
        child,
        null,
        language,
        buildScopedLiveActivityPreferences("feeding", canUseLiveActivities),
        currentAccountId
      );
    },
  });
  const activeFeedingStartedAt = activeFeeding?.startedAt ?? activeFeeding?.recordedAt ?? null;
  const activeFeedingElapsedLabel = activeFeedingStartedAt
    ? formatElapsedDuration(activeFeedingStartedAt, now, language)
    : null;
  const secondaryMeta = [
    ageLabel,
    latestWeightLabel ? `${copy.childCard.weight} ${latestWeightLabel}` : null,
  ].filter(Boolean) as string[];
  const quickActionClass = childActionSecondaryClass;
  const activeFeedingActionClass = childActionSuccessClass;
  const activeSleepActionClass = childActionSuccessClass;
  const hasOpenObservation = hasActiveEpisode;

  return (
    <li data-child-card-id={child.id}>
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
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="app-card-title">{child.name}</h2>
                  {hasOpenObservation ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-danger)_14%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-danger)_74%,var(--color-foreground))]">
                      {activeEpisodeStartedAt
                        ? formatIllnessActiveLabel(activeEpisodeStartedAt, now, language)
                        : copy.childCard.activeObservation}
                    </span>
                  ) : null}
                  {hasOpenObservation && canUseLiveActivities && hasLiveObservation ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-success)_82%,var(--color-foreground))]">
                      Live On
                    </span>
                  ) : null}
                  {planLocksChildActions ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-warning)_18%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-warning)_78%,var(--color-foreground))]">
                      {copy.lockedChildBadge}
                    </span>
                  ) : isPrimaryFreeChild ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-success)_80%,var(--color-foreground))]">
                      {copy.primaryChildBadge}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-muted">
                  {secondaryMeta.map((item, index) => (
                    <span key={item} className="inline-flex max-w-full items-center gap-2">
                      {index > 0 ? (
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_32%,transparent)]"
                        />
                      ) : null}
                      <span className="whitespace-normal break-words">{item}</span>
                    </span>
                  ))}
                </div>
              </div>
              <Link
                to={`/children/${child.id}`}
                state={{ pmChildProfileBackTarget: "children" }}
                className={`${quickActionClass} shrink-0`}
              >
                {copy.childCard.profile}
              </Link>
            </div>
          </div>

          <div className="space-y-2.5">
            {child.babyModeEnabled ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/children/${child.id}/feeding`}
                  data-live-action-target={`feeding:${child.id}`}
                  className={`${activeFeeding ? activeFeedingActionClass : quickActionClass}`}
                  aria-disabled={!canActChild && !activeFeeding}
                  onClick={(event) => {
                    if (planLocksChildActions) {
                      event.preventDefault();
                      onLockedActionAttempt();
                      return;
                    }
                    if (!canActChild && !activeFeeding) {
                      event.preventDefault();
                      return;
                    }
                    event.preventDefault();
                    if (activeFeeding) {
                      setIsStopFeedingDialogOpen(true);
                      return;
                    }
                    onAddFeeding();
                  }}
                >
                  {activeFeeding
                    ? t(copy.childCard.feedingInProgress, {
                        elapsed: activeFeedingElapsedLabel ?? "00:00",
                      })
                    : copy.childCard.addFeeding}
                </Link>
                <button
                  type="button"
                  data-live-action-target={`sleep:${child.id}`}
                  onClick={() => {
                    if (planLocksChildActions) {
                      onLockedActionAttempt();
                      return;
                    }
                    if (!canActChild && !activeSleep) {
                      return;
                    }
                    if (activeSleep) {
                      setIsStopSleepConfirmOpen(true);
                      return;
                    }
                    sleepMutation.mutate();
                  }}
                  disabled={sleepMutation.isPending || (!canActChild && !activeSleep)}
                  className={`${activeSleep ? activeSleepActionClass : quickActionClass} disabled:opacity-60`}
                >
                  {sleepMutation.isPending
                    ? activeSleep
                      ? copy.childCard.sleepStopping
                      : copy.childCard.addSleep
                    : activeSleep
                      ? t(copy.childCard.sleepInProgress, {
                          elapsed: activeSleepElapsedLabel ?? "00:00",
                        })
                      : copy.childCard.addSleep}
                </button>
              </div>
            ) : null}
            <div>
              {hasOpenObservation ? (
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={onStartEpisode}
                    className={`${quickActionClass} w-full disabled:opacity-50`}
                  >
                    {copy.childCard.openObservation}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (planLocksChildActions) {
                      onLockedActionAttempt();
                      return;
                    }
                    onStartEpisode();
                  }}
                  disabled={isStartingEpisode || (!canEditChild && !planLocksChildActions)}
                  className={`${quickActionClass} w-full disabled:opacity-50`}
                >
                  {isStartingEpisode ? commonLoading(language) : copy.childCard.startObservation}
                </button>
              )}
            </div>
          </div>
        </div>
      </RowSurface>
    </li>
  );
}
