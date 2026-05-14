import * as SecureStore from "expo-secure-store";
import type { MobileIllnessObservation } from "../illness/model/illnessObservation";

const STORAGE_KEY = "pillpath.mobile.illness-live-activity-preferences.v1";

type PreferenceMap = Record<string, boolean>;
type PreferenceListener = () => void;

let preferenceMap: PreferenceMap = {};
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
const listeners = new Set<PreferenceListener>();

function buildPreferenceKey(accountId: string, episodeId: string) {
  return `${accountId}:${episodeId}`;
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

async function writePreferenceMap() {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preferenceMap));
}

export async function ensureIllnessLiveActivityPreferencesHydrated() {
  if (hydrated) {
    return;
  }

  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!raw) {
          preferenceMap = {};
          return;
        }

        const parsed = JSON.parse(raw) as PreferenceMap | null;
        preferenceMap =
          parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        preferenceMap = {};
      } finally {
        hydrated = true;
        hydratePromise = null;
      }
    })();
  }

  await hydratePromise;
}

export function subscribeIllnessLiveActivityPreferences(
  listener: PreferenceListener,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isIllnessLiveActivityEnabled(
  observation: Pick<
    MobileIllnessObservation,
    "episodeId" | "createdByAccountId"
  > | null | undefined,
  currentAccountId?: string | null,
) {
  if (!observation || !currentAccountId) {
    return false;
  }

  const key = buildPreferenceKey(currentAccountId, observation.episodeId);
  if (key in preferenceMap) {
    return Boolean(preferenceMap[key]);
  }

  return observation.createdByAccountId === currentAccountId;
}

export async function setIllnessLiveActivityEnabled(args: {
  episodeId: string;
  accountId: string;
  enabled: boolean;
}) {
  await ensureIllnessLiveActivityPreferencesHydrated();
  preferenceMap[buildPreferenceKey(args.accountId, args.episodeId)] = args.enabled;
  await writePreferenceMap();
  emitChange();
}
