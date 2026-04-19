import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createHeightEntry,
  fetchHeightEntriesByChildId,
  fetchLatestHeightEntryByChildId,
} from "@shared/api/heightEntries";
import { useI18n } from "@shared/hooks/useI18n";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { MeasurementCard } from "@client/components/MeasurementCard";
import { getChildrenCopy } from "@client/i18n/children";
import { formatChildDate } from "@client/utils/childDateFormat";
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
    <div className="child-profile-shell space-y-6">
      <ChildSectionTopBar
        backHref={`/children/${child.id}`}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        title={`${copy.heightCardTitle} · ${child.name}`}
        hint={copy.measurementsSectionSubtitle}
      />

      <div className="mx-auto w-full max-w-2xl space-y-3">
        <MeasurementCard
          language={language}
          latestLabel={language === "ru" ? "Текущий рост" : "Current height"}
          latestValue={
            latestHeight
              ? `${formatDecimal(latestHeight.valueCm)} ${language === "ru" ? "см" : "cm"}`
              : copy.measurementMissing
          }
          latestDate={latestHeight ? formatChildDate(latestHeight.measuredAt, language) : null}
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
            date: formatChildDate(entry.measuredAt, language),
          }))}
          historyTitle={copy.measurementHistory}
          emptyText={copy.measurementEmpty}
        />
      </div>
    </div>
  );
}
