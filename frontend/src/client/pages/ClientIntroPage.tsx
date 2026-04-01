/**
 * Одноразовый onboarding после входа: помогает быстро понять следующий шаг и затем скрывается.
 */

import { useNavigate } from "react-router-dom";
import { labelForRoute, tWorkspaceIntro } from "@client/i18n/workspaceIntro";
import { useClientStartRoute } from "@client/hooks/useClientStartRoute";
import { AnalyticsEvents, trackEvent } from "@shared/analytics";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

export function ClientIntroPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const markWorkspaceIntroSeen = useAppStore((s) => s.markWorkspaceIntroSeen);
  const { isResolving, startRoute, hasFamily, hasChildren, hasActiveEpisode } =
    useClientStartRoute();

  const handleContinue = () => {
    markWorkspaceIntroSeen();
    trackEvent(AnalyticsEvents.WORKSPACE_INTRO_COMPLETED);
    navigate(startRoute, { replace: true });
  };

  return (
    <div className="min-w-0 space-y-6">
      <Surface className="soft-hero overflow-hidden">
        <div className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
          <span className="soft-pill-primary inline-flex rounded-full px-3 py-1 text-xs">
            {tWorkspaceIntro(language, "badge")}
          </span>
          <h1 className="app-title mt-4 text-2xl sm:text-3xl">
            {tWorkspaceIntro(language, "title")}
          </h1>
          <p className="app-subtitle mt-3 max-w-2xl text-sm">
            {tWorkspaceIntro(language, "subtitle")}
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-3">
          <SetupStep
            title={tWorkspaceIntro(language, "familyTitle")}
            description={tWorkspaceIntro(language, "familyDescription")}
            status={
              hasFamily ? tWorkspaceIntro(language, "ready") : tWorkspaceIntro(language, "nextStep")
            }
            tone={hasFamily ? "ready" : "next"}
          />
          <SetupStep
            title={tWorkspaceIntro(language, "childrenTitle")}
            description={tWorkspaceIntro(language, "childrenDescription")}
            status={
              hasChildren
                ? tWorkspaceIntro(language, "ready")
                : hasFamily
                  ? tWorkspaceIntro(language, "needAdd")
                  : tWorkspaceIntro(language, "waitingFamily")
            }
            tone={hasChildren ? "ready" : hasFamily ? "next" : "idle"}
          />
          <SetupStep
            title={tWorkspaceIntro(language, "workTitle")}
            description={tWorkspaceIntro(language, "workDescription")}
            status={
              hasActiveEpisode
                ? tWorkspaceIntro(language, "activeIllnesses")
                : tWorkspaceIntro(language, "openUseful")
            }
            tone={hasActiveEpisode ? "ready" : "idle"}
          />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {tWorkspaceIntro(language, "nextRoute")}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {isResolving
                ? tWorkspaceIntro(language, "resolving")
                : tWorkspaceIntro(language, "openRoute", {
                    route: labelForRoute(startRoute, language),
                  })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isResolving}
              className="soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem]"
            >
              {isResolving
                ? tWorkspaceIntro(language, "preparing")
                : tWorkspaceIntro(language, "continue")}
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isResolving}
              className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              {tWorkspaceIntro(language, "neverShowAgain")}
            </button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function SetupStep({
  title,
  description,
  status,
  tone,
}: {
  title: string;
  description: string;
  status: string;
  tone: "ready" | "next" | "idle";
}) {
  const toneClassName =
    tone === "ready" ? "soft-pill-success" : tone === "next" ? "soft-pill-primary" : "soft-pill";

  return (
    <div className="soft-card rounded-[24px] px-4 py-4 sm:px-5">
      <span className={`${toneClassName} inline-flex rounded-full px-3 py-1 text-xs`}>
        {status}
      </span>
      <h2 className="app-card-title mt-4 text-lg">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}
