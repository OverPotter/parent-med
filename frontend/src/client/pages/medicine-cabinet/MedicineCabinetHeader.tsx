import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
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
    <ChildSectionTopBar
      onBack={onBack}
      backLabel={backLabel}
      title={title}
      hint={hint}
      action={
        actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className={`${cabinetActionSecondaryClass} max-w-full disabled:opacity-50`}
          >
            {actionLabel}
          </button>
        ) : null
      }
    />
  );
}
