const UPGRADE_DIALOG_REOPEN_KEY = "pm-upgrade-dialog-reopen";

function getCurrentLocationKey() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function markUpgradeDialogReopenPending(locationKey?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(UPGRADE_DIALOG_REOPEN_KEY, locationKey ?? getCurrentLocationKey());
}

export function consumeUpgradeDialogReopenPending() {
  if (typeof window === "undefined") {
    return false;
  }

  const pendingLocationKey = window.sessionStorage.getItem(UPGRADE_DIALOG_REOPEN_KEY);
  if (!pendingLocationKey) {
    return false;
  }

  const currentLocationKey = getCurrentLocationKey();
  if (pendingLocationKey !== currentLocationKey) {
    return false;
  }

  window.sessionStorage.removeItem(UPGRADE_DIALOG_REOPEN_KEY);
  return true;
}
