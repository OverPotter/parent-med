import { blurActiveFieldOnBackdropTap, scrollFieldIntoView } from "@shared/utils/focus";

export function useMobileFormFocusHandlers(options?: {
  onFieldFocus?: () => void;
  scrollDelayMs?: number;
  scrollBlock?: ScrollLogicalPosition;
}) {
  return {
    onFocusCapture: (event: React.FocusEvent<HTMLElement>) => {
      scrollFieldIntoView(event.target, {
        delayMs: options?.scrollDelayMs ?? 120,
        block: options?.scrollBlock ?? "center",
      });
      options?.onFieldFocus?.();
    },
    onPointerDownCapture: (event: React.PointerEvent<HTMLElement>) => {
      blurActiveFieldOnBackdropTap(event.target);
    },
  };
}
