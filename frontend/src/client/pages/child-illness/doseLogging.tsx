import { useState } from "react";
import { DateField } from "@shared/components/DateField";
import { FullscreenOverlay } from "@shared/components/FullscreenOverlay";
import { getLocalIsoDate } from "@shared/utils/date";
import {
  finalizeTimeInput,
  getCurrentLocalTimeInputValue,
  normalizeTimeInput,
  toApiDateTime,
} from "@client/utils/feedingRecordForm";
import {
  illnessCompactInputClass,
  illnessCompactSecondaryButtonClass,
} from "./shared";
import { shouldRequestDoseTimeConfirmation } from "../../utils/medicationPlans";

export type DoseLoggingCandidate<T> = {
  item: T;
  nextAllowedAt?: Date | null;
  planName: string;
};

function formatElapsedSince(date: Date, now: Date, language: "ru" | "en"): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const totalMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (language === "ru") {
    if (totalMinutes < 60) {
      return `${totalMinutes} ${pluralizeRu(totalMinutes, ["минуту", "минуты", "минут"])}`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours} ${pluralizeRu(hours, ["час", "часа", "часов"])}`;
    }
    return `${hours} ${pluralizeRu(hours, ["час", "часа", "часов"])} ${minutes} ${pluralizeRu(minutes, ["минуту", "минуты", "минут"])}`;
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

function pluralizeRu(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}

export function useDoseLoggingFlow<T>(params: {
  language: "ru" | "en";
  now: Date;
  onSubmit: (item: T, administeredAt?: string | null) => void;
}) {
  const { language, now, onSubmit } = params;
  const [pendingCandidate, setPendingCandidate] = useState<DoseLoggingCandidate<T> | null>(null);
  const [pendingDate, setPendingDate] = useState(getLocalIsoDate());
  const [pendingTime, setPendingTime] = useState(getCurrentLocalTimeInputValue());

  const open = (candidate: DoseLoggingCandidate<T>) => {
    if (shouldRequestDoseTimeConfirmation(candidate.nextAllowedAt, now)) {
      setPendingCandidate(candidate);
      setPendingDate(getLocalIsoDate());
      setPendingTime(getCurrentLocalTimeInputValue());
      return;
    }

    onSubmit(candidate.item);
  };

  const close = () => setPendingCandidate(null);
  const pendingDoseAt = toApiDateTime(pendingDate, pendingTime);
  const hasFuturePendingDoseSelection = pendingDoseAt
    ? new Date(pendingDoseAt).getTime() > Date.now()
    : false;
  const submitPending = () => {
    if (!pendingCandidate || !pendingDoseAt || hasFuturePendingDoseSelection) {
      return;
    }

    onSubmit(pendingCandidate.item, pendingDoseAt);
  };

  const hint =
    pendingCandidate?.nextAllowedAt && pendingCandidate.nextAllowedAt <= now
      ? language === "ru"
        ? `С момента напоминания прошло ${formatElapsedSince(
            pendingCandidate.nextAllowedAt,
            now,
            language
          )}. Если лекарство дали, но забыли отметить это сразу, просто измените время ниже.`
        : `${formatElapsedSince(
            pendingCandidate.nextAllowedAt,
            now,
            language
          )} passed since the reminder. If the medicine was given but not logged right away, just adjust the time below.`
      : language === "ru"
        ? "Поставили текущее время по умолчанию. Если лекарство дали раньше, просто поправьте дату и время."
        : "The current time is prefilled. If the medicine was given earlier, just adjust the date and time.";

  return {
    close,
    hasFuturePendingDoseSelection,
    hint,
    isOpen: pendingCandidate !== null,
    open,
    pendingCandidate,
    pendingDate,
    pendingDoseAt,
    pendingTime,
    setPendingDate,
    setPendingTime,
    submitPending,
  };
}

export function DoseTimeSheet({
  language,
  isOpen,
  closeDisabled,
  hint,
  pendingDate,
  pendingTime,
  hasFuturePendingDoseSelection,
  isPending,
  submitLabel,
  onClose,
  onDateChange,
  onTimeChange,
  onSubmit,
}: {
  language: "ru" | "en";
  isOpen: boolean;
  closeDisabled: boolean;
  hint: string;
  pendingDate: string;
  pendingTime: string;
  hasFuturePendingDoseSelection: boolean;
  isPending: boolean;
  submitLabel: string;
  onClose: () => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <FullscreenOverlay
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={closeDisabled}
      backLabel={language === "ru" ? "Назад" : "Back"}
      title={language === "ru" ? "Уточните время приёма" : "Confirm dose time"}
      maxWidthClassName="max-w-[34rem]"
    >
      <div className="space-y-4 pb-2">
        <div className="soft-panel-muted rounded-[22px] px-4 py-3">
          <p className="text-sm leading-6 text-foreground/80">{hint}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="soft-field-label">
              {language === "ru" ? "Когда дали лекарство" : "When was the medicine given"}
            </span>
            <DateField
              value={pendingDate}
              onChange={onDateChange}
              language={language}
              max={getLocalIsoDate()}
              allowClear={false}
              panelPortalClassName="fixed inset-0 z-[10040]"
              hideBadge
              triggerClassName="justify-center text-center"
              valueClassName="text-center font-semibold tracking-[-0.03em]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="soft-field-label">{language === "ru" ? "Во сколько" : "Time"}</span>
            <input
              type="text"
              inputMode="numeric"
              value={pendingTime}
              onChange={(event) => onTimeChange(normalizeTimeInput(event.target.value))}
              onBlur={() => onTimeChange(finalizeTimeInput(pendingTime))}
              placeholder="08:30"
              className={`${illnessCompactInputClass} text-center font-semibold tracking-[-0.03em] tabular-nums`}
            />
          </label>
        </div>

        {hasFuturePendingDoseSelection ? (
          <p className="soft-note-danger mt-3 rounded-2xl px-3 py-2.5 text-xs leading-5">
            {language === "ru"
              ? "Нельзя указать время приёма в будущем. Выберите текущее время или раньше."
              : "You cannot set the administration time in the future. Choose the current time or earlier."}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className={`${illnessCompactSecondaryButtonClass} w-full`}
          >
            {language === "ru" ? "Отмена" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || hasFuturePendingDoseSelection}
            className={`${illnessCompactSecondaryButtonClass} w-full`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </FullscreenOverlay>
  );
}
