import { useCallback, useEffect, useState } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import {
  getInitialPushNotificationResponsePayload,
  subscribeToPushNotificationResponses,
} from "../shared/push/nativePushNotifications";

type PendingPushNavigation = {
  url: string;
  childId: string | null;
};

export function usePushNotificationNavigation(params: {
  authSession: MobileAuthSession | null;
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
  onOpenChildren: () => void;
  onOpenIllnessJournal: (childId?: string | null) => void;
  onOpenCabinet: () => void;
  onOpenPillbox: () => void;
  onOpenSettings: () => void;
}) {
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingPushNavigation | null>(null);

  const handlePushNavigation = useCallback(
    (payload: { url: string | null; childId: string | null }) => {
      if (!payload.url?.startsWith("/")) {
        return;
      }

      setPendingNavigation({
        url: payload.url,
        childId: payload.childId,
      });
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void getInitialPushNotificationResponsePayload().then((payload) => {
      if (cancelled || !payload) {
        return;
      }

      handlePushNavigation(payload);
    });

    const unsubscribe = subscribeToPushNotificationResponses((payload) => {
      handlePushNavigation(payload);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [handlePushNavigation]);

  useEffect(() => {
    if (!pendingNavigation || !params.authSession) {
      return;
    }

    if (pendingNavigation.childId) {
      params.onSelectChild(pendingNavigation.childId);
    }

    if (pendingNavigation.url.startsWith("/settings")) {
      params.onOpenSettings();
    } else if (pendingNavigation.url.startsWith("/medicine-cabinet")) {
      params.onOpenCabinet();
    } else if (pendingNavigation.url.startsWith("/pillbox")) {
      params.onOpenPillbox();
    } else if (pendingNavigation.url.startsWith("/illnesses/active")) {
      params.onOpenIllnessJournal(
        pendingNavigation.childId ?? params.selectedChildId,
      );
    } else {
      params.onOpenChildren();
    }

    setPendingNavigation(null);
  }, [params, pendingNavigation]);
}
