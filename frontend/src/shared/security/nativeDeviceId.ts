import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { appLog } from "@shared/utils/appLog";

const NATIVE_DEVICE_ID_KEY = "pillpath_native_device_id";

let nativeDeviceIdCache: string | null = null;
let nativeDeviceIdPromise: Promise<string | null> | null = null;

function isNativeRuntime(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function readLocalMirror(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(NATIVE_DEVICE_ID_KEY);
}

function writeLocalMirror(deviceId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!deviceId) {
    window.localStorage.removeItem(NATIVE_DEVICE_ID_KEY);
    return;
  }
  window.localStorage.setItem(NATIVE_DEVICE_ID_KEY, deviceId);
}

function generateDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pm-device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readStoredNativeDeviceId(): Promise<string | null> {
    try {
        const result = await SecureStoragePlugin.get({ key: NATIVE_DEVICE_ID_KEY });
        const value = result.value || null;
        if (value) {
            writeLocalMirror(value);
        }
        return value;
    } catch {
        return readLocalMirror();
    }
}

async function writeStoredNativeDeviceId(deviceId: string): Promise<void> {
  writeLocalMirror(deviceId);
  try {
    await SecureStoragePlugin.set({ key: NATIVE_DEVICE_ID_KEY, value: deviceId });
  } catch (error) {
    appLog.warn("Secure storage: failed to persist native device id", error);
  }
}

export async function getOrCreateNativeDeviceId(): Promise<string | null> {
  if (!isNativeRuntime()) {
    return null;
  }

  if (nativeDeviceIdCache) {
    return nativeDeviceIdCache;
  }

  const localMirror = readLocalMirror();
  if (localMirror) {
    nativeDeviceIdCache = localMirror;
    return localMirror;
  }

  if (nativeDeviceIdPromise) {
    return nativeDeviceIdPromise;
  }

  nativeDeviceIdPromise = (async () => {
    const existing = await readStoredNativeDeviceId();
    if (existing) {
      nativeDeviceIdCache = existing;
      nativeDeviceIdPromise = null;
      return existing;
    }

    const created = generateDeviceId();
    nativeDeviceIdCache = created;
    nativeDeviceIdPromise = null;
    await writeStoredNativeDeviceId(created);
    return created;
  })();

  return nativeDeviceIdPromise;
}

export function getCachedNativeDeviceId(): string | null {
  if (nativeDeviceIdCache) {
    return nativeDeviceIdCache;
  }
  const localMirror = readLocalMirror();
  if (localMirror) {
    nativeDeviceIdCache = localMirror;
    return localMirror;
  }
  return null;
}
