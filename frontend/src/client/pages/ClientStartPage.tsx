import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { labelForRoute, tWorkspaceIntro } from "@client/i18n/workspaceIntro";
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

  useEffect(() => {
    if (isResolving || reportedStartRoute.current) {
      return;
    }
    reportedStartRoute.current = true;
    trackEvent(AnalyticsEvents.START_ROUTE_RESOLVED, {
      start_route: startRoute,
      has_family: hasFamily,
      has_children: hasChildren,
      has_active_episode: hasActiveEpisode,
    });
  }, [isResolving, startRoute, hasFamily, hasChildren, hasActiveEpisode]);

  if (isDesktop) {
    if (isResolving) {
      return (
        <div className="py-8 text-sm text-muted">
          {tWorkspaceIntro(language, "openingWorkspace")}
        </div>
      );
    }

    return <Navigate to={startRoute} replace />;
  }

  if (isResolving) {
    return (
      <div className="py-8 text-sm text-muted">
        {language === "ru"
          ? tWorkspaceIntro(language, "openingWorkspace")
          : `Opening ${labelForRoute(startRoute, language)}…`}
      </div>
    );
  }

  return <Navigate to={startRoute} replace />;
}
