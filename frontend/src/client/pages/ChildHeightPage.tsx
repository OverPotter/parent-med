import { useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchMyFamilyAccess } from "@shared/api/families";
import {
  createHeightEntry,
  fetchHeightEntriesByChildId,
  fetchLatestHeightEntryByChildId,
} from "@shared/api/heightEntries";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { getCurrentDeviceTimestampIso } from "@shared/utils/date";
import { canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { isChildLockedByPlan } from "@shared/subscription/childPlanAccess";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { MeasurementCard } from "@client/components/MeasurementCard";
import { getChildrenCopy } from "@client/i18n/children";
import { UpgradeDialog } from "@client/subscription/UpgradeDialog";
import { useSubscriptionUpgrade } from "@client/subscription/useSubscriptionUpgrade";
import { formatChildDate } from "@client/utils/childDateFormat";
import { buildMeasurementTrend, formatDecimal, parseMeasurement } from "./measurementUtils";

export function ChildHeightPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const isIosShell = useIsIosShell();
  const navigate = useNavigate();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [heightValue, setHeightValue] = useState("");
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const parsedHeight = parseMeasurement(heightValue);
  const canViewHeight = !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    staleTime: 60 * 1000,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const { upgradeToPlus, isUpgradePending, upgradeErrorMessage, clearUpgradeError } =
    useSubscriptionUpgrade(
    accountId,
    currentFamilyId,
    canManageSubscription
    );

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewHeight,
  });

  const { data: latestHeight = null } = useQuery({
    queryKey: ["height-entry-latest", childId],
    queryFn: () => fetchLatestHeightEntryByChildId(childId!),
    enabled: !!childId && canViewHeight,
  });

  const { data: heightHistory = [] } = useQuery({
    queryKey: ["height-entries", childId],
    queryFn: () => fetchHeightEntriesByChildId(childId!),
    enabled: !!childId && canViewHeight,
  });

  const addHeightMutation = useMutation({
    mutationFn: () =>
      createHeightEntry({
        child_id: child!.id,
        value_cm: Number.parseFloat(heightValue),
        measured_at: getCurrentDeviceTimestampIso(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["height-entry-latest", childId] });
      queryClient.invalidateQueries({ queryKey: ["height-entries", childId] });
      queryClient.invalidateQueries({ queryKey: ["child", childId] });
      setHeightValue("");
    },
  });

  if (!childId || !canViewHeight) {
    return <Navigate to="/children" replace />;
  }

  if (isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }
  const planLocksChildActions = isChildLockedByPlan(child.id, familyAccess);

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
        title={`${copy.heightCardTitle} · ${child.name}`}
        hint={copy.measurementsSectionSubtitle}
      />
      <UpgradeDialog
        isOpen={isUpgradeDialogOpen}
        language={language}
        entryPoint="child_actions_locked"
        isPending={isUpgradePending}
        canUpgrade={canManageSubscription}
        errorMessage={upgradeErrorMessage}
        onClose={() => {
          clearUpgradeError();
          setIsUpgradeDialogOpen(false);
        }}
        onUpgrade={() => {
          void upgradeToPlus().then(() => {
            setIsUpgradeDialogOpen(false);
          });
        }}
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
          isLocked={planLocksChildActions}
          onLockedSubmit={() => setIsUpgradeDialogOpen(true)}
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
