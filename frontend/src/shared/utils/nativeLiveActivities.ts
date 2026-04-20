import { Capacitor, registerPlugin } from "@capacitor/core";
import { appLog } from "./appLog";
import { updateLiveActivityDiagnostics } from "./liveActivityDiagnostics";

export type NativeLiveActivityKind = "sleep" | "feeding";

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
    const status = {
      isNativePlatform: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
    };
    console.warn("[PM] LiveActivities unsupported platform", status);
    updateLiveActivityDiagnostics({
      nativeStatus: {
        supported: false,
        available: false,
        authorizationState: "unsupported",
      },
      lastAction: "status:unsupported-platform",
      lastPayload: status,
      lastError: null,
    });
    return { supported: false, available: false };
  }

  try {
    const status = await LiveActivities.getStatus();
    appLog.dev("LiveActivities status", status);
    updateLiveActivityDiagnostics({
      nativeStatus: status,
      lastAction: "status:success",
      lastPayload: status,
      lastError: null,
    });
    return status;
  } catch (error) {
    appLog.warn("LiveActivities getStatus failed", error);
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
  startedAt: string;
  deepLink?: string | null;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    const payload = {
      isNativePlatform: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      args,
    };
    console.warn("[PM] LiveActivities upsert skipped unsupported platform", payload);
    updateLiveActivityDiagnostics({
      lastAction: "upsert:unsupported-platform",
      lastPayload: payload,
      lastError: null,
    });
    return;
  }

  try {
    console.log("[PM] LiveActivities upsert:start", args);
    appLog.dev("LiveActivities upsert", args);
    updateLiveActivityDiagnostics({
      lastAction: "upsert:start",
      lastPayload: args,
      lastError: null,
    });
    await LiveActivities.upsert(args);
    console.log("[PM] LiveActivities upsert:done", args);
    updateLiveActivityDiagnostics({
      lastAction: "upsert:done",
      lastPayload: args,
      lastError: null,
    });
  } catch (error) {
    console.error("[PM] LiveActivities upsert:error", error, args);
    appLog.warn("LiveActivities upsert failed", error);
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
    const payload = {
      isNativePlatform: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      args,
    };
    console.warn("[PM] LiveActivities stop skipped unsupported platform", payload);
    updateLiveActivityDiagnostics({
      lastAction: "stop:unsupported-platform",
      lastPayload: payload,
      lastError: null,
    });
    return;
  }

  try {
    console.log("[PM] LiveActivities stop:start", args);
    appLog.dev("LiveActivities stop", args);
    updateLiveActivityDiagnostics({
      lastAction: "stop:start",
      lastPayload: args,
      lastError: null,
    });
    await LiveActivities.stop(args);
    console.log("[PM] LiveActivities stop:done", args);
    updateLiveActivityDiagnostics({
      lastAction: "stop:done",
      lastPayload: args,
      lastError: null,
    });
  } catch (error) {
    console.error("[PM] LiveActivities stop:error", error, args);
    appLog.warn("LiveActivities stop failed", error);
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
    const payload = {
      isNativePlatform: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      kind,
    };
    console.warn("[PM] LiveActivities stopAll skipped unsupported platform", payload);
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:unsupported-platform",
      lastPayload: payload,
      lastError: null,
    });
    return;
  }

  try {
    console.log("[PM] LiveActivities stopAll:start", kind ? { kind } : undefined);
    appLog.dev("LiveActivities stopAll", kind ? { kind } : undefined);
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:start",
      lastPayload: kind ? { kind } : null,
      lastError: null,
    });
    await LiveActivities.stopAll(kind ? { kind } : undefined);
    console.log("[PM] LiveActivities stopAll:done", kind ? { kind } : undefined);
    updateLiveActivityDiagnostics({
      lastAction: "stopAll:done",
      lastPayload: kind ? { kind } : null,
      lastError: null,
    });
  } catch (error) {
    console.error("[PM] LiveActivities stopAll:error", error, kind ? { kind } : undefined);
    appLog.warn("LiveActivities stopAll failed", error);
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
