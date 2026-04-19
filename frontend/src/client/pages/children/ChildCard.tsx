import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startSleepSession, stopSleepSession } from "@shared/api/sleepSessions";
import { stopFeedingRecord } from "@shared/api/feedingRecords";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { RowSurface } from "@shared/components/Surface";
import { useNow } from "@shared/hooks/useNow";
import type { Child, FeedingRecord, SleepSession, WeightEntry } from "@shared/types/api";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";
import { formatChildDate } from "@client/utils/childDateFormat";
import {
  childActionPrimaryClass,
  childActionSecondaryClass,
  childActionSuccessClass,
  commonLoading,
  formatElapsedDuration,
  formatTimeOnly,
  formatWeightValue,
} from "./shared";
import { FeedingStopDialog } from "./FeedingDialogs";

export function ChildCard({
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
  activeSleep: SleepSession | null;
  activeFeeding: FeedingRecord | null;
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
  const secondaryMeta = [
    ageLabel,
    latestWeightLabel ? `${copy.childCard.weight} ${latestWeightLabel}` : null,
  ].filter(Boolean) as string[];
  const quickActionClass = childActionSecondaryClass;
  const activeQuickActionClass = childActionPrimaryClass;
  const activeFeedingActionClass = childActionSuccessClass;
  const activeSleepActionClass = childActionSuccessClass;

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
              <div className="min-w-0 space-y-1.5">
                <h2 className="app-card-title">{child.name}</h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-muted">
                  {hasActiveEpisode ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-danger)_14%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-danger)_74%,var(--color-foreground))]">
                      {activeEpisodeStartedAt
                        ? t(copy.childCard.activeSince, {
                            date: formatChildDate(activeEpisodeStartedAt, language),
                          })
                        : copy.childCard.activeObservation}
                    </span>
                  ) : null}
                  {secondaryMeta.map((item, index) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      {index > 0 ? (
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_32%,transparent)]"
                        />
                      ) : null}
                      <span className="truncate">{item}</span>
                    </span>
                  ))}
                </div>
              </div>
              <Link to={`/children/${child.id}`} className={`${quickActionClass} shrink-0`}>
                {copy.childCard.profile}
              </Link>
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
                  className={activeFeeding ? activeFeedingActionClass : quickActionClass}
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
