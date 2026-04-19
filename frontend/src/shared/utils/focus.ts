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
