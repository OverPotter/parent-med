function getRoot(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.documentElement;
}

export function resetIosBackSwipeRootVisuals() {
  const root = getRoot();
  if (!root) {
    return;
  }
  root.removeAttribute("data-ios-back-swipe-active");
  root.removeAttribute("data-ios-back-swipe-commit");
  root.removeAttribute("data-ios-back-swipe-cancel");
  root.style.removeProperty("--ios-back-swipe-offset");
  root.style.removeProperty("--ios-back-swipe-progress");
}

export function startIosBackSwipeRootVisuals() {
  const root = getRoot();
  if (!root) {
    return;
  }
  root.setAttribute("data-ios-back-swipe-active", "true");
  root.style.setProperty("--ios-back-swipe-offset", "0px");
  root.style.setProperty("--ios-back-swipe-progress", "0");
}

export function cancelIosBackSwipeRootVisuals() {
  const root = getRoot();
  if (!root) {
    return;
  }
  root.removeAttribute("data-ios-back-swipe-active");
  root.setAttribute("data-ios-back-swipe-cancel", "true");
  root.style.setProperty("--ios-back-swipe-offset", "0px");
  root.style.setProperty("--ios-back-swipe-progress", "0");
}

export function commitIosBackSwipeRootVisuals(offset: number) {
  const root = getRoot();
  if (!root) {
    return;
  }
  root.removeAttribute("data-ios-back-swipe-active");
  root.setAttribute("data-ios-back-swipe-commit", "true");
  root.style.setProperty("--ios-back-swipe-offset", `${Math.max(0, offset)}px`);
  root.style.setProperty("--ios-back-swipe-progress", "1");
}

export function updateIosBackSwipeRootProgress(offset: number, progress: number) {
  const root = getRoot();
  if (!root) {
    return;
  }
  root.style.setProperty("--ios-back-swipe-offset", `${Math.max(0, offset)}px`);
  root.style.setProperty("--ios-back-swipe-progress", `${Math.max(0, progress)}`);
}

export function clearIosBackSwipeRootFlags() {
  const root = getRoot();
  if (!root) {
    return;
  }
  root.removeAttribute("data-ios-back-swipe-commit");
  root.removeAttribute("data-ios-back-swipe-cancel");
  root.removeAttribute("data-ios-back-swipe-active");
  root.style.removeProperty("--ios-back-swipe-offset");
  root.style.removeProperty("--ios-back-swipe-progress");
}
