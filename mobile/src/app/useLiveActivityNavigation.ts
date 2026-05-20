import { useEffect, useState } from "react";
import { Linking } from "react-native";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import type { MobileChildSummary } from "../features/children/api/childrenApi";
import {
  parseLiveActivityNavigation,
  type LiveActivityAction,
} from "../features/live-activities/liveActivityLinking";

type PendingLiveActivityNavigation = {
  childId: string;
  action: LiveActivityAction;
};

export function useLiveActivityNavigation(params: {
  authSession: MobileAuthSession | null;
  children: MobileChildSummary[];
  onSelectChild: (childId: string) => void;
  onOpenChildren: () => void;
  onOpenIllnessJournal: (childId: string) => void;
}) {
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingLiveActivityNavigation | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleUrl = (url: string) => {
      const nextNavigation = parseLiveActivityNavigation(url);
      if (!nextNavigation) {
        return;
      }

      setPendingNavigation(nextNavigation);
    };

    void Linking.getInitialURL().then((url) => {
      if (cancelled || !url) {
        return;
      }

      handleUrl(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!pendingNavigation || !params.authSession) {
      return;
    }

    const matchingChild = params.children.find(
      (child) => child.id === pendingNavigation.childId,
    );
    if (!matchingChild) {
      return;
    }

    params.onSelectChild(matchingChild.id);

    if (pendingNavigation.action === "illness") {
      params.onOpenIllnessJournal(matchingChild.id);
    } else {
      params.onOpenChildren();
    }

    setPendingNavigation(null);
  }, [params, pendingNavigation]);
}
