import { useEffect } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
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
  cancelLabel = "Отмена",
  confirmTone = "primary",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
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
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть подтверждение"
        className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-background)_45%,transparent)] backdrop-blur-sm"
        onClick={isPending ? undefined : onCancel}
      />
      <div className="soft-panel relative z-[161] w-full max-w-md rounded-[30px] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-6">
        <div className="space-y-2">
          <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">{title}</h2>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="soft-button-secondary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.86rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:text-[0.89rem]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.86rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.05rem] sm:text-[0.89rem] ${
              confirmTone === "danger" ? "soft-button-danger" : "soft-button-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
