import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { appLog } from "@shared/utils/appLog";

const ACCESS_TOKEN_KEY = "pillpath_auth_access_token";
const REFRESH_TOKEN_KEY = "pillpath_auth_refresh_token";
const LEGACY_PERSIST_KEY = "pillpath-app";

export function isNativeIOSRuntime(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

export async function readSecureAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  if (!isNativeIOSRuntime()) {
    return { accessToken: null, refreshToken: null };
  }

  let existingKeys = new Set<string>();
  let keysLoaded = false;
  try {
    const keysResult = await SecureStoragePlugin.keys();
    existingKeys = new Set(keysResult.value ?? []);
    keysLoaded = true;
  } catch {
    // If keys() fails, fallback to best-effort read with catches below.
  }

  const read = async (key: string) => {
    if (keysLoaded && !existingKeys.has(key)) {
      return null;
    }
    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value || null;
    } catch {
      return null;
    }
  };

  const [accessToken, refreshToken] = await Promise.all([
    read(ACCESS_TOKEN_KEY),
    read(REFRESH_TOKEN_KEY),
  ]);

  return { accessToken, refreshToken };
}

export async function writeSecureAuthTokens(tokens: {
  accessToken: string | null;
  refreshToken: string | null;
}): Promise<void> {
  if (!isNativeIOSRuntime()) {
    return;
  }

  let existingKeys = new Set<string>();
  let keysLoaded = false;
  try {
    const keysResult = await SecureStoragePlugin.keys();
    existingKeys = new Set(keysResult.value ?? []);
    keysLoaded = true;
  } catch {
    // Keep empty set and fallback to remove with catch.
  }

  const writeOrRemove = async (key: string, value: string | null) => {
    if (!value) {
      if (keysLoaded && !existingKeys.has(key)) {
        return;
      }
      try {
        await SecureStoragePlugin.remove({ key });
      } catch {
        // ignore remove errors for non-existing keys
      }
      return;
    }
    await SecureStoragePlugin.set({ key, value });
  };

  try {
    await Promise.all([
      writeOrRemove(ACCESS_TOKEN_KEY, tokens.accessToken),
      writeOrRemove(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  } catch (error) {
    appLog.warn("Secure storage: не удалось обновить токены", error);
  }
}

export async function clearSecureAuthTokens(): Promise<void> {
  await writeSecureAuthTokens({ accessToken: null, refreshToken: null });
}

function readLegacyPersistedTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_PERSIST_KEY);
    if (!raw) {
      return { accessToken: null, refreshToken: null };
    }
    const parsed = JSON.parse(raw) as { state?: { authToken?: unknown; refreshToken?: unknown } };
    const accessToken =
      typeof parsed?.state?.authToken === "string" ? parsed.state.authToken : null;
    const refreshToken =
      typeof parsed?.state?.refreshToken === "string" ? parsed.state.refreshToken : null;
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function scrubLegacyPersistedTokens(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_PERSIST_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    if (!parsed?.state) {
      return;
    }

    parsed.state.authToken = null;
    parsed.state.refreshToken = null;
    window.localStorage.setItem(LEGACY_PERSIST_KEY, JSON.stringify(parsed));
  } catch {
    // ignore malformed legacy storage
  }
}

export async function migrateLegacyAuthTokensToSecureStorage(): Promise<void> {
  if (!isNativeIOSRuntime()) {
    return;
  }

  const secureTokens = await readSecureAuthTokens();
  if (secureTokens.accessToken || secureTokens.refreshToken) {
    scrubLegacyPersistedTokens();
    return;
  }

  const legacyTokens = readLegacyPersistedTokens();
  if (!legacyTokens.accessToken && !legacyTokens.refreshToken) {
    return;
  }

  await writeSecureAuthTokens(legacyTokens);
  scrubLegacyPersistedTokens();
}
