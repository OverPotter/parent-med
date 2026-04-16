import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { deleteSleepSession, fetchSleepSessionsByChildId } from "@shared/api/sleepSessions";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { SleepSession } from "@shared/types/api";
import { formatDateTime } from "@shared/utils/date";
import { getChildrenCopy } from "@client/i18n/children";
import { useState } from "react";

type RecordsPeriod = "today" | "week" | "month" | "all";

export function ChildSleepPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const queryClient = useQueryClient();
  const [sleepToDelete, setSleepToDelete] = useState<SleepSession | null>(null);
  const [period, setPeriod] = useState<RecordsPeriod>("today");

  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: sleepSessions = [], isLoading: isSleepLoading } = useQuery({
    queryKey: ["sleep-sessions", childId],
    queryFn: () => fetchSleepSessionsByChildId(childId!),
    enabled: !!childId,
  });

  const deleteSleepMutation = useMutation({
    mutationFn: deleteSleepSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-sessions", childId] });
      queryClient.invalidateQueries({ queryKey: ["sleep-session-active", childId] });
      setSleepToDelete(null);
    },
  });

  if (!childId || isChildLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  if (!child.babyModeEnabled) {
    return <Navigate to={`/children/${child.id}`} replace />;
  }

  const hasActiveSleep = sleepSessions.some((item) => item.status === "active");
  const filteredSessions = sleepSessions.filter((session) =>
    matchesPeriod(session.startedAt, period)
  );
  const averagePerDay = getAveragePerDay(
    filteredSessions.map((session) => session.startedAt),
    period
  );
  const completedDurations = filteredSessions
    .map((session) => session.durationMinutes)
    .filter(isNumber);
  const averageDuration = getAverage(completedDurations);

  return (
    <div className="min-w-0 space-y-6">
      <ConfirmDialog
        isOpen={!!sleepToDelete}
        title={copy.sleepSectionDeleteTitle}
        description={copy.sleepSectionDeleteDescription}
        confirmLabel={
          deleteSleepMutation.isPending ? copy.sleepSectionDeleteSuccess : copy.sleepSectionDeleteConfirm
        }
        cancelLabel={copy.deleteCancel}
        confirmTone="danger"
        isPending={deleteSleepMutation.isPending}
        onCancel={() => setSleepToDelete(null)}
        onConfirm={() => {
          if (sleepToDelete) {
            deleteSleepMutation.mutate(sleepToDelete.id);
          }
        }}
      />

      <div className="px-1">
        <Link
          to={`/children/${child.id}`}
          className="inline-flex text-sm text-primary hover:underline"
        >
          {language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="app-card-title">
              {copy.sleepSection} · {child.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{copy.sleepSectionSubtitle}</p>
          </div>
          {hasActiveSleep ? (
            <span className="soft-pill-warning rounded-full px-3 py-1.5 text-xs">
              {copy.sleepSectionActive}
            </span>
          ) : null}
        </div>

        <Surface className="p-5 sm:p-6">
          <div className="mb-4 space-y-4">
            {isSleepLoading ? <p className="text-sm text-muted">{common.loading}</p> : null}
          <div className="-mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1">
            {[
              { key: "today", label: copy.recordsPeriodToday },
              { key: "week", label: copy.recordsPeriodWeek },
              { key: "month", label: copy.recordsPeriodMonth },
              { key: "all", label: copy.recordsPeriodAll },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPeriod(option.key as RecordsPeriod)}
                className={
                  period === option.key
                    ? "soft-tab-active min-h-[2.2rem] shrink-0 px-3 text-xs"
                    : "soft-tab min-h-[2.2rem] shrink-0 px-3 text-xs"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummaryPill
              label={copy.sleepSummaryAvgPerDay}
              value={formatPerDay(averagePerDay, language)}
            />
            <SummaryPill
              label={copy.sleepSummaryAvgDuration}
              value={formatSleepSummaryDuration(averageDuration, language)}
            />
          </div>
          </div>

          {filteredSessions.length === 0 ? (
            <p className="text-sm text-muted">{copy.sleepSectionEmpty}</p>
          ) : (
            <div className="grid gap-3">
              {filteredSessions.map((session) => (
                <div key={session.id} className="soft-panel-muted rounded-[24px] px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            session.status === "active"
                              ? "soft-pill-warning rounded-full px-3 py-1 text-xs"
                              : "soft-pill rounded-full px-3 py-1 text-xs"
                          }
                        >
                          {session.status === "active"
                            ? copy.sleepStatusActive
                            : copy.sleepStatusCompleted}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <InfoLine label={copy.sleepStartedAt} value={formatDateTime(session.startedAt)} />
                        <InfoLine
                          label={copy.sleepEndedAt}
                          value={
                            session.endedAt ? formatDateTime(session.endedAt) : copy.sleepStatusActive
                          }
                        />
                        <InfoLine
                          label={copy.sleepDuration}
                          value={formatSleepDuration(session.durationMinutes, language, session.status)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSleepToDelete(session)}
                      disabled={deleteSleepMutation.isPending}
                      className="soft-button-secondary app-btn-secondary-md inline-flex min-h-[2.75rem] shrink-0 text-center text-danger disabled:opacity-50"
                    >
                      {copy.sleepSectionDelete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

function matchesPeriod(value: string, period: RecordsPeriod) {
  if (period === "all") {
    return true;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  if (period === "today") {
    return date.toDateString() === now.toDateString();
  }

  const days = period === "week" ? 7 : 30;
  const threshold = new Date(now);
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));
  return date >= threshold;
}

function formatSleepDuration(
  durationMinutes: number | null,
  language: "ru" | "en",
  status: string
) {
  if (durationMinutes === null) {
    return status === "active"
      ? language === "ru"
        ? "Идёт сейчас"
        : "In progress"
      : "—";
  }
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (language === "ru") {
    if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`;
    if (hours > 0) return `${hours} ч`;
    return `${minutes} мин`;
  }
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

function formatSleepSummaryDuration(durationMinutes: number | null, language: "ru" | "en") {
  if (durationMinutes === null || durationMinutes <= 0) {
    return "—";
  }
  const rounded = Math.round(durationMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (language === "ru") {
    if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`;
    if (hours > 0) return `${hours} ч`;
    return `${minutes} мин`;
  }
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

function formatPerDay(value: number | null, language: "ru" | "en") {
  if (value === null) {
    return "—";
  }
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return language === "ru" ? `${rounded} раз` : `${rounded}`;
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAveragePerDay(values: string[], period: RecordsPeriod) {
  if (values.length === 0) {
    return null;
  }

  const uniqueDays = new Set(
    values
      .map((value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
      })
      .filter(Boolean)
  ).size;

  if (uniqueDays === 0) {
    return null;
  }

  if (period === "today") {
    return values.length;
  }

  if (period === "week") {
    return values.length / 7;
  }

  if (period === "month") {
    return values.length / 30;
  }

  return values.length / uniqueDays;
}

function isNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 leading-6 text-foreground">{value}</p>
    </div>
  );
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="soft-panel-muted inline-flex min-h-[3.1rem] min-w-[8.2rem] flex-col items-start justify-center rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3.5 py-2.5">
      <span className="text-[11px] font-medium leading-4 tracking-[0.02em] text-muted">
        {label}
      </span>
      <span className="mt-0.5 text-[0.95rem] font-semibold leading-5 tracking-[-0.025em] text-foreground">
        {value}
      </span>
    </div>
  );
}
