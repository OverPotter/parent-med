export const LIVE_ACTIVITY_REFRESH_EVENT = "live-activities:refresh";

export function requestLiveActivityRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LIVE_ACTIVITY_REFRESH_EVENT));
}
