import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { createFeedingRecord, startFeedingRecord } from "@shared/api/feedingRecords";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
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
    <div className="min-w-0 space-y-6">
      <div className="px-1">
        <Link to="/children" className="inline-flex text-sm text-primary hover:underline">
          {language === "ru" ? "← К детям" : "← Back to children"}
        </Link>
      </div>

      <div className="space-y-1 px-1">
        <h1 className="app-card-title">
          {copy.feedingDialogTitle} · {child.name}
        </h1>
        <p className="text-sm text-muted">
          {language === "ru"
            ? "Заполните детали кормления и сохраните запись."
            : "Fill in the feeding details and save the record."}
        </p>
      </div>

      <Surface className="p-4 sm:p-6">
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

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-20">
        <div className="mx-auto max-w-3xl px-1">
          <div className="grid grid-cols-2 gap-2">
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
              className="soft-button-secondary app-btn-secondary-md inline-flex min-h-[3rem] w-full items-center justify-center px-3 text-center disabled:opacity-50"
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
              className="soft-button-primary app-btn-primary-md inline-flex min-h-[3rem] w-full items-center justify-center px-3 text-center disabled:opacity-50"
            >
              {startMutation.isPending ? copy.feedingStarting : copy.feedingStart}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
