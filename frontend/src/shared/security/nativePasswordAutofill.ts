import { Capacitor, registerPlugin } from "@capacitor/core";

type NativePasswordAutofillPlugin = {
  saveCredential(args: {
    username: string;
    password: string;
    domains?: string[];
  }): Promise<{ savedDomains?: string[] }>;
  requestCredential(): Promise<{
    username?: string;
    password?: string;
    canceled?: boolean;
  }>;
};

const PasswordAutofill = registerPlugin<NativePasswordAutofillPlugin>("PasswordAutofill");

const FALLBACK_ASSOCIATED_DOMAINS = ["parent-med-production-frontend.up.railway.app"];

function isPluginUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? error.code : undefined;
  return code === "UNIMPLEMENTED" || code === "UNAVAILABLE";
}

function readConfiguredDomain(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function resolveAssociatedDomains(): string[] {
  const preferredDomain =
    readConfiguredDomain(import.meta.env.VITE_APP_SITE_URL) ??
    readConfiguredDomain(import.meta.env.VITE_MARKETING_SITE_URL) ??
    FALLBACK_ASSOCIATED_DOMAINS[0] ??
    null;

  return preferredDomain ? [preferredDomain] : [];
}

export function isNativePasswordAutofillSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export async function saveNativePasswordCredential(username: string, password: string) {
  if (!isNativePasswordAutofillSupported()) {
    return null;
  }

  try {
    return await PasswordAutofill.saveCredential({
      username,
      password,
      domains: resolveAssociatedDomains(),
    });
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function requestNativePasswordCredential(): Promise<{
  username: string;
  password: string;
} | null> {
  if (!isNativePasswordAutofillSupported()) {
    return null;
  }

  try {
    const result = await PasswordAutofill.requestCredential();
    if (result.canceled || !result.username || !result.password) {
      return null;
    }
    return {
      username: result.username,
      password: result.password,
    };
  } catch (error) {
    if (isPluginUnavailableError(error)) {
      return null;
    }
    throw error;
  }
}
