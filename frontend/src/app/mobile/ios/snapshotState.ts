export const IOS_UNDERLAY_SNAPSHOT_CHANGE_EVENT = "pm:ios-underlay-snapshot-change";

export type IOSScreenSnapshot = {
  html: string;
  bottomNavHtml: string;
  scrollY: number;
};

export const EMPTY_IOS_SCREEN_SNAPSHOT: IOSScreenSnapshot = {
  html: "",
  bottomNavHtml: "",
  scrollY: 0,
};

type IOSSnapshotWindow = Window & {
  __PM_IOS_PREVIOUS_SCREEN_SNAPSHOT?: IOSScreenSnapshot;
  __PM_IOS_SCREEN_SNAPSHOT_MAP?: Record<string, IOSScreenSnapshot>;
  __PM_IOS_ACTIVE_UNDERLAY_SNAPSHOT_KEY?: string | null;
};

function getSnapshotWindow(): IOSSnapshotWindow | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window as IOSSnapshotWindow;
}

export function isIosRouteSnapshotKey(snapshotKey: string | null | undefined): snapshotKey is string {
  return typeof snapshotKey === "string" && snapshotKey.startsWith("/");
}

export function setIosRouteSnapshot(routeKey: string, snapshot: IOSScreenSnapshot) {
  const snapshotWindow = getSnapshotWindow();
  if (!snapshotWindow) {
    return;
  }
  snapshotWindow.__PM_IOS_SCREEN_SNAPSHOT_MAP = {
    ...(snapshotWindow.__PM_IOS_SCREEN_SNAPSHOT_MAP ?? {}),
    [routeKey]: snapshot,
  };
}

export function setIosPreviousScreenSnapshot(snapshot: IOSScreenSnapshot) {
  const snapshotWindow = getSnapshotWindow();
  if (!snapshotWindow) {
    return;
  }
  snapshotWindow.__PM_IOS_PREVIOUS_SCREEN_SNAPSHOT = snapshot;
}

export function setIosActiveUnderlaySnapshotKey(snapshotKey?: string | null) {
  const snapshotWindow = getSnapshotWindow();
  if (!snapshotWindow) {
    return;
  }
  snapshotWindow.__PM_IOS_ACTIVE_UNDERLAY_SNAPSHOT_KEY = snapshotKey ?? null;
}

export function notifyIosUnderlaySnapshotChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(IOS_UNDERLAY_SNAPSHOT_CHANGE_EVENT));
}

export function readIosRouteSnapshot(routeKey: string | null | undefined): IOSScreenSnapshot | null {
  if (!isIosRouteSnapshotKey(routeKey)) {
    return null;
  }

  const snapshotWindow = getSnapshotWindow();
  return snapshotWindow?.__PM_IOS_SCREEN_SNAPSHOT_MAP?.[routeKey] ?? null;
}

export function readIosPreviousScreenSnapshot(): IOSScreenSnapshot {
  const snapshotWindow = getSnapshotWindow();
  return snapshotWindow?.__PM_IOS_PREVIOUS_SCREEN_SNAPSHOT ?? EMPTY_IOS_SCREEN_SNAPSHOT;
}

export function readIosActiveSnapshot(currentPathKey?: string): IOSScreenSnapshot {
  const snapshotWindow = getSnapshotWindow();
  if (!snapshotWindow) {
    return EMPTY_IOS_SCREEN_SNAPSHOT;
  }

  const activeKey = snapshotWindow.__PM_IOS_ACTIVE_UNDERLAY_SNAPSHOT_KEY;
  const routeSnapshot =
    activeKey && activeKey !== currentPathKey ? readIosRouteSnapshot(activeKey) : null;
  if (routeSnapshot) {
    return routeSnapshot;
  }

  return readIosPreviousScreenSnapshot();
}
