export const IOS_BACK_SWIPE_CAPTURE_RATIO = 0.16;
export const IOS_BACK_SWIPE_CAPTURE_MAX_PX = 72;
export const IOS_BACK_SWIPE_CAPTURE_MIN_PX = 0;
export const IOS_BACK_SWIPE_EDGE_PRIORITY_PX = 24;
export const IOS_BACK_SWIPE_SCROLL_GUARD_DISTANCE = 16;
export const IOS_BACK_SWIPE_LOCK_DISTANCE = 18;
export const IOS_BACK_SWIPE_LOCK_RATIO = 1.38;
export const IOS_BACK_SWIPE_VERTICAL_CANCEL_BEFORE_LOCK = 24;
export const IOS_BACK_SWIPE_VERTICAL_CANCEL_AFTER_LOCK = 44;
export const IOS_BACK_SWIPE_COMMIT_MS = 360;
export const IOS_BACK_SWIPE_CANCEL_MS = 280;

const IOS_BACK_SWIPE_TEXT_INPUT_SELECTORS = [
  "input",
  "textarea",
  "select",
  "label",
  ".soft-input",
  "[contenteditable='true']",
];

const IOS_BACK_SWIPE_INTERACTIVE_SELECTORS = [
  "button",
  "a",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
];

function matchesClosest(target: EventTarget | null, selectors: string[]) {
  if (!(target instanceof Element) || selectors.length === 0) {
    return false;
  }
  return Boolean(target.closest(selectors.join(",")));
}

export function canStartIosBackSwipe(clientX: number, viewportWidth: number) {
  return (
    clientX >= IOS_BACK_SWIPE_CAPTURE_MIN_PX &&
    clientX <= Math.min(IOS_BACK_SWIPE_CAPTURE_MAX_PX, viewportWidth * IOS_BACK_SWIPE_CAPTURE_RATIO)
  );
}

export function shouldIgnoreIosBackSwipeTarget(
  target: EventTarget | null,
  options?: { includeLocalSwipeRoot?: boolean }
) {
  const selectors = [
    options?.includeLocalSwipeRoot === false ? null : "[data-ios-local-back-swipe='true']",
    "[data-ios-disable-back-swipe='true']",
    ...IOS_BACK_SWIPE_TEXT_INPUT_SELECTORS,
  ].filter(Boolean) as string[];

  return matchesClosest(target, selectors);
}

export function shouldIgnoreIosBackSwipeStartTarget(
  target: EventTarget | null,
  clientX?: number,
  options?: { includeLocalSwipeRoot?: boolean }
) {
  if (typeof clientX === "number" && clientX <= IOS_BACK_SWIPE_EDGE_PRIORITY_PX) {
    return false;
  }

  const selectors = [
    options?.includeLocalSwipeRoot === false ? null : "[data-ios-local-back-swipe='true']",
    "[data-ios-disable-back-swipe='true']",
    ...IOS_BACK_SWIPE_TEXT_INPUT_SELECTORS,
    ...IOS_BACK_SWIPE_INTERACTIVE_SELECTORS,
  ].filter(Boolean) as string[];

  return matchesClosest(target, selectors);
}

export function shouldLockIosBackSwipe(dx: number, dy: number) {
  return dx >= IOS_BACK_SWIPE_LOCK_DISTANCE && dx >= dy * IOS_BACK_SWIPE_LOCK_RATIO;
}

export function shouldCancelIosBackSwipe(dx: number, dy: number, horizontalLocked: boolean) {
  const threshold = horizontalLocked
    ? IOS_BACK_SWIPE_VERTICAL_CANCEL_AFTER_LOCK
    : IOS_BACK_SWIPE_VERTICAL_CANCEL_BEFORE_LOCK;
  return dy > threshold && dy > Math.max(14, dx * 0.82);
}

export function shouldPreventScrollDuringIosBackSwipe(
  dx: number,
  dy: number,
  horizontalLocked: boolean
) {
  if (horizontalLocked) {
    return dx > 0;
  }
  return dx >= IOS_BACK_SWIPE_SCROLL_GUARD_DISTANCE && dx > dy * 1.04;
}

export function getIosBackSwipeOffset(dx: number, viewportWidth: number) {
  const safeDx = Math.max(0, dx);
  const knee = Math.min(viewportWidth * 0.5, 260);
  if (safeDx <= knee) {
    return Math.min(viewportWidth, safeDx * 1.02);
  }
  return Math.min(viewportWidth, knee * 1.02 + (safeDx - knee) * 0.68);
}

export function getIosBackSwipeProgress(offset: number, viewportWidth: number) {
  return Math.min(1, offset / Math.max(viewportWidth * 0.72, 1));
}

export function shouldCommitIosBackSwipe(
  dx: number,
  dy: number,
  horizontalLocked: boolean,
  viewportWidth: number
) {
  const threshold = Math.max(92, viewportWidth * 0.18);
  return dx >= threshold && (horizontalLocked || (dy <= 22 && dx >= 44));
}
