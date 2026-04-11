import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createHeightEntry,
  fetchHeightEntriesByChildId,
  fetchLatestHeightEntryByChildId,
} from "@shared/api/heightEntries";
import {
  createWeightEntry,
  fetchWeightEntriesByChildId,
  fetchLatestWeightEntryByChildId,
} from "@shared/api/weightEntries";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { HeightEntry, WeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { getChildrenCopy } from "@client/i18n/children";

export function ChildMeasurementsPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const queryClient = useQueryClient();
  const [weightValue, setWeightValue] = useState("");
  const [heightValue, setHeightValue] = useState("");

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  const { data: latestHeight = null } = useQuery({
    queryKey: ["height-entry-latest", childId],
    queryFn: () => fetchLatestHeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  const { data: weightHistory = [] } = useQuery({
    queryKey: ["weight-entries", childId],
    queryFn: () => fetchWeightEntriesByChildId(childId!),
    enabled: !!childId,
  });

  const { data: heightHistory = [] } = useQuery({
    queryKey: ["height-entries", childId],
    queryFn: () => fetchHeightEntriesByChildId(childId!),
    enabled: !!childId,
  });

  const addWeightMutation = useMutation({
    mutationFn: () =>
      createWeightEntry({
        child_id: child!.id,
        value_kg: Number.parseFloat(weightValue),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", childId] });
      queryClient.invalidateQueries({ queryKey: ["weight-entries", childId] });
      setWeightValue("");
    },
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
      setHeightValue("");
    },
  });

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="px-1">
        <Link to={`/children/${child.id}`} className="inline-flex text-sm text-primary hover:underline">
          {language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        </Link>
      </div>

      <PageIntro
        title={copy.measurementsSection}
        subtitle={copy.measurementsSectionSubtitle}
        hideOnMobile
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MeasurementCard
          title={copy.weightCardTitle}
          language={language}
          latestValue={
            latestWeight
              ? `${formatDecimal(latestWeight.valueKg)} ${language === "ru" ? "кг" : "kg"}`
              : copy.measurementMissing
          }
          latestDate={latestWeight ? formatDate(latestWeight.measuredAt) : null}
          trend={buildWeightTrend(weightHistory, language)}
          inputValue={weightValue}
          inputPlaceholder={language === "ru" ? "Например: 14.2" : "Example: 14.2"}
          actionLabel={copy.weightAdd}
          isPending={addWeightMutation.isPending}
          onInputChange={setWeightValue}
          onSubmit={() => addWeightMutation.mutate()}
          history={weightHistory.map((entry) => ({
            id: entry.id,
            value: `${formatDecimal(entry.valueKg)} ${language === "ru" ? "кг" : "kg"}`,
            date: formatDate(entry.measuredAt),
          }))}
        />

        <MeasurementCard
          title={copy.heightCardTitle}
          language={language}
          latestValue={
            latestHeight
              ? `${formatDecimal(latestHeight.valueCm)} ${language === "ru" ? "см" : "cm"}`
              : copy.measurementMissing
          }
          latestDate={latestHeight ? formatDate(latestHeight.measuredAt) : null}
          trend={buildHeightTrend(heightHistory, language)}
          inputValue={heightValue}
          inputPlaceholder={language === "ru" ? "Например: 96" : "Example: 96"}
          actionLabel={copy.heightAdd}
          isPending={addHeightMutation.isPending}
          onInputChange={setHeightValue}
          onSubmit={() => addHeightMutation.mutate()}
          history={heightHistory.map((entry) => ({
            id: entry.id,
            value: `${formatDecimal(entry.valueCm)} ${language === "ru" ? "см" : "cm"}`,
            date: formatDate(entry.measuredAt),
          }))}
        />
      </div>
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
  onInputChange,
  onSubmit,
  history,
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
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  history: Array<{ id: string; value: string; date: string }>;
}) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="space-y-4">
        <div>
          <h2 className="app-card-title">{title}</h2>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
            {latestValue}
          </p>
          {latestDate ? <p className="mt-1 text-sm text-muted">{latestDate}</p> : null}
          <p className="mt-2 text-sm text-muted">{trend}</p>
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
            disabled={isPending || !inputValue.trim()}
            className="soft-button-primary app-btn-primary-md inline-flex disabled:opacity-50"
          >
            {actionLabel}
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {language === "ru" ? "История" : "History"}
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">
              {language === "ru" ? "Пока нет записей." : "No entries yet."}
            </p>
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

function buildWeightTrend(entries: WeightEntry[], language: "ru" | "en") {
  const [latestEntry, previousEntry] = entries;
  if (!latestEntry || !previousEntry) {
    return language === "ru" ? "Добавьте ещё записи, чтобы увидеть динамику." : "Add more entries to see the trend.";
  }
  const diff = latestEntry.valueKg - previousEntry.valueKg;
  if (Math.abs(diff) < 0.01) {
    return language === "ru" ? "Почти без изменений по сравнению с прошлым измерением." : "Almost unchanged from the previous measurement.";
  }
  const sign = diff > 0 ? "+" : "";
  return language === "ru"
    ? `${sign}${formatDecimal(diff)} кг к прошлому измерению`
    : `${sign}${formatDecimal(diff)} kg since previous measurement`;
}

function buildHeightTrend(entries: HeightEntry[], language: "ru" | "en") {
  const [latestEntry, previousEntry] = entries;
  if (!latestEntry || !previousEntry) {
    return language === "ru" ? "Добавьте ещё записи, чтобы увидеть динамику." : "Add more entries to see the trend.";
  }
  const diff = latestEntry.valueCm - previousEntry.valueCm;
  if (Math.abs(diff) < 0.1) {
    return language === "ru" ? "Почти без изменений по сравнению с прошлым измерением." : "Almost unchanged from the previous measurement.";
  }
  const sign = diff > 0 ? "+" : "";
  return language === "ru"
    ? `${sign}${formatDecimal(diff)} см к прошлому измерению`
    : `${sign}${formatDecimal(diff)} cm since previous measurement`;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
