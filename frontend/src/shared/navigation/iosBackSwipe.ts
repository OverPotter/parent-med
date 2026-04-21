export const IOS_BACK_SWIPE_CAPTURE_RATIO = 0.34;
export const IOS_BACK_SWIPE_CAPTURE_MAX_PX = 220;
export const IOS_BACK_SWIPE_CAPTURE_MIN_PX = 0;
export const IOS_BACK_SWIPE_EDGE_PRIORITY_PX = 36;
export const IOS_BACK_SWIPE_SCROLL_GUARD_DISTANCE = 12;
export const IOS_BACK_SWIPE_LOCK_DISTANCE = 14;
export const IOS_BACK_SWIPE_LOCK_RATIO = 1.22;
export const IOS_BACK_SWIPE_VERTICAL_CANCEL_BEFORE_LOCK = 28;
export const IOS_BACK_SWIPE_VERTICAL_CANCEL_AFTER_LOCK = 56;
export const IOS_BACK_SWIPE_COMMIT_MS = 420;
export const IOS_BACK_SWIPE_CANCEL_MS = 360;

export function canStartIosBackSwipe(clientX: number, viewportWidth: number) {
  return (
    clientX >= IOS_BACK_SWIPE_CAPTURE_MIN_PX &&
    clientX <= Math.max(IOS_BACK_SWIPE_CAPTURE_MAX_PX, viewportWidth * IOS_BACK_SWIPE_CAPTURE_RATIO)
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
        "input",
        "textarea",
        "select",
        "label",
        ".soft-input",
        "[contenteditable='true']",
      ].join(",")
    )
  );
}

export function shouldIgnoreIosBackSwipeStartTarget(target: EventTarget | null, clientX?: number) {
  if (!(target instanceof Element)) {
    return false;
  }

  if (typeof clientX === "number" && clientX <= IOS_BACK_SWIPE_EDGE_PRIORITY_PX) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "[data-ios-local-back-swipe='true']",
        "[data-ios-disable-back-swipe='true']",
        "button",
        "a",
        "label",
        "summary",
        "input",
        "textarea",
        "select",
        ".soft-input",
        "[role='button']",
        "[role='link']",
        "[role='switch']",
        "[role='tab']",
        "[role='menuitem']",
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
  const threshold = Math.max(110, viewportWidth * 0.22);
  return dx >= threshold && (horizontalLocked || (dy <= 26 && dx >= 46));
}
