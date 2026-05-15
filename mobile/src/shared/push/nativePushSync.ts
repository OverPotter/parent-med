import {
  deletePushSubscription,
  fetchPushConfig,
  upsertPushSubscription,
} from "../../features/settings/api/settingsApi";
import {
  clearStoredNativePushState,
  getNativePushPermissionStatus,
  getNativePushSubscriptionPayload,
  getStoredNativePushSubscriptionPayload,
  isNativePushSupported,
  requestNativePushPermission,
  type NativePushPermissionStatus,
} from "./nativePushNotifications";

export type NativePushSyncResult =
  | { status: "unsupported" }
  | { status: "disabled" }
  | { status: "permission_denied"; permissionStatus: NativePushPermissionStatus }
  | { status: "token_missing"; permissionStatus: NativePushPermissionStatus }
  | { status: "enabled"; permissionStatus: NativePushPermissionStatus };

export async function syncNativePushSubscription(options: {
  accessToken: string | null;
  promptIfNeeded?: boolean;
}): Promise<NativePushSyncResult> {
  if (!options.accessToken || !isNativePushSupported()) {
    return { status: "unsupported" };
  }

  const pushConfig = await fetchPushConfig({ accessToken: options.accessToken });
  if (!pushConfig.enabled) {
    return { status: "disabled" };
  }

  const permissionStatus = options.promptIfNeeded
    ? await requestNativePushPermission()
    : await getNativePushPermissionStatus();
  if (permissionStatus !== "granted") {
    if (permissionStatus === "denied") {
      await deleteStoredNativePushSubscription({
        accessToken: options.accessToken,
      });
    }

    return {
      status: "permission_denied",
      permissionStatus,
    };
  }

  const payload = await getNativePushSubscriptionPayload({
    promptIfNeeded: false,
  });
  if (!payload) {
    return {
      status: "token_missing",
      permissionStatus,
    };
  }

  await upsertPushSubscription({
    accessToken: options.accessToken,
    subscription: payload,
  });

  return {
    status: "enabled",
    permissionStatus,
  };
}

export async function deleteStoredNativePushSubscription(options: {
  accessToken: string | null;
}) {
  const cachedPayload = await getStoredNativePushSubscriptionPayload();

  try {
    if (options.accessToken && cachedPayload?.endpoint) {
      await deletePushSubscription({
        accessToken: options.accessToken,
        endpoint: cachedPayload.endpoint,
      });
    }
  } finally {
    await clearStoredNativePushState();
  }
}
