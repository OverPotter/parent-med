import { deletePushSubscription } from "@shared/api/pushNotifications";
import { clearNativeNavigationSessionState } from "@/app/push/sync";
import { stopAllLiveActivities } from "./liveActivities";
import {
  clearCachedNativePushState,
  getCachedNativePushSubscriptionPayload,
} from "./nativePushNotifications";
import {
  getExistingPushSubscription,
  toPushSubscriptionPayload,
  unsubscribeFromPushNotifications,
} from "./pushNotifications";

export async function cleanupDeviceSessionArtifacts() {
  try {
    await stopAllLiveActivities();
  } catch {
    // Ignore cleanup failures on logout/reset.
  }

  clearNativeNavigationSessionState();

  try {
    const nativeSubscription = getCachedNativePushSubscriptionPayload();
    if (nativeSubscription?.endpoint) {
      await deletePushSubscription({ endpoint: nativeSubscription.endpoint });
    }
  } catch {
    // Best effort only: backend logout/reset must still complete.
  } finally {
    clearCachedNativePushState();
  }

  try {
    const existingWebSubscription = await getExistingPushSubscription();
    if (existingWebSubscription) {
      await deletePushSubscription({
        endpoint: toPushSubscriptionPayload(existingWebSubscription).endpoint,
      });
      await unsubscribeFromPushNotifications();
    }
  } catch {
    // Best effort only.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("push:subscription-changed"));
  }
}
