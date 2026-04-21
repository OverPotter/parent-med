const LIVE_ACTIVITY_PREFERENCES_KEY = "pm_live_activity_preferences_v1";
export const LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT = "live-activities:preferences-changed";

export type LiveActivityPreferencesCache = {
  sleepEnabled: boolean;
  feedingEnabled: boolean;
};

const defaultPreferences: LiveActivityPreferencesCache = {
  sleepEnabled: true,
  feedingEnabled: true,
};

export function getLiveActivityPreferencesCache(): LiveActivityPreferencesCache {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(LIVE_ACTIVITY_PREFERENCES_KEY);
    if (!raw) {
      return defaultPreferences;
    }
    const parsed = JSON.parse(raw) as Partial<LiveActivityPreferencesCache>;
    return {
      sleepEnabled: parsed.sleepEnabled ?? true,
      feedingEnabled: parsed.feedingEnabled ?? true,
    };
  } catch {
    return defaultPreferences;
  }
}

export function setLiveActivityPreferencesCache(value: LiveActivityPreferencesCache) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LIVE_ACTIVITY_PREFERENCES_KEY, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent(LIVE_ACTIVITY_PREFERENCES_CHANGED_EVENT, {
      detail: value,
    })
  );
}
