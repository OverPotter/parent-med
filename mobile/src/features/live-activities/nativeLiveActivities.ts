import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type NativeLiveActivityKind = "sleep" | "feeding" | "illness";
export type NativeLiveActivityLanguage = "ru" | "en" | "de" | "pl";

type NativeLiveActivitiesModule = {
  getStatus(): Promise<{
    supported: boolean;
    available: boolean;
    authorizationState?: string;
  }>;
  upsert(args: {
    kind: NativeLiveActivityKind;
    itemId: string;
    language?: NativeLiveActivityLanguage | null;
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
  stop(kind: NativeLiveActivityKind, itemId: string): Promise<void>;
  stopAll(kind?: NativeLiveActivityKind): Promise<void>;
};

const NativeLiveActivities =
  requireOptionalNativeModule<NativeLiveActivitiesModule>(
    "ParentMedLiveActivities",
  );

export function isNativeLiveActivitiesSupported() {
  return Platform.OS === "ios" && NativeLiveActivities != null;
}

export async function upsertNativeLiveActivity(args: {
  kind: NativeLiveActivityKind;
  itemId: string;
  language?: NativeLiveActivityLanguage | null;
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
  if (!NativeLiveActivities || Platform.OS !== "ios") {
    return null;
  }

  return NativeLiveActivities.upsert(args);
}

export async function stopNativeLiveActivity(args: {
  kind: NativeLiveActivityKind;
  itemId: string;
}) {
  if (!NativeLiveActivities || Platform.OS !== "ios") {
    return;
  }

  await NativeLiveActivities.stop(args.kind, args.itemId);
}

export async function stopAllNativeLiveActivities(kind?: NativeLiveActivityKind) {
  if (!NativeLiveActivities || Platform.OS !== "ios") {
    return;
  }

  await NativeLiveActivities.stopAll(kind);
}
