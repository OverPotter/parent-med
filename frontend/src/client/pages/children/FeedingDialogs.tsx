import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFeedingRecord, startFeedingRecord } from "@shared/api/feedingRecords";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { Child, FeedingRecord } from "@shared/types/api";
import { FeedingRecordForm } from "@client/components/FeedingRecordForm";
import { getChildrenCopy } from "@client/i18n/children";
import {
  getCurrentLocalDateInputValue,
  getCurrentLocalTimeInputValue,
  toApiDateTime,
} from "@client/utils/feedingRecordForm";
import {
  childActionPrimaryClass,
  childActionSecondaryClass,
  childActionSuccessClass,
} from "./shared";
import { syncFeedingLiveActivity } from "@shared/utils/liveActivities";

export function FeedingRecordDialog({
  child,
  copy,
  language,
  onClose,
}: {
  child: Child;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"]["childCard"];
  language: "ru" | "en";
  onClose: () => void;
}) {
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

  const createMutation = useMutation({
    mutationFn: () =>
      createFeedingRecord({
        child_id: child.id,
        feeding_type: feedingType,
        breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
        is_expressed: feedingType === "breast" ? isExpressed : false,
        formula_volume_ml:
          feedingType === "formula" ? Number.parseInt(formulaVolume.trim(), 10) || null : null,
        duration_minutes:
          feedingType === "breast" && durationMinutes.trim()
            ? Number.parseInt(durationMinutes.trim(), 10) || null
            : null,
        recorded_at: toApiDateTime(recordedDate, recordedTime),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", child.id] });
      onClose();
    },
  });

  const startMutation = useMutation({
    mutationFn: () =>
      startFeedingRecord({
        child_id: child.id,
        feeding_type: feedingType,
        breast_side: feedingType === "breast" && !isExpressed ? breastSide : null,
        is_expressed: feedingType === "breast" ? isExpressed : false,
        formula_volume_ml:
          feedingType === "formula" ? Number.parseInt(formulaVolume.trim(), 10) || null : null,
        note: note.trim() || null,
      }),
    onSuccess: (feeding) => {
      queryClient.invalidateQueries({ queryKey: ["feeding-records", child.id] });
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active", child.id] });
      void syncFeedingLiveActivity(child, feeding, language);
      onClose();
    },
  });

  return (
    <OverlayDialog
      isOpen
      onClose={createMutation.isPending ? undefined : onClose}
      closeDisabled={createMutation.isPending}
      zIndexClassName="z-[160]"
      backdropAriaLabel={copy.feedingCancel}
    >
      <div className="soft-panel relative z-[1] w-full max-w-[28rem] rounded-[30px] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="space-y-2">
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.03em]">
            {child.name}
          </span>
          <h2 className="app-card-title text-[1.02rem] sm:text-[1.12rem]">
            {copy.feedingDialogTitle}
          </h2>
          <p className="text-sm leading-5 text-muted">{copy.feedingTypeLabel}</p>
        </div>
        <div className="mt-4 space-y-3.5">
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
            timeInputMode="native"
            onFeedingTypeChange={(value) => {
              setFeedingType(value);
              if (value === "formula") {
                setIsExpressed(false);
              }
            }}
            onBreastSideChange={setBreastSide}
            onExpressedChange={setIsExpressed}
            onFormulaVolumeChange={(value) => {
              setFormulaVolume(value);
              setValidationError(null);
            }}
            onDurationMinutesChange={setDurationMinutes}
            onRecordedDateChange={setRecordedDate}
            onRecordedTimeChange={setRecordedTime}
            onNoteChange={setNote}
            onValidationErrorChange={setValidationError}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending || startMutation.isPending}
            className={`${childActionSecondaryClass} text-center disabled:opacity-50`}
          >
            {copy.feedingCancel}
          </button>
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
            className={`${childActionSecondaryClass} text-center disabled:opacity-50`}
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
            className={`${childActionPrimaryClass} text-center disabled:opacity-50`}
          >
            {startMutation.isPending ? copy.feedingStarting : copy.feedingStart}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}

export function FeedingStopDialog({
  feeding,
  copy,
  isPending,
  onClose,
  onConfirm,
}: {
  feeding: FeedingRecord;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"]["childCard"];
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const typeLabel =
    feeding.feedingType === "breast" ? copy.feedingTypeBreast : copy.feedingTypeFormula;
  return (
    <OverlayDialog
      isOpen
      onClose={isPending ? undefined : onClose}
      closeDisabled={isPending}
      zIndexClassName="z-[165]"
      backdropAriaLabel={copy.feedingCancel}
    >
      <div className="soft-panel relative z-[1] w-full max-w-[25rem] rounded-[28px] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="space-y-2">
          <h2 className="app-card-title text-[1.02rem] sm:text-[1.12rem]">
            {copy.stopFeedingConfirmTitle}
          </h2>
          <p className="text-sm leading-5 text-muted">{copy.stopFeedingConfirmDescription}</p>
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.03em]">
            {typeLabel}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={`${childActionSecondaryClass} disabled:opacity-50`}
          >
            {copy.feedingCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`${childActionSuccessClass} disabled:opacity-50`}
          >
            {isPending ? copy.feedingSaving : copy.stopFeedingConfirmAction}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}
