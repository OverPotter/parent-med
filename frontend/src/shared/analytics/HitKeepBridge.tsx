/** HitKeep: first-party events without third-party web tracker script. */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AnalyticsEvents } from "./events";
import { isHitKeepConfigured, trackEvent, trackSessionIdentify } from "./hitkeep";
import { useAppStore } from "@shared/store/useAppStore";

function HitKeepPageViews() {
  const location = useLocation();
  const accountId = useAppStore((s) => s.accountId);
  const role = useAppStore((s) => s.role);
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isHitKeepConfigured()) {
      return;
    }
    const path = `${location.pathname}${location.search}`;
    if (prevPath.current === path) {
      return;
    }
    prevPath.current = path;
    trackEvent(AnalyticsEvents.PAGE_VIEW, {
      path,
      is_authenticated: Boolean(accountId),
      role: accountId ? role : "guest",
    });
  }, [location.pathname, location.search, accountId, role]);

  return null;
}

function HitKeepIdentify() {
  const accountId = useAppStore((s) => s.accountId);
  const familyRole = useAppStore((s) => s.accountFamilyRole);
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!isHitKeepConfigured() || !accountId) {
      if (!accountId) {
        lastSent.current = null;
      }
      return;
    }
    if (lastSent.current === accountId) {
      return;
    }
    lastSent.current = accountId;
    void trackSessionIdentify(accountId, familyRole);
  }, [accountId, familyRole]);

  return null;
}

export function HitKeepBridge() {
  return (
    <>
      <HitKeepPageViews />
      <HitKeepIdentify />
    </>
  );
}
