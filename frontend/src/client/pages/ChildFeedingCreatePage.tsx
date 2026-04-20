import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { createFeedingRecord, startFeedingRecord } from "@shared/api/feedingRecords";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { FeedingRecordForm } from "@client/components/FeedingRecordForm";
import { getChildrenCopy } from "@client/i18n/children";
import {
  getCurrentLocalDateInputValue,
  getCurrentLocalTimeInputValue,
  toApiDateTime,
} from "@client/utils/feedingRecordForm";

export function ChildFeedingCreatePage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childrenPage.childCard;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
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

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    let frameId = 0;
    let timeoutId: number | null = null;

    const scrollFocusedFieldIntoView = (target: HTMLElement) => {
      const run = () => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      };

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
    enabled: !!childId,
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
      startFeedingRecord({
        child_id: child!.id,
        feeding_type: feedingType,
        breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
        is_expressed: feedingType === "breast" ? isExpressed : false,
        formula_volume_ml:
          feedingType === "formula" && formulaVolume.trim()
            ? Number.parseInt(formulaVolume.trim(), 10) || null
            : null,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", childId] });
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active", childId] });
      navigate("/children", { replace: true });
    },
  });

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  if (!child.babyModeEnabled) {
    return <Navigate to={`/children/${child.id}`} replace />;
  }

  return (
    <div ref={pageRef} className="child-profile-shell space-y-6">
      <ChildSectionTopBar
        backHref={`/children/${child.id}`}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        title={`${copy.feedingDialogTitle} · ${child.name}`}
        hint={
          language === "ru"
            ? "Заполните детали кормления и сохраните запись."
            : "Fill in the feeding details and save the record."
        }
      />

      <Surface className="children-card-hero mx-auto w-full max-w-2xl p-4 sm:p-6">
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
        <div className="soft-panel grid grid-cols-2 gap-2 rounded-[24px] p-2">
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
