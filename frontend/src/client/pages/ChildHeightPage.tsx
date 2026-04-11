import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createHeightEntry,
  fetchHeightEntriesByChildId,
  fetchLatestHeightEntryByChildId,
} from "@shared/api/heightEntries";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { HeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { getChildrenCopy } from "@client/i18n/children";

export function ChildHeightPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const queryClient = useQueryClient();
  const [heightValue, setHeightValue] = useState("");
  const parsedHeight = parseMeasurement(heightValue);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: latestHeight = null } = useQuery({
    queryKey: ["height-entry-latest", childId],
    queryFn: () => fetchLatestHeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  const { data: heightHistory = [] } = useQuery({
    queryKey: ["height-entries", childId],
    queryFn: () => fetchHeightEntriesByChildId(childId!),
    enabled: !!childId,
  });

  const addHeightMutation = useMutation({
    mutationFn: () =>
      createHeightEntry({
        child_id: child!.id,
        value_cm: Number.parseFloat(heightValue),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["height-entry-latest", childId] });
      queryClient.invalidateQueries({ queryKey: ["height-entries", childId] });
      queryClient.invalidateQueries({ queryKey: ["child", childId] });
      setHeightValue("");
    },
  });

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="px-1">
        <Link
          to={`/children/${child.id}`}
          className="inline-flex text-sm text-primary hover:underline"
        >
          {language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        </Link>
      </div>

      <PageIntro
        title={copy.heightCardTitle}
        subtitle={copy.measurementsSectionSubtitle}
        hideOnMobile
      />

      <div className="md:hidden">
        <Surface className="p-4">
          <h1 className="app-title mb-2 text-[1.42rem] tracking-[-0.04em]">{copy.heightCardTitle}</h1>
          <p className="text-sm text-muted">{copy.measurementsSectionSubtitle}</p>
        </Surface>
      </div>

      <MeasurementCard
        title={copy.heightCardTitle}
        language={language}
        latestValue={
          latestHeight
            ? `${formatDecimal(latestHeight.valueCm)} ${language === "ru" ? "см" : "cm"}`
            : copy.measurementMissing
        }
        latestDate={latestHeight ? formatDate(latestHeight.measuredAt) : null}
        trend={buildHeightTrend(heightHistory, language, copy)}
        inputValue={heightValue}
        inputPlaceholder={language === "ru" ? "Например: 96" : "Example: 96"}
        actionLabel={copy.heightAdd}
        isPending={addHeightMutation.isPending}
        isSubmitDisabled={parsedHeight === null}
        onInputChange={setHeightValue}
        onSubmit={() => addHeightMutation.mutate()}
        history={heightHistory.map((entry) => ({
          id: entry.id,
          value: `${formatDecimal(entry.valueCm)} ${language === "ru" ? "см" : "cm"}`,
          date: formatDate(entry.measuredAt),
        }))}
        historyTitle={copy.measurementHistory}
        emptyText={copy.measurementEmpty}
      />
    </div>
  );
}

function MeasurementCard({
  title,
  language,
  latestValue,
  latestDate,
  trend,
  inputValue,
  inputPlaceholder,
  actionLabel,
  isPending,
  isSubmitDisabled,
  onInputChange,
  onSubmit,
  history,
  historyTitle,
  emptyText,
}: {
  title: string;
  language: "ru" | "en";
  latestValue: string;
  latestDate: string | null;
  trend: string;
  inputValue: string;
  inputPlaceholder: string;
  actionLabel: string;
  isPending: boolean;
  isSubmitDisabled: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  history: Array<{ id: string; value: string; date: string }>;
  historyTitle: string;
  emptyText: string;
}) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="space-y-4">
        <div>
          <h2 className="app-card-title">{title}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SummaryPill
              label={language === "ru" ? "Текущий рост" : "Current height"}
              value={latestValue}
            />
            <SummaryPill
              label={language === "ru" ? "С прошлого" : "Since last"}
              value={trend}
            />
            <SummaryPill
              label={language === "ru" ? "Последнее измерение" : "Last measured"}
              value={latestDate ?? "—"}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="number"
            inputMode="decimal"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            className="soft-input w-full px-4"
            placeholder={inputPlaceholder}
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || isSubmitDisabled}
            className="soft-button-primary app-btn-primary-md inline-flex disabled:opacity-50"
          >
            {actionLabel}
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{historyTitle}</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">{emptyText}</p>
          ) : (
            <div className="grid gap-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="soft-panel-muted flex items-center justify-between rounded-[18px] px-4 py-3"
                >
                  <span className="font-medium text-foreground">{item.value}</span>
                  <span className="text-sm text-muted">{item.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Surface>
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
    <div className="soft-panel-muted inline-flex min-h-[3.25rem] w-full flex-col items-start justify-center rounded-[1.1rem] border border-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3.5 py-2.5">
      <span className="text-[11px] font-medium leading-4 tracking-[0.02em] text-muted">
        {label}
      </span>
      <span className="mt-0.5 text-[0.95rem] font-semibold leading-5 tracking-[-0.025em] text-foreground">
        {value}
      </span>
    </div>
  );
}

function buildHeightTrend(
  entries: HeightEntry[],
  language: "ru" | "en",
  copy: ReturnType<typeof getChildrenCopy>["childProfile"]
) {
  const [latestEntry, previousEntry] = entries;
  if (!latestEntry || !previousEntry) {
    return language === "ru" ? "Нет сравнения" : "No baseline";
  }
  const diff = latestEntry.valueCm - previousEntry.valueCm;
  if (Math.abs(diff) < 0.1) {
    return copy.measurementTrendStable;
  }
  const sign = diff > 0 ? "+" : "";
  return language === "ru"
    ? `${sign}${formatDecimal(diff)} см к прошлому измерению`
    : `${sign}${formatDecimal(diff)} cm since previous measurement`;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function parseMeasurement(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
