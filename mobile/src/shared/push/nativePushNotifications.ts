import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Linking, Platform } from "react-native";

type NativePushPlatform = "ios" | "android";
export type NativePushPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

type NativePushSubscriptionPayload = {
  channel: "native";
  endpoint: string;
  native_token: string;
  platform: NativePushPlatform;
  device_id: string;
  user_agent: string;
  device_label: string;
};

const NATIVE_DEVICE_ID_KEY = "pillpath_mobile_native_device_id";
const NATIVE_PUSH_TOKEN_KEY = "pillpath_mobile_native_push_token";

let didConfigureForegroundHandler = false;
let cachedDeviceId: string | null = null;
let cachedNativeToken: string | null = null;
let deviceIdPromise: Promise<string | null> | null = null;

function configureForegroundHandler() {
  if (didConfigureForegroundHandler) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  didConfigureForegroundHandler = true;
}

function getNativePlatform(): NativePushPlatform | null {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return null;
}

function normalizePermissionStatus(
  status: Notifications.PermissionStatus | string | undefined,
): NativePushPermissionStatus {
  if (status === "granted") {
    return "granted";
  }

  if (status === "denied") {
    return "denied";
  }

  return "undetermined";
}

function generateDeviceId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `pm-mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readStoredValue(key: string) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeStoredValue(key: string, value: string | null) {
  try {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  } catch {
    // Best effort only for device-level push cache.
  }
}

async function getStoredNativeToken() {
  if (cachedNativeToken) {
    return cachedNativeToken;
  }

  const stored = await readStoredValue(NATIVE_PUSH_TOKEN_KEY);
  cachedNativeToken = stored;
  return stored;
}

async function setStoredNativeToken(token: string | null) {
  cachedNativeToken = token;
  await writeStoredValue(NATIVE_PUSH_TOKEN_KEY, token);
}

function buildSubscriptionPayload(
  token: string,
  platform: NativePushPlatform,
  deviceId: string,
): NativePushSubscriptionPayload {
  return {
    channel: "native",
    endpoint: token,
    native_token: token,
    platform,
    device_id: deviceId,
    user_agent: `expo-mobile/${platform}`,
    device_label: `App · ${platform === "ios" ? "iOS" : "Android"}`,
  };
}

export function isNativePushSupported() {
  return getNativePlatform() === "ios";
}

export async function getOrCreateNativeDeviceId(): Promise<string | null> {
  if (!isNativePushSupported()) {
    return null;
  }

  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  if (deviceIdPromise) {
    return deviceIdPromise;
  }

  deviceIdPromise = (async () => {
    const existing = await readStoredValue(NATIVE_DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      deviceIdPromise = null;
      return existing;
    }

    const created = generateDeviceId();
    cachedDeviceId = created;
    deviceIdPromise = null;
    await writeStoredValue(NATIVE_DEVICE_ID_KEY, created);
    return created;
  })();

  return deviceIdPromise;
}

export async function getNativePushPermissionStatus(): Promise<NativePushPermissionStatus> {
  if (!isNativePushSupported()) {
    return "denied";
  }

  const permissions = await Notifications.getPermissionsAsync();
  return normalizePermissionStatus(permissions.status);
}

export async function requestNativePushPermission(): Promise<NativePushPermissionStatus> {
  if (!isNativePushSupported()) {
    return "denied";
  }

  configureForegroundHandler();

  const current = await Notifications.getPermissionsAsync();
  const currentStatus = normalizePermissionStatus(current.status);
  if (currentStatus === "granted") {
    return currentStatus;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return normalizePermissionStatus(requested.status);
}

export async function getNativePushSubscriptionPayload(options?: {
  promptIfNeeded?: boolean;
}): Promise<NativePushSubscriptionPayload | null> {
  if (!isNativePushSupported()) {
    return null;
  }

  configureForegroundHandler();

  const platform = getNativePlatform();
  if (!platform) {
    return null;
  }

  const permission = options?.promptIfNeeded
    ? await requestNativePushPermission()
    : await getNativePushPermissionStatus();
  if (permission !== "granted") {
    return null;
  }

  const deviceId = await getOrCreateNativeDeviceId();
  if (!deviceId) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  if (typeof token.data !== "string" || !token.data.trim()) {
    return null;
  }

  const normalizedToken = token.data.trim();
  await setStoredNativeToken(normalizedToken);
  return buildSubscriptionPayload(normalizedToken, platform, deviceId);
}

export async function getStoredNativePushSubscriptionPayload(): Promise<NativePushSubscriptionPayload | null> {
  if (!isNativePushSupported()) {
    return null;
  }

  const platform = getNativePlatform();
  if (!platform) {
    return null;
  }

  const [deviceId, token] = await Promise.all([
    getOrCreateNativeDeviceId(),
    getStoredNativeToken(),
  ]);
  if (!deviceId || !token) {
    return null;
  }

  return buildSubscriptionPayload(token, platform, deviceId);
}

export async function clearStoredNativePushState() {
  cachedNativeToken = null;
  await writeStoredValue(NATIVE_PUSH_TOKEN_KEY, null);
}

export async function openNativeNotificationSettings() {
  await Linking.openSettings();
}

type PushNotificationUrlPayload = {
  url: string | null;
  childId: string | null;
};

function readPushNotificationUrlPayload(
  data: Record<string, unknown> | null | undefined,
): PushNotificationUrlPayload {
  const nestedData =
    typeof data?.data === "object" && data.data !== null
      ? (data.data as Record<string, unknown>)
      : null;
  const rawUrl = data?.url ?? nestedData?.url ?? null;
  const rawChildId = data?.childId ?? nestedData?.childId ?? null;

  return {
    url: typeof rawUrl === "string" ? rawUrl : null,
    childId: typeof rawChildId === "string" ? rawChildId : null,
  };
}

export function subscribeToPushNotificationResponses(
  onNavigate: (payload: PushNotificationUrlPayload) => void,
) {
  configureForegroundHandler();

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: Notifications.NotificationResponse) => {
      onNavigate(
        readPushNotificationUrlPayload(
          response.notification.request.content.data as Record<string, unknown>,
        ),
      );
    },
  );

  return () => {
    subscription.remove();
  };
}

export async function getInitialPushNotificationResponsePayload() {
  configureForegroundHandler();

  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) {
    return null;
  }

  return readPushNotificationUrlPayload(
    response.notification.request.content.data as Record<string, unknown>,
  );
}
