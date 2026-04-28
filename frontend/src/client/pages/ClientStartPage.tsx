import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { labelForRoute, tWorkspaceIntro } from "@client/i18n/workspaceIntro";
import { normalizeNativeNavigationUrl, readPendingNativeNavigationUrl } from "@/app/push/sync";
import { useClientStartRoute } from "@client/hooks/useClientStartRoute";
import { AnalyticsEvents, trackEvent } from "@shared/analytics";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";

export function ClientStartPage() {
  const { language } = useI18n();
  const isDesktop = useIsDesktop();
  const { isResolving, startRoute, hasFamily, hasChildren, hasActiveEpisode } =
    useClientStartRoute();
  const reportedStartRoute = useRef(false);
  const [nativeLaunchUrl, setNativeLaunchUrl] = useState<string | null>(null);
  const [isLaunchUrlResolved, setIsLaunchUrlResolved] = useState(!Capacitor.isNativePlatform());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let cancelled = false;
    void CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setNativeLaunchUrl(
          readPendingNativeNavigationUrl() ?? normalizeNativeNavigationUrl(result?.url)
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLaunchUrlResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isResolving || !isLaunchUrlResolved || reportedStartRoute.current) {
      return;
    }
    reportedStartRoute.current = true;
    trackEvent(AnalyticsEvents.START_ROUTE_RESOLVED, {
      start_route: nativeLaunchUrl ?? startRoute,
      has_family: hasFamily,
      has_children: hasChildren,
      has_active_episode: hasActiveEpisode,
    });
  }, [
    hasActiveEpisode,
    hasChildren,
    hasFamily,
    isLaunchUrlResolved,
    isResolving,
    nativeLaunchUrl,
    startRoute,
  ]);

  const resolvedRoute = nativeLaunchUrl ?? startRoute;

  if (isDesktop) {
    if (isResolving || !isLaunchUrlResolved) {
      return (
        <div className="py-8 text-sm text-muted">
          {tWorkspaceIntro(language, "openingWorkspace")}
        </div>
      );
    }

    return <Navigate to={resolvedRoute} replace />;
  }

  if (isResolving || !isLaunchUrlResolved) {
    return (
      <div className="py-8 text-sm text-muted">
        {language === "ru"
          ? tWorkspaceIntro(language, "openingWorkspace")
          : `Opening ${labelForRoute(resolvedRoute, language)}…`}
      </div>
    );
  }

  return <Navigate to={resolvedRoute} replace />;
}
