import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PermissionStatus } from "@capacitor/push-notifications";

type NativePushPlatform = "ios" | "android";
export type NativePushPermissionStatus = PermissionStatus["receive"];

const NATIVE_PUSH_OPT_OUT_KEY = "pm_native_push_opt_out";
const NATIVE_PUSH_TOKEN_KEY = "pm_native_push_token";
const NATIVE_PUSH_TIMEOUT_MS = 10_000;

let listenersAttached = false;
let pendingTokenResolver: ((value: string) => void) | null = null;
let pendingTokenRejecter: ((reason?: unknown) => void) | null = null;

function getNativePlatform(): NativePushPlatform | null {
  const platform = Capacitor.getPlatform();
  if (platform === "ios" || platform === "android") {
    return platform;
  }
  return null;
}

function setCachedNativeToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!token) {
    window.localStorage.removeItem(NATIVE_PUSH_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(NATIVE_PUSH_TOKEN_KEY, token);
}

function getCachedNativeToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(NATIVE_PUSH_TOKEN_KEY);
}

function attachListeners() {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;

  PushNotifications.addListener("registration", (token: Token) => {
    setCachedNativeToken(token.value);
    if (pendingTokenResolver) {
      pendingTokenResolver(token.value);
      pendingTokenResolver = null;
      pendingTokenRejecter = null;
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    if (pendingTokenRejecter) {
      pendingTokenRejecter(error);
      pendingTokenResolver = null;
      pendingTokenRejecter = null;
    }
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const url = event.notification.data?.url;
    if (typeof url !== "string" || !url.startsWith("/")) {
      return;
    }
    window.location.assign(url);
  });
}

async function ensurePermission(promptIfNeeded: boolean): Promise<PermissionStatus["receive"]> {
  const initial = await PushNotifications.checkPermissions();
  if (initial.receive === "granted") {
    return "granted";
  }
  if (!promptIfNeeded) {
    return initial.receive;
  }
  const requested = await PushNotifications.requestPermissions();
  return requested.receive;
}

async function requestToken(promptIfNeeded: boolean): Promise<string | null> {
  if (!isNativePushSupported()) {
    return null;
  }

  attachListeners();
  const permission = await ensurePermission(promptIfNeeded);
  if (permission !== "granted") {
    return null;
  }

  const existing = getCachedNativeToken();
  if (existing) {
    return existing;
  }

  const tokenPromise = new Promise<string>((resolve, reject) => {
    pendingTokenResolver = resolve;
    pendingTokenRejecter = reject;
  });

  await PushNotifications.register();

  return new Promise<string | null>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingTokenResolver = null;
      pendingTokenRejecter = null;
      resolve(null);
    }, NATIVE_PUSH_TIMEOUT_MS);

    tokenPromise
      .then((token) => {
        window.clearTimeout(timeoutId);
        resolve(token);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export function isNativePushSupported(): boolean {
  return Capacitor.isNativePlatform() && Boolean(getNativePlatform());
}

export async function getNativePushPermissionStatus(): Promise<NativePushPermissionStatus | null> {
  if (!isNativePushSupported()) {
    return null;
  }
  attachListeners();
  const permission = await PushNotifications.checkPermissions();
  return permission.receive;
}

export function openNativeNotificationSettings(): boolean {
  if (!isNativePushSupported() || typeof window === "undefined") {
    return false;
  }

  if (Capacitor.getPlatform() === "ios") {
    window.location.href = "app-settings:";
    return true;
  }

  return false;
}

export function isNativePushOptedOut(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(NATIVE_PUSH_OPT_OUT_KEY) === "1";
}

export function setNativePushOptOut(value: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  if (value) {
    window.localStorage.setItem(NATIVE_PUSH_OPT_OUT_KEY, "1");
    return;
  }
  window.localStorage.removeItem(NATIVE_PUSH_OPT_OUT_KEY);
}

export async function getNativePushSubscriptionPayload(options?: {
  promptIfNeeded?: boolean;
}): Promise<{
  channel: "native";
  endpoint: string;
  native_token: string;
  platform: NativePushPlatform;
  user_agent: string;
  device_label: string;
} | null> {
  if (!isNativePushSupported()) {
    return null;
  }
  const platform = getNativePlatform();
  if (!platform) {
    return null;
  }

  const token = await requestToken(Boolean(options?.promptIfNeeded));
  if (!token) {
    return null;
  }

  return {
    channel: "native",
    endpoint: token,
    native_token: token,
    platform,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "native",
    device_label: `App · ${platform === "ios" ? "iOS" : "Android"}`,
  };
}
