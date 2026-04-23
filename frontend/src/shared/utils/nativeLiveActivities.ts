import { Capacitor, registerPlugin } from "@capacitor/core";
import { updateLiveActivityDiagnostics } from "./liveActivityDiagnostics";

export type NativeLiveActivityKind = "sleep" | "feeding" | "illness";

type NativeLiveActivityPlugin = {
  getStatus(): Promise<{
    supported: boolean;
    available: boolean;
    authorizationState?: string;
  }>;
  upsert(args: {
    kind: NativeLiveActivityKind;
    itemId: string;
    title: string;
    subtitle?: string | null;
    statusLabel?: string | null;
    primaryValue?: string | null;
    primaryCaption?: string | null;
    secondaryValue?: string | null;
    secondaryCaption?: string | null;
    startedAt: string;
    deepLink?: string | null;
  }): Promise<{ activeId: string | null }>;
  stop(args: { kind: NativeLiveActivityKind; itemId: string }): Promise<void>;
  stopAll(args?: { kind?: NativeLiveActivityKind }): Promise<void>;
};

const LiveActivities = registerPlugin<NativeLiveActivityPlugin>("LiveActivities");

function isPluginUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  return code === "UNIMPLEMENTED" || code === "UNAVAILABLE";
}

export function isNativeLiveActivitiesSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export async function getNativeLiveActivitiesStatus(): Promise<{
  supported: boolean;
  available: boolean;
  authorizationState?: string;
}> {
  if (!isNativeLiveActivitiesSupported()) {
    updateLiveActivityDiagnostics({
      nativeStatus: {
        supported: false,
        available: false,
        authorizationState: "unsupported",
      },
      lastAction: "status:unsupported-platform",
      lastPayload: {
        isNativePlatform: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
      },
      lastError: null,
    });
    return { supported: false, available: false };
  }

  try {
    const status = await LiveActivities.getStatus();
    updateLiveActivityDiagnostics({
      nativeStatus: status,
      lastAction: "status:success",
      lastPayload: status,
      lastError: null,
    });
    return status;
  } catch (error) {
    updateLiveActivityDiagnostics({
      lastAction: "status:error",
      lastPayload: null,
      lastError: String(error),
    });
    return { supported: true, available: false };
  }
}

export async function upsertNativeLiveActivity(args: {
  kind: NativeLiveActivityKind;
  itemId: string;
  title: string;
  subtitle?: string | null;
  statusLabel?: string | null;
  primaryValue?: string | null;
  primaryCaption?: string | null;
  secondaryValue?: string | null;
  secondaryCaption?: string | null;
  startedAt: string;
  deepLink?: string | null;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    updateLiveActivityDiagnostics({
      lastAction: "upsert:unsupported-platform",
      lastPayload: {
        isNativePlatform: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        args,
      },
      lastError: null,
    });
    return;
  }

  try {
    updateLiveActivityDiagnostics({
      lastAction: "upsert:start",
      lastPayload: args,
      lastError: null,
    });
    await LiveActivities.upsert(args);
    updateLiveActivityDiagnostics({
      lastAction: "upsert:done",
      lastPayload: args,
      lastError: null,
    });
  } catch (error) {
    updateLiveActivityDiagnostics({
      lastAction: "upsert:error",
      lastPayload: args,
      lastError: String(error),
    });
    if (!isPluginUnavailableError(error)) {
      throw error;
    }
  }
}

export async function stopNativeLiveActivity(args: {
  kind: NativeLiveActivityKind;
  itemId: string;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    updateLiveActivityDiagnostics({
      lastAction: "stop:unsupported-platform",
      lastPayload: {
        isNativePlatform: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        args,
      },
      lastError: null,
    });
    return;
  }

  try {
    updateLiveActivityDiagnostics({
      lastAction: "stop:start",
      lastPayload: args,
      lastError: null,
    });
    await LiveActivities.stop(args);
    updateLiveActivityDiagnostics({
      lastAction: "stop:done",
      lastPayload: args,
      lastError: null,
    });
  } catch (error) {
    updateLiveActivityDiagnostics({
      lastAction: "stop:error",
      lastPayload: args,
      lastError: String(error),
    });
    if (!isPluginUnavailableError(error)) {
      throw error;
    }
  }
}

export async function stopAllNativeLiveActivities(kind?: NativeLiveActivityKind) {
  if (!isNativeLiveActivitiesSupported()) {
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:unsupported-platform",
      lastPayload: {
        isNativePlatform: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        kind,
      },
      lastError: null,
    });
    return;
  }

  try {
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:start",
      lastPayload: kind ? { kind } : null,
      lastError: null,
    });
    await LiveActivities.stopAll(kind ? { kind } : undefined);
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:done",
      lastPayload: kind ? { kind } : null,
      lastError: null,
    });
  } catch (error) {
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:error",
      lastPayload: kind ? { kind } : null,
      lastError: String(error),
    });
    if (!isPluginUnavailableError(error)) {
      throw error;
    }
  }
}
