import { createPortal } from "react-dom";
import { useRef } from "react";
import type { ReactNode } from "react";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { useBodyScrollLock } from "@shared/hooks/useBodyScrollLock";

type FullscreenOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  backLabel: string;
  title: string;
  hint?: string | null;
  children: ReactNode;
  maxWidthClassName?: string;
  closeDisabled?: boolean;
};

export function FullscreenOverlay({
  isOpen,
  onClose,
  backLabel,
  title,
  hint = null,
  children,
  maxWidthClassName = "max-w-[32rem]",
  closeDisabled = false,
}: FullscreenOverlayProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useBodyScrollLock(isOpen);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "max(0.75rem, var(--app-safe-top-runtime, env(safe-area-inset-top)))",
        paddingBottom:
          "calc(max(1rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom))) + var(--app-keyboard-height, 0px))",
      }}
    >
      <IosEdgeBackGesture isEnabled={isOpen && !closeDisabled} onBack={onClose} targetRef={rootRef} />
      <div className="app-v3-background" aria-hidden="true">
        <div className="app-v3-decor app-v3-decor-a" />
        <div className="app-v3-decor app-v3-decor-b" />
        <div className="app-v3-decor app-v3-decor-c" />
        <div className="app-v3-noise" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/70 bg-background/88 px-4 pb-3 backdrop-blur-md sm:px-6">
          <div className={`mx-auto w-full ${maxWidthClassName}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              className="inline-flex min-h-[2.25rem] items-center text-sm font-extrabold text-primary disabled:opacity-50"
            >
              {backLabel}
            </button>
            <div className="mt-1.5">
              <h2 className="app-card-title text-[1.25rem]">{title}</h2>
              {hint ? <p className="mt-1 text-sm leading-6 text-muted">{hint}</p> : null}
            </div>
          </div>
        </div>

        <div
          data-fullscreen-overlay-scroll="true"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6"
          style={{
            paddingBottom:
              "calc(0.75rem + var(--app-keyboard-height, 0px) * 0.18)",
          }}
        >
          <div className={`mx-auto w-full ${maxWidthClassName}`}>{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
