import type { MobilePushPreferences } from "../settings/api/settingsApi";

export type MobileLiveActivityPreferences = {
  sleepEnabled: boolean;
  feedingEnabled: boolean;
  illnessEnabled: boolean;
};

export const defaultMobileLiveActivityPreferences: MobileLiveActivityPreferences = {
  sleepEnabled: true,
  feedingEnabled: true,
  illnessEnabled: true,
};

export function toMobileLiveActivityPreferences(
  preferences:
    | Pick<
        MobilePushPreferences,
        | "liveActivitySleepEnabled"
        | "liveActivityFeedingEnabled"
        | "liveActivityIllnessEnabled"
      >
    | null
    | undefined,
): MobileLiveActivityPreferences {
  if (!preferences) {
    return defaultMobileLiveActivityPreferences;
  }

  return {
    sleepEnabled: preferences.liveActivitySleepEnabled,
    feedingEnabled: preferences.liveActivityFeedingEnabled,
    illnessEnabled: preferences.liveActivityIllnessEnabled,
  };
}
