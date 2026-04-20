export const IOS_BACK_SWIPE_CAPTURE_RATIO = 0.34;
export const IOS_BACK_SWIPE_CAPTURE_MAX_PX = 220;
export const IOS_BACK_SWIPE_CAPTURE_MIN_PX = 16;
export const IOS_BACK_SWIPE_SCROLL_GUARD_DISTANCE = 12;
export const IOS_BACK_SWIPE_LOCK_DISTANCE = 18;
export const IOS_BACK_SWIPE_LOCK_RATIO = 1.34;
export const IOS_BACK_SWIPE_VERTICAL_CANCEL_BEFORE_LOCK = 28;
export const IOS_BACK_SWIPE_VERTICAL_CANCEL_AFTER_LOCK = 56;
export const IOS_BACK_SWIPE_COMMIT_MS = 420;
export const IOS_BACK_SWIPE_CANCEL_MS = 440;

export function canStartIosBackSwipe(clientX: number, viewportWidth: number) {
  return (
    clientX >= IOS_BACK_SWIPE_CAPTURE_MIN_PX &&
    clientX <= Math.min(IOS_BACK_SWIPE_CAPTURE_MAX_PX, viewportWidth * IOS_BACK_SWIPE_CAPTURE_RATIO)
  );
}

export function shouldIgnoreIosBackSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "[data-ios-local-back-swipe='true']",
        "[data-ios-disable-back-swipe='true']",
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "label",
        "summary",
        "[role='button']",
        "[role='link']",
        "[role='switch']",
        "[role='tab']",
        "[contenteditable='true']",
      ].join(",")
    )
  );
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
  const knee = Math.min(viewportWidth * 0.42, 220);
  if (safeDx <= knee) {
    return safeDx * 0.96;
  }
  return Math.min(viewportWidth, knee * 0.96 + (safeDx - knee) * 0.42);
}

export function getIosBackSwipeProgress(offset: number, viewportWidth: number) {
  return Math.min(1, offset / Math.max(viewportWidth * 0.82, 1));
}

export function shouldCommitIosBackSwipe(
  dx: number,
  dy: number,
  horizontalLocked: boolean,
  viewportWidth: number
) {
  const threshold = Math.max(110, viewportWidth * 0.22);
  return dx >= threshold && (horizontalLocked || (dy <= 26 && dx >= 46));
}
