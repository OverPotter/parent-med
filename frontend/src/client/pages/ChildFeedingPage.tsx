import { useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  deleteFeedingRecord,
  fetchActiveFeedingRecordByChildId,
  fetchFeedingRecordsByChildId,
} from "@shared/api/feedingRecords";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useNow } from "@shared/hooks/useNow";
import { canEditChild, canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import type { FeedingRecord } from "@shared/types/api";
import {
  ChildRecordsPeriodSelector,
  getChildRecordsPeriodDayCount,
  getShiftedLocalIsoDate,
  matchesChildRecordsPeriod,
  type ChildRecordsPeriod,
} from "@client/components/ChildRecordsPeriodSelector";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { getChildrenCopy } from "@client/i18n/children";
import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import {
  childActionSuccessClass,
  formatDurationMinutesHuman,
  formatElapsedDuration,
} from "./children/shared";

export function ChildFeedingPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const isIosShell = useIsIosShell();
  const navigate = useNavigate();
  const currentAccountId = useAppStore((s) => s.accountId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<FeedingRecord | null>(null);
  const [period, setPeriod] = useState<ChildRecordsPeriod>("week");
  const [customStartDate, setCustomStartDate] = useState(() => getShiftedLocalIsoDate(-6));
  const [customEndDate, setCustomEndDate] = useState(() => getShiftedLocalIsoDate(0));
  const canViewFeeding = !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);

  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewFeeding,
  });

  const { data: feedingRecords = [], isLoading: isFeedingLoading } = useQuery({
    queryKey: ["feeding-records", childId],
    queryFn: () => fetchFeedingRecordsByChildId(childId!),
    enabled: !!childId && canViewFeeding,
  });

  const { data: activeFeeding } = useQuery({
    queryKey: ["feeding-record-active", childId],
    queryFn: () => fetchActiveFeedingRecordByChildId(childId!),
    enabled: !!childId && canViewFeeding,
  });
  const activeFeedingStartedAt = activeFeeding?.startedAt ?? activeFeeding?.recordedAt ?? null;
  const now = useNow(activeFeedingStartedAt ? 1_000 : 60_000);

  const deleteMutation = useMutation({
    mutationFn: deleteFeedingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", childId] });
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active", childId] });
      setRecordToDelete(null);
    },
  });

  if (!childId || !canViewFeeding) {
    return <Navigate to="/children" replace />;
  }

  if (isChildLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  if (!child.babyModeEnabled) {
    return <Navigate to={`/children/${child.id}`} replace />;
  }

  const filteredRecords = feedingRecords.filter((record) =>
    matchesChildRecordsPeriod(record.recordedAt, period, customStartDate, customEndDate)
  );
  const canEditFeedingRecords = canEditChild(child.id, accountFamilyRole, accountAccessPolicy);
  const averagePerDay = getAveragePerDay(
    filteredRecords.map((record) => record.recordedAt),
    period,
    customStartDate,
    customEndDate
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
    <div ref={rootRef} className="child-profile-shell min-h-[100dvh] space-y-6">
      <IosEdgeBackGesture
        isEnabled={isIosShell}
        onBack={() => navigate(`/children/${child.id}`, { replace: true })}
        targetRef={rootRef}
      />
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

      <ChildSectionTopBar
        onBack={() => navigate(`/children/${child.id}`, { replace: true })}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        title={`${copy.feedingSection} · ${child.name}`}
        hint={copy.feedingSectionSubtitle}
        action={
          activeFeedingStartedAt ? (
            <span className={`${childActionSuccessClass} rounded-full px-3 py-1.5 text-xs`}>
              {`${copy.feedingSectionActive} · ${formatElapsedDuration(activeFeedingStartedAt, now, language)}`}
            </span>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-3 pt-2">
        <Surface className="relative z-30 overflow-visible p-4 sm:p-5">
          <div className="space-y-4">
            {isFeedingLoading ? <p className="text-sm text-muted">{common.loading}</p> : null}
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
                label={copy.feedingSummaryAvgPerDay}
                value={formatPerDay(averagePerDay, language)}
              />
              <SummaryPill label={copy.feedingSummaryAvgTime} value={averageTime} />
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
        </Surface>

        {filteredRecords.length === 0 ? (
          <Surface className="p-5 sm:p-6">
            <p className="text-sm text-muted">{copy.feedingSectionEmpty}</p>
          </Surface>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
            {filteredRecords.map((item) => {
              const canDeleteRecord =
                canEditFeedingRecords &&
                (item.status !== "active" || item.createdByAccountId === currentAccountId);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[4.1rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:px-4"
                >
                  <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
                    <span className="block leading-4 text-foreground">
                      {formatChildTime(item.recordedAt, language)}
                    </span>
                    <span className="block truncate text-[0.68rem] leading-4">
                      {formatChildDate(item.recordedAt, language, { month: "short" })}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                      <p className="truncate text-sm font-semibold leading-5 text-foreground">
                        {item.feedingType === "breast"
                          ? copy.feedingTypeBreastLabel
                          : copy.feedingTypeFormulaLabel}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                      {[
                        formatBreastSide(item.breastSide, language),
                        item.formulaVolumeMl ? `${item.formulaVolumeMl} мл` : null,
                        formatFeedingDuration(item.durationMinutes, language),
                        item.note,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecordToDelete(item)}
                    disabled={deleteMutation.isPending || !canDeleteRecord}
                    className="soft-pill app-profile-action shrink-0 text-danger disabled:opacity-50"
                  >
                    {copy.feedingSectionDelete}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
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
  return formatDurationMinutesHuman(durationMinutes, language);
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

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex min-h-[2.35rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
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
