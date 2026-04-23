import { useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createWeightEntry,
  fetchLatestWeightEntryByChildId,
  fetchWeightEntriesByChildId,
} from "@shared/api/weightEntries";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { getCurrentDeviceTimestampIso } from "@shared/utils/date";
import { canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { MeasurementCard } from "@client/components/MeasurementCard";
import { getChildrenCopy } from "@client/i18n/children";
import { formatChildDate } from "@client/utils/childDateFormat";
import { buildMeasurementTrend, formatDecimal, parseMeasurement } from "./measurementUtils";

export function ChildWeightPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const isIosShell = useIsIosShell();
  const navigate = useNavigate();
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [weightValue, setWeightValue] = useState("");
  const parsedWeight = parseMeasurement(weightValue);
  const canViewWeight = !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewWeight,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId && canViewWeight,
  });

  const { data: weightHistory = [] } = useQuery({
    queryKey: ["weight-entries", childId],
    queryFn: () => fetchWeightEntriesByChildId(childId!),
    enabled: !!childId && canViewWeight,
  });

  const addWeightMutation = useMutation({
    mutationFn: () =>
      createWeightEntry({
        child_id: child!.id,
        value_kg: Number.parseFloat(weightValue),
        measured_at: getCurrentDeviceTimestampIso(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", childId] });
      queryClient.invalidateQueries({ queryKey: ["weight-entries", childId] });
      queryClient.invalidateQueries({ queryKey: ["child", childId] });
      setWeightValue("");
    },
  });

  if (!childId || !canViewWeight) {
    return <Navigate to="/children" replace />;
  }

  if (isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  return (
    <div ref={rootRef} className="child-profile-shell min-h-[100dvh] space-y-6">
      <IosEdgeBackGesture
        isEnabled={isIosShell}
        onBack={() => navigate(`/children/${child.id}`, { replace: true })}
        targetRef={rootRef}
      />
      <ChildSectionTopBar
        onBack={() => navigate(`/children/${child.id}`, { replace: true })}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        title={`${copy.weightCardTitle} · ${child.name}`}
        hint={copy.measurementsSectionSubtitle}
      />

      <div
        className="mx-auto w-full max-w-2xl space-y-3 pt-2"
        style={{
          scrollPaddingBottom:
            "calc(7.5rem + var(--app-keyboard-height, 0px) + max(0.75rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom))))",
        }}
      >
        <MeasurementCard
          language={language}
          latestLabel={language === "ru" ? "Текущий вес" : "Current weight"}
          latestValue={
            latestWeight
              ? `${formatDecimal(latestWeight.valueKg)} ${language === "ru" ? "кг" : "kg"}`
              : copy.measurementMissing
          }
          latestDate={latestWeight ? formatChildDate(latestWeight.measuredAt, language) : null}
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
            date: formatChildDate(entry.measuredAt, language),
          }))}
          historyTitle={copy.measurementHistory}
          emptyText={copy.measurementEmpty}
        />
      </div>
    </div>
  );
}
