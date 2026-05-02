import type { FamilySubscriptionAccess } from "@shared/types/api";
import type { LiveActivityPreferencesCache } from "./liveActivityPreferences";

export type LiveActivityKind = "sleep" | "feeding" | "illness";

export function hasLiveActivityAccess(
  familyAccess?: Pick<FamilySubscriptionAccess, "canUseLiveActivities"> | null
) {
  return Boolean(familyAccess?.canUseLiveActivities);
}

export function buildScopedLiveActivityPreferences(
  kind: LiveActivityKind,
  enabled: boolean
): LiveActivityPreferencesCache {
  return {
    sleepEnabled: kind === "sleep" ? enabled : true,
    feedingEnabled: kind === "feeding" ? enabled : true,
    illnessEnabled: kind === "illness" ? enabled : true,
  };
}
