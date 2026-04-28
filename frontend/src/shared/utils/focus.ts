export function blurActiveField() {
  if (typeof document === "undefined") {
    return;
  }

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return;
  }

  if (
    activeElement.matches("input, textarea, select, [contenteditable='true'], [role='textbox']")
  ) {
    activeElement.blur();
  }
}

export function scrollFieldIntoView(
  target: EventTarget | HTMLElement | null | undefined,
  options?: { delayMs?: number; block?: ScrollLogicalPosition }
) {
  if (typeof window === "undefined") {
    return;
  }

  const element = target instanceof HTMLElement ? target : null;
  if (!element) {
    return;
  }

  if (
    !element.matches("input, textarea, select, [contenteditable='true'], [role='textbox']") &&
    !element.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")
  ) {
    return;
  }

  const scrollTarget =
    element.closest<HTMLElement>(
      "input, textarea, select, [contenteditable='true'], [role='textbox']"
    ) ?? element;

  const delayMs = options?.delayMs ?? 0;
  window.setTimeout(() => {
    scrollTarget.scrollIntoView({
      behavior: "smooth",
      block: options?.block ?? "center",
      inline: "nearest",
    });
  }, delayMs);
}
