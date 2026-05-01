import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import {
  appendInviteAuthIntent,
  buildJoinFamilyRouteFromHandoff,
} from "@shared/runtime/inviteFlow";

export function JoinFamilyHandoffPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handoffId = searchParams.get("hid")?.trim() ?? "";
  const rawAuthIntent = searchParams.get("intent")?.trim() ?? "";
  const authIntent = rawAuthIntent === "login" || rawAuthIntent === "register" ? rawAuthIntent : null;

  useEffect(() => {
    if (!handoffId) {
      return;
    }
    const nextRoute =
      appendInviteAuthIntent(buildJoinFamilyRouteFromHandoff(handoffId), authIntent) ??
      buildJoinFamilyRouteFromHandoff(handoffId);
    navigate(nextRoute, { replace: true });
  }, [authIntent, handoffId, navigate]);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-6 sm:px-0">
      <Surface className="p-5 sm:p-6">
        <h1 className="app-card-title">
          {language === "ru" ? "Продолжаем приглашение…" : "Continuing your invite…"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {!handoffId
            ? language === "ru"
              ? "Не удалось продолжить приглашение. Откройте ссылку приглашения ещё раз."
              : "Could not continue this invite. Open the invite link again."
            : language === "ru"
              ? "Проверяем приглашение и открываем нужный шаг."
              : "Checking the invite and opening the right step."}
        </p>
      </Surface>
    </div>
  );
}
