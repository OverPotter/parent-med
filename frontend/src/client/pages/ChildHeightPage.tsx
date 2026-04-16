import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createHeightEntry,
  fetchHeightEntriesByChildId,
  fetchLatestHeightEntryByChildId,
} from "@shared/api/heightEntries";
import { useI18n } from "@shared/hooks/useI18n";
import { formatDate } from "@shared/utils/date";
import { MeasurementCard } from "@client/components/MeasurementCard";
import { getChildrenCopy } from "@client/i18n/children";
import { buildMeasurementTrend, formatDecimal, parseMeasurement } from "./measurementUtils";

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

      <div className="space-y-3">
        <div>
          <h1 className="app-card-title">
            {copy.heightCardTitle} · {child.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{copy.measurementsSectionSubtitle}</p>
        </div>

        <MeasurementCard
          language={language}
          latestLabel={language === "ru" ? "Текущий рост" : "Current height"}
          latestValue={
            latestHeight
              ? `${formatDecimal(latestHeight.valueCm)} ${language === "ru" ? "см" : "cm"}`
              : copy.measurementMissing
          }
          latestDate={latestHeight ? formatDate(latestHeight.measuredAt) : null}
          trendLabel={language === "ru" ? "С прошлого" : "Since last"}
          trendValue={buildMeasurementTrend(
            heightHistory.map((entry) => entry.valueCm),
            language,
            copy,
            language === "ru" ? "см" : "cm",
            0.1
          )}
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
    </div>
  );
}
