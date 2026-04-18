import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { deleteSleepSession, fetchSleepSessionsByChildId } from "@shared/api/sleepSessions";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { SleepSession } from "@shared/types/api";
import {
  ChildRecordsPeriodSelector,
  getChildRecordsPeriodDayCount,
  getShiftedLocalIsoDate,
  matchesChildRecordsPeriod,
  type ChildRecordsPeriod,
} from "@client/components/ChildRecordsPeriodSelector";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { getChildrenCopy } from "@client/i18n/children";
import {
  formatChildDate,
  formatChildDateTime,
  formatChildTime,
} from "@client/utils/childDateFormat";

export function ChildSleepPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const queryClient = useQueryClient();
  const [sleepToDelete, setSleepToDelete] = useState<SleepSession | null>(null);
  const [period, setPeriod] = useState<ChildRecordsPeriod>("week");
  const [customStartDate, setCustomStartDate] = useState(() => getShiftedLocalIsoDate(-6));
  const [customEndDate, setCustomEndDate] = useState(() => getShiftedLocalIsoDate(0));

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
    matchesChildRecordsPeriod(session.startedAt, period, customStartDate, customEndDate)
  );
  const averagePerDay = getAveragePerDay(
    filteredSessions.map((session) => session.startedAt),
    period,
    customStartDate,
    customEndDate
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
          deleteSleepMutation.isPending
            ? copy.sleepSectionDeleteSuccess
            : copy.sleepSectionDeleteConfirm
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

      <ChildSectionTopBar
        backHref={`/children/${child.id}`}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
      />

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

        <Surface className="relative z-30 overflow-visible p-4 sm:p-5">
          <div className="space-y-4">
            {isSleepLoading ? <p className="text-sm text-muted">{common.loading}</p> : null}
            <ChildRecordsPeriodSelector
              language={language}
              period={period}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onPeriodChange={setPeriod}
              onCustomRangeChange={(startDate, endDate) => {
                setCustomStartDate(startDate);
                setCustomEndDate(endDate);
              }}
            />
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
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
        </Surface>

        {filteredSessions.length === 0 ? (
          <Surface className="p-5 sm:p-6">
            <p className="text-sm text-muted">{copy.sleepSectionEmpty}</p>
          </Surface>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="grid grid-cols-[4.1rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:px-4"
              >
                <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
                  <span className="block leading-4 text-foreground">
                    {formatChildTime(session.startedAt)}
                  </span>
                  <span className="block truncate text-[0.68rem] leading-4">
                    {formatChildDate(session.startedAt, language, { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        session.status === "active" ? "bg-amber-500" : "bg-sky-500"
                      }`}
                    />
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">
                      {session.status === "active"
                        ? copy.sleepStatusActive
                        : copy.sleepStatusCompleted}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                    {[
                      session.endedAt
                        ? `${copy.sleepEndedAt}: ${formatSleepEndLabel(
                            session.startedAt,
                            session.endedAt,
                            language
                          )}`
                        : copy.sleepStatusActive,
                      formatSleepDuration(session.durationMinutes, language, session.status),
                    ].join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSleepToDelete(session)}
                  disabled={deleteSleepMutation.isPending}
                  className="soft-pill app-profile-action shrink-0 text-danger disabled:opacity-50"
                >
                  {copy.sleepSectionDelete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSleepDuration(
  durationMinutes: number | null,
  language: "ru" | "en",
  status: string
) {
  if (durationMinutes === null) {
    return status === "active" ? (language === "ru" ? "Идёт сейчас" : "In progress") : "—";
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

function getAveragePerDay(
  values: string[],
  period: ChildRecordsPeriod,
  customStartDate: string,
  customEndDate: string
) {
  if (values.length === 0) {
    return null;
  }

  return values.length / getChildRecordsPeriodDayCount(period, customStartDate, customEndDate);
}

function isNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatSleepEndLabel(startedAt: string, endedAt: string, language: "ru" | "en") {
  if (startedAt.slice(0, 10) === endedAt.slice(0, 10)) {
    return formatChildTime(endedAt);
  }
  return formatChildDateTime(endedAt, language);
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex min-h-[2.35rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.7rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
          {label}
        </span>
        <span className="block truncate text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
          {value}
        </span>
      </span>
    </div>
  );
}
