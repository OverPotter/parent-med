import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PermissionStatus } from "@capacitor/push-notifications";

type NativePushPlatform = "ios" | "android";
export type NativePushPermissionStatus = PermissionStatus["receive"];

const NATIVE_PUSH_OPT_OUT_KEY = "pm_native_push_opt_out";
const NATIVE_PUSH_TOKEN_KEY = "pm_native_push_token";
const NATIVE_PUSH_TIMEOUT_MS = 10_000;
const NATIVE_PUSH_NAVIGATION_EVENT = "native-push:navigate";
const PUSH_SUBSCRIPTION_CHANGED_EVENT = "push:subscription-changed";

let listenersAttached = false;
let pendingTokenResolver: ((value: string) => void) | null = null;
let pendingTokenRejecter: ((reason?: unknown) => void) | null = null;
let cachedPermissionStatus: PermissionStatus["receive"] | null = null;
let permissionStatusPromise: Promise<PermissionStatus["receive"]> | null = null;
let tokenRequestPromise: Promise<string | null> | null = null;

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
    const previousToken = getCachedNativeToken();
    setCachedNativeToken(token.value);
    if (typeof window !== "undefined" && previousToken !== token.value) {
      window.dispatchEvent(new Event(PUSH_SUBSCRIPTION_CHANGED_EVENT));
    }
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
    const data = event.notification.data ?? {};
    const nestedData = typeof data.data === "object" && data.data !== null ? data.data : {};
    const url = data.url ?? (nestedData as { url?: unknown }).url;
    if (typeof url !== "string" || !url.startsWith("/")) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent(NATIVE_PUSH_NAVIGATION_EVENT, {
        detail: { url },
      })
    );
    window.setTimeout(() => {
      if (window.location.pathname + window.location.search !== url) {
        window.location.assign(url);
      }
    }, 120);
  });
}

export { NATIVE_PUSH_NAVIGATION_EVENT };

async function ensurePermission(promptIfNeeded: boolean): Promise<PermissionStatus["receive"]> {
  if (cachedPermissionStatus === "granted" || (!promptIfNeeded && cachedPermissionStatus)) {
    return cachedPermissionStatus;
  }

  if (permissionStatusPromise) {
    const existing = await permissionStatusPromise;
    if (existing === "granted" || !promptIfNeeded) {
      return existing;
    }
  }

  permissionStatusPromise = (async () => {
    const initial = await PushNotifications.checkPermissions();
    cachedPermissionStatus = initial.receive;
    if (initial.receive === "granted" || !promptIfNeeded) {
      return initial.receive;
    }
    const requested = await PushNotifications.requestPermissions();
    cachedPermissionStatus = requested.receive;
    return requested.receive;
  })();

  try {
    return await permissionStatusPromise;
  } finally {
    permissionStatusPromise = null;
  }
}

async function requestToken(options?: {
  promptIfNeeded?: boolean;
  forceRefresh?: boolean;
  allowCachedFallback?: boolean;
}): Promise<string | null> {
  if (!isNativePushSupported()) {
    return null;
  }

  if (tokenRequestPromise) {
    return tokenRequestPromise;
  }

  tokenRequestPromise = (async () => {
    attachListeners();
    const promptIfNeeded = Boolean(options?.promptIfNeeded);
    const forceRefresh = Boolean(options?.forceRefresh);
    const allowCachedFallback = options?.allowCachedFallback ?? true;
    const existing = getCachedNativeToken();
    const permission = await ensurePermission(promptIfNeeded);
    if (permission !== "granted") {
      return null;
    }

    if (existing && !forceRefresh) {
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
        resolve(allowCachedFallback ? existing : null);
      }, NATIVE_PUSH_TIMEOUT_MS);

      tokenPromise
        .then((token) => {
          window.clearTimeout(timeoutId);
          resolve(token);
        })
        .catch((error) => {
          window.clearTimeout(timeoutId);
          if (allowCachedFallback && existing) {
            resolve(existing);
            return;
          }
          reject(error);
        });
    });
  })();

  try {
    return await tokenRequestPromise;
  } finally {
    tokenRequestPromise = null;
  }
}

export function isNativePushSupported(): boolean {
  return Capacitor.isNativePlatform() && Boolean(getNativePlatform());
}

export async function getNativePushPermissionStatus(): Promise<NativePushPermissionStatus | null> {
  if (!isNativePushSupported()) {
    return null;
  }
  return ensurePermission(false);
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

  const token = await requestToken({
    promptIfNeeded: options?.promptIfNeeded,
    forceRefresh: true,
    allowCachedFallback: true,
  });
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

export async function refreshNativePushSubscriptionPayload(options?: {
  promptIfNeeded?: boolean;
  allowCachedFallback?: boolean;
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

  const token = await requestToken({
    promptIfNeeded: options?.promptIfNeeded,
    forceRefresh: true,
    allowCachedFallback: options?.allowCachedFallback ?? false,
  });
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

export function getCachedNativePushSubscriptionPayload(): {
  channel: "native";
  endpoint: string;
  native_token: string;
  platform: NativePushPlatform;
  user_agent: string;
  device_label: string;
} | null {
  if (!isNativePushSupported()) {
    return null;
  }
  const platform = getNativePlatform();
  const token = getCachedNativeToken();
  if (!platform || !token) {
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
