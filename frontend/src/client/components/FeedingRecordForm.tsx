import { useState } from "react";
import { DateField } from "@shared/components/DateField";
import { getLocalIsoDate } from "@shared/utils/date";
import { finalizeTimeInput, normalizeTimeInput } from "@client/utils/feedingRecordForm";
import { getChildrenCopy } from "@client/i18n/children";

type FeedingType = "breast" | "formula";
type BreastSide = "left" | "right" | "both";

type FeedingCopy = ReturnType<typeof getChildrenCopy>["childrenPage"]["childCard"];

const choiceClass = "soft-pill app-profile-action min-h-[2.7rem] w-full text-sm";
const activeChoiceClass =
  "soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.7rem] w-full text-sm";

export function FeedingRecordForm({
  copy,
  language,
  feedingType,
  breastSide,
  isExpressed,
  formulaVolume,
  durationMinutes,
  recordedDate,
  recordedTime,
  note,
  validationError,
  timeInputMode,
  onFeedingTypeChange,
  onBreastSideChange,
  onExpressedChange,
  onFormulaVolumeChange,
  onDurationMinutesChange,
  onRecordedDateChange,
  onRecordedTimeChange,
  onNoteChange,
  onValidationErrorChange,
}: {
  copy: FeedingCopy;
  language: "ru" | "en";
  feedingType: FeedingType;
  breastSide: BreastSide;
  isExpressed: boolean;
  formulaVolume: string;
  durationMinutes: string;
  recordedDate: string;
  recordedTime: string;
  note: string;
  validationError: string | null;
  timeInputMode: "manual" | "native";
  onFeedingTypeChange: (value: FeedingType) => void;
  onBreastSideChange: (value: BreastSide) => void;
  onExpressedChange: (value: boolean) => void;
  onFormulaVolumeChange: (value: string) => void;
  onDurationMinutesChange: (value: string) => void;
  onRecordedDateChange: (value: string) => void;
  onRecordedTimeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onValidationErrorChange: (value: string | null) => void;
}) {
  const optionalPlaceholder = language === "ru" ? "Необязательно" : "Optional";
  const [isManualDetailsOpen, setIsManualDetailsOpen] = useState(false);
  const notePlaceholder =
    feedingType === "formula"
      ? copy.feedingNotePlaceholderFormula
      : copy.feedingNotePlaceholderBreast;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
        <p className="text-sm leading-5 text-muted">{copy.feedingModeHint}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onFeedingTypeChange("breast");
            onValidationErrorChange(null);
          }}
          className={feedingType === "breast" ? activeChoiceClass : choiceClass}
        >
          {copy.feedingTypeBreast}
        </button>
        <button
          type="button"
          onClick={() => {
            onFeedingTypeChange("formula");
            onValidationErrorChange(null);
          }}
          className={feedingType === "formula" ? activeChoiceClass : choiceClass}
        >
          {copy.feedingTypeFormula}
        </button>
      </div>

      {feedingType === "breast" ? (
        <>
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-3.5 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
            <label
              className={[
                "app-profile-action inline-flex min-h-[2.7rem] cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm transition",
                isExpressed
                  ? "soft-pill-primary app-profile-action--selected"
                  : "soft-pill text-foreground",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full border transition",
                  isExpressed
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white shadow-[0_6px_16px_-10px_rgb(var(--color-shadow)/0.35)]"
                    : "border-[color:color-mix(in_srgb,var(--color-primary)_14%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-surface)_82%,var(--color-surface-soft))] text-transparent",
                ].join(" ")}
              >
                <span className="text-[10px] font-semibold leading-none">✓</span>
              </span>
              <input
                type="checkbox"
                checked={isExpressed}
                onChange={(event) => {
                  onExpressedChange(event.target.checked);
                  onValidationErrorChange(null);
                }}
                className="sr-only"
              />
              <span>{copy.feedingExpressed}</span>
            </label>
            {isExpressed ? (
              <p className="mt-2 text-xs leading-5 text-muted">{copy.feedingExpressedHint}</p>
            ) : null}
            {!isExpressed ? (
              <>
                <p className="mt-3 soft-field-label">{copy.feedingBreastSideLabel}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { key: "left", label: copy.feedingBreastLeft },
                    { key: "right", label: copy.feedingBreastRight },
                    { key: "both", label: copy.feedingBreastBoth },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        onBreastSideChange(option.key as BreastSide);
                        onValidationErrorChange(null);
                      }}
                      className={breastSide === option.key ? activeChoiceClass : choiceClass}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : (
        <label className="block">
          <span className="soft-field-label">{copy.feedingFormulaVolumeLabel}</span>
          <input
            type="number"
            min="1"
            step="1"
            value={formulaVolume}
            onChange={(event) => {
              onFormulaVolumeChange(event.target.value);
              onValidationErrorChange(null);
            }}
            className="soft-input mt-1 w-full px-4"
            placeholder={optionalPlaceholder}
          />
        </label>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsManualDetailsOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 text-left shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]"
          aria-expanded={isManualDetailsOpen}
        >
          <span className="text-sm font-medium text-foreground">
            {copy.feedingManualDetailsToggle}
          </span>
          <span className="soft-pill app-profile-action min-h-[2.1rem] px-3 py-1 text-xs">
            {isManualDetailsOpen ? "−" : "+"}
          </span>
        </button>
        {isManualDetailsOpen ? (
          <div className="space-y-3">
            <div className="block">
              <span className="soft-field-label">{copy.feedingDateLabel}</span>
              <div className="mt-1 space-y-2">
                <DateField
                  value={recordedDate}
                  onChange={(nextValue) => {
                    onRecordedDateChange(nextValue);
                    onValidationErrorChange(null);
                  }}
                  language={language}
                  max={getLocalIsoDate()}
                  className="feeding-record-date-field"
                />
                <label className="block">
                  <span className="soft-field-label">{copy.feedingTimeLabel}</span>
                  <div className="relative mt-1">
                    {timeInputMode === "manual" ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={recordedTime}
                        onChange={(event) => {
                          onRecordedTimeChange(normalizeTimeInput(event.target.value));
                          onValidationErrorChange(null);
                        }}
                        onBlur={() => onRecordedTimeChange(finalizeTimeInput(recordedTime))}
                        placeholder="08:30"
                        className="soft-input min-h-[3.15rem] w-full px-4 text-center text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground placeholder:text-muted tabular-nums sm:text-[1.12rem]"
                      />
                    ) : (
                      <input
                        type="time"
                        value={recordedTime}
                        onChange={(event) => {
                          onRecordedTimeChange(event.target.value);
                          onValidationErrorChange(null);
                        }}
                        className="soft-input min-h-[3.15rem] w-full px-4 text-center text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground tabular-nums sm:text-[1.12rem]"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>
            {feedingType === "breast" ? (
              <label className="block rounded-[24px]">
                <span className="soft-field-label">{copy.feedingDurationLabel}</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={durationMinutes}
                  onChange={(event) => {
                    onDurationMinutesChange(event.target.value);
                    onValidationErrorChange(null);
                  }}
                  className="soft-input mt-1 w-full px-4"
                  placeholder={optionalPlaceholder}
                />
              </label>
            ) : null}
          </div>
        ) : null}
        <label className="block">
          <span className="soft-field-label">{copy.feedingNoteLabel}</span>
          <input
            type="text"
            value={note}
            onChange={(event) => {
              onNoteChange(event.target.value);
              onValidationErrorChange(null);
            }}
            className="soft-input mt-1 w-full px-4"
            placeholder={notePlaceholder || optionalPlaceholder}
          />
        </label>
      </div>

      {validationError ? <p className="soft-note-danger">{validationError}</p> : null}
    </div>
  );
}
