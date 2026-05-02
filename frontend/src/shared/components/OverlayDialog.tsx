import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useBodyScrollLock } from "@shared/hooks/useBodyScrollLock";
import { useMobileFormFocusHandlers } from "@shared/hooks/useMobileFormFocusHandlers";
import { blurActiveField } from "@shared/utils/focus";

type OverlayDialogProps = {
  isOpen: boolean;
  children: ReactNode;
  onClose?: () => void;
  closeDisabled?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  placement?: "center" | "bottom";
  zIndexClassName?: string;
  containerClassName?: string;
  backdropClassName?: string;
  backdropAriaLabel?: string;
  disableIosBackSwipe?: boolean;
};

export function OverlayDialog({
  isOpen,
  children,
  onClose,
  closeDisabled = false,
  closeOnEscape = true,
  closeOnBackdrop = true,
  placement = "center",
  zIndexClassName = "z-[160]",
  containerClassName,
  backdropClassName,
  backdropAriaLabel = "Close dialog",
  disableIosBackSwipe = true,
}: OverlayDialogProps) {
  const formFocusHandlers = useMobileFormFocusHandlers();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || !onClose || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDisabled, closeOnEscape, isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const resolvedContainerClassName =
    containerClassName ??
    (placement === "bottom" ? "flex items-end" : "flex items-center justify-center p-4 sm:p-6");
  const resolvedBackdropClassName =
    backdropClassName ??
    (placement === "bottom"
      ? "bg-[rgba(15,23,42,0.32)]"
      : "bg-[color:color-mix(in_srgb,var(--color-background)_82%,var(--color-surface-soft)_18%)] backdrop-blur-md");

  return createPortal(
    <div
      data-ios-local-back-swipe={disableIosBackSwipe ? "true" : undefined}
      data-ios-disable-back-swipe={disableIosBackSwipe ? "true" : undefined}
      onPointerDownCapture={formFocusHandlers.onPointerDownCapture}
      onFocusCapture={formFocusHandlers.onFocusCapture}
      className={`fixed inset-0 ${zIndexClassName} ${resolvedContainerClassName}`}
      style={{
        paddingTop:
          placement === "bottom"
            ? "0"
            : "max(1rem, var(--app-safe-top-runtime, env(safe-area-inset-top)))",
        paddingBottom:
          placement === "bottom"
            ? "0"
            : "max(1rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
      }}
    >
      <button
        type="button"
        aria-label={backdropAriaLabel}
        className={`absolute inset-0 ${resolvedBackdropClassName}`}
        onPointerDown={() => blurActiveField()}
        onClick={closeDisabled || !closeOnBackdrop ? undefined : onClose}
      />
      {children}
    </div>,
    document.body
  );
}
