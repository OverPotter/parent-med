import { Alert, AppState } from "react-native";
import { useEffect, useRef, useCallback } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import { syncNativePushSubscription } from "../shared/push/nativePushSync";
import {
  openNativeNotificationSettings,
  type NativePushPermissionStatus,
} from "../shared/push/nativePushNotifications";
import { useState } from "react";

export type PushSubscriptionSyncState = {
  pushConfigEnabled: boolean;
  permissionStatus: NativePushPermissionStatus;
  syncStatus: "idle" | "unsupported" | "disabled" | "permission_denied" | "token_missing" | "enabled";
};

export function usePushSubscriptionSync(
  authSession: MobileAuthSession | null,
  options?: {
    permissionPromptTitle?: string;
    permissionPromptBody?: string;
    openSettingsLabel?: string;
    cancelLabel?: string;
  },
) {
  const didShowDeniedPromptRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const [state, setState] = useState<PushSubscriptionSyncState>({
    pushConfigEnabled: false,
    permissionStatus: "undetermined",
    syncStatus: "idle",
  });

  const runSync = useCallback(
    async (promptIfNeeded: boolean, showDeniedAlert: boolean) => {
      if (!authSession?.accessToken) {
        return;
      }

      const result = await syncNativePushSubscription({
        accessToken: authSession.accessToken,
        promptIfNeeded,
      });

      console.log("[PushBootstrap] sync result", result);
      setState({
        pushConfigEnabled:
          result.status !== "disabled" && result.status !== "unsupported",
        permissionStatus:
          "permissionStatus" in result ? result.permissionStatus : "undetermined",
        syncStatus: result.status,
      });

      if (
        !showDeniedAlert ||
        result.status !== "permission_denied" ||
        result.permissionStatus !== "denied" ||
        didShowDeniedPromptRef.current
      ) {
        return;
      }

      didShowDeniedPromptRef.current = true;
      Alert.alert(
        options?.permissionPromptTitle ?? "Notifications disabled",
        options?.permissionPromptBody ??
          "Open iPhone Settings to allow notifications for this app.",
        [
          {
            text: options?.cancelLabel ?? "Cancel",
            style: "cancel",
          },
          {
            text: options?.openSettingsLabel ?? "Open Settings",
            onPress: () => {
              void openNativeNotificationSettings();
            },
          },
        ],
      );

      return result;
    },
    [
      authSession?.accessToken,
      options?.cancelLabel,
      options?.openSettingsLabel,
      options?.permissionPromptBody,
      options?.permissionPromptTitle,
    ],
  );

  useEffect(() => {
    if (!authSession?.accessToken) {
      didShowDeniedPromptRef.current = false;
      setState({
        pushConfigEnabled: false,
        permissionStatus: "undetermined",
        syncStatus: "idle",
      });
      return;
    }

    let cancelled = false;

    void runSync(true, true).catch((error) => {
        if (cancelled) {
          return;
        }

        console.warn("[PushBootstrap] sync failed", error);
        setState({
          pushConfigEnabled: false,
          permissionStatus: "undetermined",
          syncStatus: "idle",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    authSession?.account.id,
    authSession?.accessToken,
    runSync,
  ]);

  useEffect(() => {
    if (!authSession?.accessToken) {
      return;
    }

    let cancelled = false;
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        cancelled ||
        previousState === "active" ||
        nextState !== "active"
      ) {
        return;
      }

      void runSync(false, false).catch((error) => {
        if (cancelled) {
          return;
        }

        console.warn("[PushBootstrap] foreground refresh failed", error);
      });
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [authSession?.accessToken, runSync]);

  return state;
}
