import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { deleteFeedingRecord, fetchFeedingRecordsByChildId } from "@shared/api/feedingRecords";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { FeedingRecord } from "@shared/types/api";
import { formatDateTime } from "@shared/utils/date";
import { getChildrenCopy } from "@client/i18n/children";

type RecordsPeriod = "today" | "week" | "month" | "all";

export function ChildFeedingPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const queryClient = useQueryClient();
  const [recordToDelete, setRecordToDelete] = useState<FeedingRecord | null>(null);
  const [period, setPeriod] = useState<RecordsPeriod>("today");

  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: feedingRecords = [], isLoading: isFeedingLoading } = useQuery({
    queryKey: ["feeding-records", childId],
    queryFn: () => fetchFeedingRecordsByChildId(childId!),
    enabled: !!childId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeedingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", childId] });
      setRecordToDelete(null);
    },
  });

  if (!childId || isChildLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  if (!child.babyModeEnabled) {
    return <Navigate to={`/children/${child.id}`} replace />;
  }

  const filteredRecords = feedingRecords.filter((record) =>
    matchesPeriod(record.recordedAt, period)
  );
  const averagePerDay = getAveragePerDay(
    filteredRecords.map((record) => record.recordedAt),
    period
  );
  const averageTime = getAverageTimeLabel(
    filteredRecords.map((record) => record.recordedAt),
    language
  );
  const averageDuration = getAverage(
    filteredRecords.map((record) => record.durationMinutes).filter(isNumber)
  );
  const averageVolume = getAverage(
    filteredRecords.map((record) => record.formulaVolumeMl).filter(isNumber)
  );

  return (
    <div className="min-w-0 space-y-6">
      <ConfirmDialog
        isOpen={!!recordToDelete}
        title={copy.feedingSectionDeleteTitle}
        description={copy.feedingSectionDeleteDescription}
        confirmLabel={
          deleteMutation.isPending ? copy.feedingSectionDeleting : copy.feedingSectionDeleteConfirm
        }
        cancelLabel={copy.deleteCancel}
        confirmTone="danger"
        isPending={deleteMutation.isPending}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={() => {
          if (recordToDelete) {
            deleteMutation.mutate(recordToDelete.id);
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

      <PageIntro
        title={copy.feedingSection}
        subtitle={copy.feedingSectionSubtitle}
        hideOnMobile
        action={
          <Link
            to={`/children/${child.id}`}
            className="soft-button-secondary app-btn-secondary-md inline-flex min-h-[2.85rem] items-center justify-center px-4 sm:min-h-[3.05rem]"
          >
            {language === "ru" ? "Профиль" : "Profile"}
          </Link>
        }
      />

      <div className="md:hidden">
        <Surface className="p-4">
          <h1 className="app-title mb-2 text-[1.42rem] tracking-[-0.04em]">{copy.feedingSection}</h1>
          <p className="text-sm text-muted">{copy.feedingSectionSubtitle}</p>
        </Surface>
      </div>

      <Surface className="p-5 sm:p-6">
        <div className="mb-4 space-y-4">
          <h2 className="app-card-title">{child.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {isFeedingLoading ? common.loading : copy.feedingSectionSubtitle}
          </p>
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
              label={copy.feedingSummaryAvgPerDay}
              value={formatPerDay(averagePerDay, language)}
            />
            <SummaryPill
              label={copy.feedingSummaryAvgTime}
              value={averageTime}
            />
            <SummaryPill
              label={copy.feedingSummaryAvgDuration}
              value={formatMinutes(averageDuration, language)}
            />
            <SummaryPill
              label={copy.feedingSummaryAvgVolume}
              value={formatVolume(averageVolume, language)}
            />
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <p className="text-sm text-muted">{copy.feedingSectionEmpty}</p>
        ) : (
          <div className="grid gap-3">
            {filteredRecords.map((item) => (
              <div key={item.id} className="soft-panel-muted rounded-[24px] px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="soft-pill rounded-full px-3 py-1 text-xs">
                        {item.feedingType === "breast"
                          ? copy.feedingTypeBreastLabel
                          : copy.feedingTypeFormulaLabel}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoLine label={copy.feedingRecordedAt} value={formatDateTime(item.recordedAt)} />
                      <InfoLine
                        label={copy.feedingSide}
                        value={formatBreastSide(item.breastSide, language)}
                      />
                      <InfoLine
                        label={copy.feedingVolume}
                        value={item.formulaVolumeMl ? `${item.formulaVolumeMl} мл` : "—"}
                      />
                      <InfoLine
                        label={copy.feedingDuration}
                        value={formatFeedingDuration(item.durationMinutes, language)}
                      />
                    </div>
                    {item.note ? <InfoLine label={copy.feedingNote} value={item.note} /> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecordToDelete(item)}
                    disabled={deleteMutation.isPending}
                    className="soft-button-secondary app-btn-secondary-md inline-flex min-h-[2.75rem] shrink-0 text-center text-danger disabled:opacity-50"
                  >
                    {copy.feedingSectionDelete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>
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

function formatBreastSide(side: string | null, language: "ru" | "en") {
  if (!side) {
    return "—";
  }
  if (language === "ru") {
    if (side === "left") return "Левая";
    if (side === "right") return "Правая";
    return "Обе";
  }
  if (side === "left") return "Left";
  if (side === "right") return "Right";
  return "Both";
}

function formatFeedingDuration(durationMinutes: number | null, language: "ru" | "en") {
  if (durationMinutes === null) {
    return "—";
  }
  if (language === "ru") {
    return `${durationMinutes} мин`;
  }
  return `${durationMinutes} min`;
}

function formatMinutes(value: number | null, language: "ru" | "en") {
  if (value === null) {
    return "—";
  }
  const rounded = Math.round(value);
  return language === "ru" ? `${rounded} мин` : `${rounded} min`;
}

function formatVolume(value: number | null, language: "ru" | "en") {
  if (value === null) {
    return "—";
  }
  const rounded = Math.round(value);
  return language === "ru" ? `${rounded} мл` : `${rounded} ml`;
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

function getAverageTimeLabel(values: string[], language: "ru" | "en") {
  const minutes = values
    .map((value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date.getHours() * 60 + date.getMinutes();
    })
    .filter(isNumber);

  if (minutes.length === 0) {
    return "—";
  }

  const averageMinutes = Math.round(
    minutes.reduce((sum, value) => sum + value, 0) / minutes.length
  );
  const hours = Math.floor(averageMinutes / 60) % 24;
  const mins = averageMinutes % 60;
  return language === "ru" || language === "en"
    ? `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
    : `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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
