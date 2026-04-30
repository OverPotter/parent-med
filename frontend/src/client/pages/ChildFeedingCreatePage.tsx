import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchMyFamilyAccess } from "@shared/api/families";
import { createFeedingRecord } from "@shared/api/feedingRecords";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { FeedingRecordForm } from "@client/components/FeedingRecordForm";
import { getChildrenCopy } from "@client/i18n/children";
import { useChildBackNavigation } from "@client/pages/children/useChildBackNavigation";
import {
  getCurrentLocalDateInputValue,
  getCurrentLocalTimeInputValue,
  toApiDateTime,
} from "@client/utils/feedingRecordForm";
import { startFeedingRecordResilient } from "@shared/utils/offlineCareSync";
import { syncFeedingLiveActivity } from "@shared/utils/liveActivities";
import { canActChild, canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { isChildLockedByPlan } from "@shared/subscription/childPlanAccess";
import { scrollFieldIntoView } from "@shared/utils/focus";
import type { FeedingRecord } from "@shared/types/api";

export function ChildFeedingCreatePage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childrenPage.childCard;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const queryClient = useQueryClient();
  const [feedingType, setFeedingType] = useState<"breast" | "formula">("breast");
  const [breastSide, setBreastSide] = useState<"left" | "right" | "both">("left");
  const [isExpressed, setIsExpressed] = useState(false);
  const [formulaVolume, setFormulaVolume] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [recordedDate, setRecordedDate] = useState(() => getCurrentLocalDateInputValue());
  const [recordedTime, setRecordedTime] = useState(() => getCurrentLocalTimeInputValue());
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const canViewFeedingChild =
    !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    staleTime: 60 * 1000,
  });
  const { enableLocalSwipe, localUnderlaySnapshotKey, handleBack } = useChildBackNavigation({
    fallbackHref: childId ? `/children/${childId}` : "/children",
  });

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    let frameId = 0;
    let timeoutId: number | null = null;

    const scrollFocusedFieldIntoView = (target: HTMLElement) => {
      const run = () => scrollFieldIntoView(target, { block: "center" });

      window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      frameId = window.requestAnimationFrame(run);
      timeoutId = window.setTimeout(run, 240);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (
        !target.matches(
          "input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable='true']"
        )
      ) {
        return;
      }

      scrollFocusedFieldIntoView(target);
    };

    page.addEventListener("focusin", handleFocusIn);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      page.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewFeedingChild,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFeedingRecord({
        child_id: child!.id,
        feeding_type: feedingType,
        breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
        is_expressed: feedingType === "breast" ? isExpressed : false,
        formula_volume_ml:
          feedingType === "formula" && formulaVolume.trim()
            ? Number.parseInt(formulaVolume.trim(), 10) || null
            : null,
        duration_minutes:
          feedingType === "breast" && durationMinutes.trim()
            ? Number.parseInt(durationMinutes.trim(), 10) || null
            : null,
        recorded_at: toApiDateTime(recordedDate, recordedTime),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", childId] });
      navigate("/children", { replace: true });
    },
  });

  const startMutation = useMutation({
    mutationFn: () =>
      startFeedingRecordResilient({
        childId: child!.id,
        currentAccountId: accountId,
        payload: {
          feeding_type: feedingType,
          breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
          is_expressed: feedingType === "breast" ? isExpressed : false,
          formula_volume_ml:
            feedingType === "formula" && formulaVolume.trim()
              ? Number.parseInt(formulaVolume.trim(), 10) || null
              : null,
          note: note.trim() || null,
        },
      }),
    onSuccess: async (feeding) => {
      queryClient.setQueryData(["feeding-record-active", childId], feeding);
      queryClient.setQueryData(
        ["feeding-records", childId],
        (current: FeedingRecord[] | undefined) => {
          const items = current ?? [];
          return items.some((item) => item.id === feeding.id) ? items : [feeding, ...items];
        }
      );
      void syncFeedingLiveActivity(child!, feeding, language, undefined, accountId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feeding-records", childId] }),
        queryClient.invalidateQueries({ queryKey: ["feeding-record-active", childId] }),
      ]);
      navigate("/children", { replace: true });
    },
    onError: (error: { message?: string; response?: { data?: { detail?: string } } }) => {
      setValidationError(
        error.response?.data?.detail ??
          error.message ??
          (language === "ru"
            ? "Не удалось запустить таймер кормления."
            : "Could not start the feeding timer.")
      );
    },
  });

  if (!childId || !canViewFeedingChild) {
    return <Navigate to="/children" replace />;
  }

  if (isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  if (!child.babyModeEnabled) {
    return <Navigate to={`/children/${child.id}`} replace />;
  }

  if (
    !canActChild(child.id, accountFamilyRole, accountAccessPolicy) ||
    isChildLockedByPlan(child.id, familyAccess)
  ) {
    return <Navigate to={`/children/${child.id}/feeding`} replace />;
  }

  return (
    <div
      ref={pageRef}
      className="child-profile-shell min-h-[100dvh] space-y-6"
      style={{
        scrollPaddingBottom:
          "calc(7.5rem + var(--app-keyboard-height, 0px) + max(0.75rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom))))",
      }}
    >
      <IosEdgeBackGesture
        isEnabled={isIosShell && enableLocalSwipe}
        onBack={handleBack}
        targetRef={pageRef}
        presentation="route"
        underlaySnapshotKey={localUnderlaySnapshotKey}
      />
      <ChildSectionTopBar
        onBack={handleBack}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        title={`${copy.feedingDialogTitle} · ${child.name}`}
        hint={
          language === "ru"
            ? "Заполните детали кормления и сохраните запись."
            : "Fill in the feeding details and save the record."
        }
      />

      <Surface className="children-card-hero mx-auto w-full max-w-2xl p-4 pt-5 sm:p-6 sm:pt-6">
        <FeedingRecordForm
          copy={copy}
          language={language}
          feedingType={feedingType}
          breastSide={breastSide}
          isExpressed={isExpressed}
          formulaVolume={formulaVolume}
          durationMinutes={durationMinutes}
          recordedDate={recordedDate}
          recordedTime={recordedTime}
          note={note}
          validationError={validationError}
          timeInputMode="manual"
          onFeedingTypeChange={(value) => {
            setFeedingType(value);
            if (value === "formula") {
              setIsExpressed(false);
            }
          }}
          onBreastSideChange={setBreastSide}
          onExpressedChange={setIsExpressed}
          onFormulaVolumeChange={setFormulaVolume}
          onDurationMinutesChange={setDurationMinutes}
          onRecordedDateChange={setRecordedDate}
          onRecordedTimeChange={setRecordedTime}
          onNoteChange={setNote}
          onValidationErrorChange={setValidationError}
        />
      </Surface>

      <div className="mx-auto w-full max-w-2xl px-1 pb-[max(0.75rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))]">
        <div className="app-form-action-bar soft-panel grid grid-cols-2 gap-2 rounded-[24px] p-2">
          <button
            type="button"
            onClick={() => {
              if (!recordedDate || !recordedTime || !toApiDateTime(recordedDate, recordedTime)) {
                setValidationError(copy.feedingValidationTime);
                return;
              }
              setValidationError(null);
              createMutation.mutate();
            }}
            disabled={createMutation.isPending || startMutation.isPending}
            className="soft-pill app-profile-action min-h-[2.5rem] w-full px-3.25 text-center text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem]"
          >
            {createMutation.isPending ? copy.feedingSaving : copy.feedingSave}
          </button>
          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              startMutation.mutate();
            }}
            disabled={createMutation.isPending || startMutation.isPending}
            className="soft-pill-success app-profile-action app-profile-action--active min-h-[2.5rem] w-full px-3.25 text-center text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem]"
          >
            {startMutation.isPending ? copy.feedingStarting : copy.feedingStart}
          </button>
        </div>
      </div>
    </div>
  );
}
