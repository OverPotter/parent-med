import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createWeightEntry,
  fetchLatestWeightEntryByChildId,
  fetchWeightEntriesByChildId,
} from "@shared/api/weightEntries";
import { useI18n } from "@shared/hooks/useI18n";
import { formatDate } from "@shared/utils/date";
import { MeasurementCard } from "@client/components/MeasurementCard";
import { getChildrenCopy } from "@client/i18n/children";
import { buildMeasurementTrend, formatDecimal, parseMeasurement } from "./measurementUtils";

export function ChildWeightPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const queryClient = useQueryClient();
  const [weightValue, setWeightValue] = useState("");
  const parsedWeight = parseMeasurement(weightValue);

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

  const { data: weightHistory = [] } = useQuery({
    queryKey: ["weight-entries", childId],
    queryFn: () => fetchWeightEntriesByChildId(childId!),
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
      queryClient.invalidateQueries({ queryKey: ["child", childId] });
      setWeightValue("");
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

      <div className="space-y-3">
        <div>
          <h1 className="app-card-title">
            {copy.weightCardTitle} · {child.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{copy.measurementsSectionSubtitle}</p>
        </div>

        <MeasurementCard
          language={language}
          latestLabel={language === "ru" ? "Текущий вес" : "Current weight"}
          latestValue={
            latestWeight
              ? `${formatDecimal(latestWeight.valueKg)} ${language === "ru" ? "кг" : "kg"}`
              : copy.measurementMissing
          }
          latestDate={latestWeight ? formatDate(latestWeight.measuredAt) : null}
          trendLabel={language === "ru" ? "С прошлого" : "Since last"}
          trendValue={buildMeasurementTrend(
            weightHistory.map((entry) => entry.valueKg),
            language,
            copy,
            language === "ru" ? "кг" : "kg",
            0.01
          )}
          inputValue={weightValue}
          inputPlaceholder={language === "ru" ? "Например: 14.2" : "Example: 14.2"}
          actionLabel={copy.weightAdd}
          isPending={addWeightMutation.isPending}
          isSubmitDisabled={parsedWeight === null}
          onInputChange={setWeightValue}
          onSubmit={() => addWeightMutation.mutate()}
          history={weightHistory.map((entry) => ({
            id: entry.id,
            value: `${formatDecimal(entry.valueKg)} ${language === "ru" ? "кг" : "kg"}`,
            date: formatDate(entry.measuredAt),
          }))}
          historyTitle={copy.measurementHistory}
          emptyText={copy.measurementEmpty}
        />
      </div>
    </div>
  );
}
