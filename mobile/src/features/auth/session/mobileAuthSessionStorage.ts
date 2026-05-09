import * as SecureStore from "expo-secure-store";
import type { MobileAuthSession } from "../api/authApi";

const SESSION_KEY = "pillpath_mobile_auth_session";

export async function readStoredAuthSession(): Promise<MobileAuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as MobileAuthSession;
  } catch {
    return null;
  }
}

export async function writeStoredAuthSession(session: MobileAuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
