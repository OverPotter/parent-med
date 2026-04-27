/** HitKeep: скрипт, page_view, identify. */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AnalyticsEvents } from "./events";
import {
  flushHitKeepQueue,
  isHitKeepConfigured,
  trackNativePageView,
  trackEvent,
  trackSessionIdentify,
} from "./hitkeep";
import { useAppStore } from "@shared/store/useAppStore";

const SCRIPT_ID = "hitkeep-tracker";

function HitKeepScriptLoader() {
  useEffect(() => {
    const url = import.meta.env.VITE_HITKEEP_SCRIPT_URL?.trim();
    if (!url) {
      if (import.meta.env.PROD) {
        console.warn(
          "[HitKeep] PROD: нет VITE_HITKEEP_SCRIPT_URL — скрипт не грузится (см. frontend/.env, make build-frontend)"
        );
      }
      return;
    }
    const host = window.location.hostname;
    const isNativeRuntime = Capacitor.isNativePlatform();
    if (isNativeRuntime) {
      return;
    }
    if (!isNativeRuntime && (host === "localhost" || host === "127.0.0.1")) {
      console.warn(
        "[HitKeep] localhost: трекер не шлёт события — используйте pillpath.localhost:3000 / :5173"
      );
    }
    if (document.getElementById(SCRIPT_ID)) {
      flushHitKeepQueue();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    // HitKeep: как «Collect DNT» в UI — иначе при navigator.doNotTrack === "1" hk.js ставит пустой window.hk.event
    script.setAttribute("data-collect-dnt", "true");
    script.src = url;
    script.onload = () => flushHitKeepQueue();
    document.head.appendChild(script);
  }, []);

  return null;
}

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
    if (Capacitor.isNativePlatform()) {
      void trackNativePageView({
        path,
        isAuthenticated: Boolean(accountId),
        role: accountId ? role : "guest",
      });
      return;
    }
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
      <HitKeepScriptLoader />
      <HitKeepPageViews />
      <HitKeepIdentify />
    </>
  );
}
