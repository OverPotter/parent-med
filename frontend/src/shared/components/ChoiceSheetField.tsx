import { useState } from "react";
import type { ReactNode } from "react";
import { OverlayDialog } from "./OverlayDialog";

export type ChoiceSheetOption<T extends string> = {
  value: T;
  label: string;
  shortLabel?: string;
  hint?: string;
};

export function ChoiceSheetList<T extends string>({
  options,
  value,
  onSelect,
  className = "",
  activeCheckLabel = "✓",
  inactiveActionLabel,
  renderTrailing,
}: {
  options: ReadonlyArray<ChoiceSheetOption<T>>;
  value?: T | null;
  onSelect: (value: T) => void;
  className?: string;
  activeCheckLabel?: ReactNode;
  inactiveActionLabel?: ReactNode;
  renderTrailing?: (option: ChoiceSheetOption<T>, isActive: boolean) => ReactNode;
}) {
  return (
    <div className={`soft-choice-list ${className}`.trim()}>
      {options.map((option) => {
        const isActive = value != null && option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={["soft-choice-row", isActive ? "soft-choice-row-active" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="grid min-w-0 gap-0.5 text-left">
              <span className="min-w-0 text-sm font-semibold tracking-[-0.02em] text-foreground">
                {option.label}
              </span>
              {option.hint ? (
                <span className="min-w-0 text-[0.81rem] leading-5 text-muted">{option.hint}</span>
              ) : null}
            </span>
            <span className="soft-choice-check">
              {renderTrailing
                ? renderTrailing(option, isActive)
                : isActive
                  ? activeCheckLabel
                  : inactiveActionLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ChoiceSheetField<T extends string>({
  value,
  options,
  onChange,
  dialogTitle,
  dialogHint,
  dialogAriaLabel,
  triggerClassName = "",
  disabled = false,
  selectActionLabel = "Select",
}: {
  value: T;
  options: ReadonlyArray<ChoiceSheetOption<T>>;
  onChange: (value: T) => void | Promise<void>;
  dialogTitle: string;
  dialogHint?: string;
  dialogAriaLabel: string;
  triggerClassName?: string;
  disabled?: boolean;
  selectActionLabel?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const activeOption = options.find((option) => option.value === value) ?? options[0];

  const handleSelect = async (nextValue: T) => {
    if (isBusy) {
      return;
    }

    if (nextValue === value) {
      setIsOpen(false);
      return;
    }

    try {
      setIsBusy(true);
      await onChange(nextValue);
      setIsOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled || isBusy}
        className={`soft-input flex min-h-[2.82rem] w-full items-center justify-between gap-3 px-4 text-left text-[0.92rem] tracking-[-0.02em] disabled:opacity-60 sm:min-h-[2.92rem] ${triggerClassName}`.trim()}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={dialogAriaLabel}
      >
        <span className="min-w-0 truncate text-foreground">
          {activeOption?.shortLabel ?? activeOption?.label}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
        >
          ▾
        </span>
      </button>

      <OverlayDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom"
        zIndexClassName="z-[890]"
        backdropAriaLabel={dialogAriaLabel}
        containerClassName="flex items-end"
        backdropClassName="bg-[rgba(15,23,42,0.32)]"
      >
        <div
          data-ios-disable-back-swipe="true"
          className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
          <div className="space-y-1.5">
            <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">{dialogTitle}</h2>
            {dialogHint ? <p className="text-sm leading-5 text-muted">{dialogHint}</p> : null}
          </div>

          <ChoiceSheetList
            className="mt-4"
            options={options}
            value={value}
            onSelect={(nextValue) => {
              void handleSelect(nextValue);
            }}
            inactiveActionLabel={selectActionLabel}
          />
        </div>
      </OverlayDialog>
    </>
  );
}
