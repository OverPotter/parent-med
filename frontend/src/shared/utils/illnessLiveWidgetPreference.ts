import type { IllnessEpisode } from "@shared/types/api";

const STORAGE_KEY = "pillpath-illness-live-widget-preferences-v1";
export const ILLNESS_LIVE_WIDGET_PREFERENCES_CHANGED_EVENT =
  "illness-live-widget:preferences-changed";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type PreferenceMap = Record<string, boolean>;
type PreferenceListener = () => void;

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage ?? null;
}

function buildPreferenceKey(accountId: string, episodeId: string) {
  return `${accountId}:${episodeId}`;
}

function readPreferenceMap(): PreferenceMap {
  const storage = getStorage();
  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as PreferenceMap | null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePreferenceMap(value: PreferenceMap) {
  const storage = getStorage();
  if (!storage || typeof window === "undefined") {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(ILLNESS_LIVE_WIDGET_PREFERENCES_CHANGED_EVENT));
}

export function subscribeIllnessLiveWidgetPreferences(listener: PreferenceListener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => {
    listener();
  };

  window.addEventListener(ILLNESS_LIVE_WIDGET_PREFERENCES_CHANGED_EVENT, handleChange);
  return () => {
    window.removeEventListener(ILLNESS_LIVE_WIDGET_PREFERENCES_CHANGED_EVENT, handleChange);
  };
}

export function isIllnessLiveWidgetEnabled(
  episode: Pick<IllnessEpisode, "id" | "createdByAccountId"> | null | undefined,
  currentAccountId?: string | null
) {
  if (!episode || !currentAccountId) {
    return false;
  }

  const preferences = readPreferenceMap();
  const key = buildPreferenceKey(currentAccountId, episode.id);
  if (key in preferences) {
    return Boolean(preferences[key]);
  }

  return episode.createdByAccountId === currentAccountId;
}

export function setIllnessLiveWidgetEnabled(args: {
  episodeId: string;
  accountId: string;
  enabled: boolean;
}) {
  const preferences = readPreferenceMap();
  preferences[buildPreferenceKey(args.accountId, args.episodeId)] = args.enabled;
  writePreferenceMap(preferences);
}
