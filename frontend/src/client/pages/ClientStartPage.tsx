import { Navigate } from "react-router-dom";
import { useClientStartRoute } from "@client/hooks/useClientStartRoute";
import { useAppStore } from "@shared/store/useAppStore";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";

export function ClientStartPage() {
  const hasSeenWorkspaceIntro = useAppStore((s) => s.hasSeenWorkspaceIntro);
  const isDesktop = useIsDesktop();
  const { isResolving, startRoute } = useClientStartRoute();

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
