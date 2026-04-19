import type { ReactNode } from "react";
import { cabinetActionSecondaryClass } from "./styles";

export function MedicineCabinetHeader({
  backLabel,
  onBack,
  title,
  hint,
  actionLabel,
  onAction,
  actionDisabled = false,
}: {
  backLabel: string;
  onBack: () => void;
  title: ReactNode;
  hint?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <div className="app-safe-top-header shrink-0 bg-background pb-3">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[2.35rem] min-w-0 items-center text-sm text-primary hover:underline"
          >
            {backLabel}
          </button>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              disabled={actionDisabled}
              className={`${cabinetActionSecondaryClass} max-w-full disabled:opacity-50`}
            >
              {actionLabel}
            </button>
          ) : (
            <div aria-hidden="true" className="min-h-[2.5rem] min-w-[3.5rem]" />
          )}
        </div>
        <div className="mt-3 space-y-1 px-1">
          <h2 className="app-card-title">{title}</h2>
          {hint ? <p className="text-sm leading-6 text-muted">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
