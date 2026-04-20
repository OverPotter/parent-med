export const LIVE_ACTIVITY_DIAGNOSTICS_CHANGED_EVENT = "live-activities:diagnostics-changed";

const LIVE_ACTIVITY_DIAGNOSTICS_KEY = "pm_live_activity_diagnostics_v1";

export type LiveActivityDiagnosticsSnapshot = {
  updatedAt: string | null;
  nativeStatus: {
    supported: boolean;
    available: boolean;
    authorizationState?: string;
  } | null;
  lastAction: string | null;
  lastPayload: unknown;
  lastError: string | null;
  lastSync: string | null;
};

const defaultSnapshot: LiveActivityDiagnosticsSnapshot = {
  updatedAt: null,
  nativeStatus: null,
  lastAction: null,
  lastPayload: null,
  lastError: null,
  lastSync: null,
};

export function getLiveActivityDiagnostics(): LiveActivityDiagnosticsSnapshot {
  if (typeof window === "undefined") {
    return defaultSnapshot;
  }

  try {
    const raw = window.localStorage.getItem(LIVE_ACTIVITY_DIAGNOSTICS_KEY);
    if (!raw) {
      return defaultSnapshot;
    }
    return {
      ...defaultSnapshot,
      ...(JSON.parse(raw) as Partial<LiveActivityDiagnosticsSnapshot>),
    };
  } catch {
    return defaultSnapshot;
  }
}

export function updateLiveActivityDiagnostics(
  patch: Partial<LiveActivityDiagnosticsSnapshot>
): LiveActivityDiagnosticsSnapshot {
  const next: LiveActivityDiagnosticsSnapshot = {
    ...getLiveActivityDiagnostics(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LIVE_ACTIVITY_DIAGNOSTICS_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent(LIVE_ACTIVITY_DIAGNOSTICS_CHANGED_EVENT, {
        detail: next,
      })
    );
  }

  return next;
}

export function clearLiveActivityDiagnostics() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LIVE_ACTIVITY_DIAGNOSTICS_KEY);
  window.dispatchEvent(
    new CustomEvent(LIVE_ACTIVITY_DIAGNOSTICS_CHANGED_EVENT, {
      detail: defaultSnapshot,
    })
  );
}
