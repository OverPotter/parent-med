/**
 * Одноразовый onboarding после входа: помогает быстро понять следующий шаг и затем скрывается.
 */

import { useNavigate } from "react-router-dom";
import { useClientStartRoute } from "@client/hooks/useClientStartRoute";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

export function ClientIntroPage() {
  const navigate = useNavigate();
  const markWorkspaceIntroSeen = useAppStore((s) => s.markWorkspaceIntroSeen);
  const { isResolving, startRoute, hasFamily, hasChildren, hasActiveEpisode } =
    useClientStartRoute();

  const handleContinue = () => {
    markWorkspaceIntroSeen();
    navigate(startRoute, { replace: true });
  };

  return (
    <div className="min-w-0 space-y-6">
      <Surface className="soft-hero overflow-hidden">
        <div className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
          <span className="soft-pill-primary inline-flex rounded-full px-3 py-1 text-xs">
            Первый вход
          </span>
          <h1 className="app-title mt-4 text-2xl sm:text-3xl">
            Дальше приложение будет открываться сразу в работу
          </h1>
          <p className="app-subtitle mt-3 max-w-2xl text-sm">
            Этот экран нужен один раз: понять, что настроить сначала и куда идти дальше без лишних
            обзорных блоков.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-3">
          <SetupStep
            title="Семья"
            description="Базовый контекст аккаунта. Без семьи нельзя перейти к рабочим записям."
            status={hasFamily ? "Готово" : "Следующий шаг"}
            tone={hasFamily ? "ready" : "next"}
          />
          <SetupStep
            title="Дети"
            description="После добавления ребёнка появляется смысл вести болезни, температуру и приёмы."
            status={hasChildren ? "Готово" : hasFamily ? "Нужно добавить" : "Ждёт семью"}
            tone={hasChildren ? "ready" : hasFamily ? "next" : "idle"}
          />
          <SetupStep
            title="Текущая работа"
            description="Если уже есть активные эпизоды, приложение будет вести прямо к ним."
            status={hasActiveEpisode ? "Есть активные болезни" : "Откроем самый полезный раздел"}
            tone={hasActiveEpisode ? "ready" : "idle"}
          />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Следующий маршрут</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {isResolving
                ? "Подбираем лучший стартовый экран…"
                : `Откроем ${labelForRoute(startRoute)}.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isResolving}
              className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {isResolving ? "Подготавливаем…" : "Перейти к работе"}
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isResolving}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Больше не показывать
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

function labelForRoute(route: string): string {
  switch (route) {
    case "/family":
      return "раздел «Семья»";
    case "/illnesses/active":
      return "раздел «Активные болезни»";
    case "/children":
    default:
      return "раздел «Дети»";
  }
}
