import { useEffect } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import { syncNativePushSubscription } from "../shared/push/nativePushSync";

export function usePushSubscriptionSync(
  authSession: MobileAuthSession | null,
) {
  useEffect(() => {
    if (!authSession?.accessToken) {
      return;
    }

    let cancelled = false;

    void syncNativePushSubscription({
      accessToken: authSession.accessToken,
      promptIfNeeded: false,
    }).catch(() => {
      if (cancelled) {
        return;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authSession?.accessToken, authSession?.account.id]);
}
