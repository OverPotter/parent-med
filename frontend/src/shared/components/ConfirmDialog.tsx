import { useEffect } from "react";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import { blurActiveField } from "@shared/utils/focus";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  closeAriaLabel?: string;
  confirmTone?: "danger" | "primary";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeAriaLabel,
  confirmTone = "primary",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isEnglishUi =
    typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("en");
  const resolvedCancelLabel = cancelLabel ?? (isEnglishUi ? "Cancel" : "Отмена");
  const resolvedCloseAriaLabel =
    closeAriaLabel ?? (isEnglishUi ? "Close confirmation" : "Закрыть подтверждение");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        blurActiveField();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={
        isPending
          ? undefined
          : () => {
              blurActiveField();
              onCancel();
            }
      }
      closeDisabled={isPending}
      zIndexClassName="z-[160]"
      backdropAriaLabel={resolvedCloseAriaLabel}
    >
      <div
        className={`soft-panel relative z-[1] w-full max-w-md rounded-[30px] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-6 ${
          confirmTone === "danger"
            ? "ring-1 ring-[color:color-mix(in_srgb,var(--color-danger)_28%,transparent)]"
            : ""
        }`}
      >
        {confirmTone === "danger" ? (
          <div
            className="mb-3 h-1.5 w-16 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-danger) 72%, transparent)",
            }}
          />
        ) : null}
        <div className="space-y-2">
          <h2
            className="app-card-title text-[1.08rem] sm:text-[1.15rem]"
            style={
              confirmTone === "danger"
                ? { color: "color-mix(in srgb, var(--color-danger) 84%, var(--color-foreground))" }
                : undefined
            }
          >
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              blurActiveField();
              onCancel();
            }}
            disabled={isPending}
            className="soft-pill app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem]"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              blurActiveField();
              onConfirm();
            }}
            disabled={isPending}
            className={`app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem] ${
              confirmTone === "danger"
                ? "soft-pill-danger"
                : "soft-pill-success app-profile-action--active"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}
