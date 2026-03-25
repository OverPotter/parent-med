import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useClientStartRoute } from "@client/hooks/useClientStartRoute";
import { AnalyticsEvents, trackEvent } from "@shared/analytics";
import { useAppStore } from "@shared/store/useAppStore";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";

export function ClientStartPage() {
  const hasSeenWorkspaceIntro = useAppStore((s) => s.hasSeenWorkspaceIntro);
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
    if (!hasSeenWorkspaceIntro) {
      return <Navigate to="/home" replace />;
    }

    if (isResolving) {
      return <div className="py-8 text-sm text-muted">Открываем рабочий раздел…</div>;
    }

    return <Navigate to={startRoute} replace />;
  }

  if (!hasSeenWorkspaceIntro) {
    return <Navigate to="/intro" replace />;
  }

  if (isResolving) {
    return <div className="py-8 text-sm text-muted">Открываем рабочий раздел…</div>;
  }

  return <Navigate to={startRoute} replace />;
}
