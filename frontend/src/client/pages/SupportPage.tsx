import { useRef } from "react";
import { useHistoryBackFallback } from "@client/pages/legal/useHistoryBackFallback";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { getSupportEmail, getSupportMailtoUrl } from "@shared/config/legal";
import { useAppStore } from "@shared/store/useAppStore";

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path
        d="M4.5 10h10m-4-4 4 4-4 4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const backLinkClass = "inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary";
const supportBulletClass = "flex items-start gap-2 text-sm leading-6 text-muted";

export function SupportPage() {
  const { language } = useI18n();
  const hasSession = useAppStore((s) => Boolean(s.authToken || s.accountId));
  const handleBack = useHistoryBackFallback("/legal");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const supportEmail = getSupportEmail();
  const supportMailtoUrl = getSupportMailtoUrl();
  const isRussian = language === "ru";

  return (
    <div ref={rootRef} className="min-w-0 space-y-6 sm:space-y-8">
      <IosEdgeBackGesture isEnabled onBack={handleBack} targetRef={rootRef} />
      <PageIntro
        title={isRussian ? "Помощь" : "Support"}
        subtitle={
          isRussian
            ? "Публичный канал связи доступен без входа. Если вы уже в приложении, можно использовать и внутреннюю форму."
            : "A public contact channel is available without signing in. If you are already in the app, you can also use the in-app form."
        }
        action={
          <button type="button" onClick={handleBack} className={backLinkClass}>
            {isRussian ? "← Правовая информация" : "← Legal information"}
          </button>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <button type="button" onClick={handleBack} className={backLinkClass}>
            {isRussian ? "← Правовая информация" : "← Legal information"}
          </button>
          <h1 className="app-mobile-section-intro__title">{isRussian ? "Помощь" : "Support"}</h1>
          <p className="app-mobile-section-intro__hint">
            {isRussian
              ? "Публичный канал связи доступен без входа. Если вы уже в приложении, можно использовать и внутреннюю форму."
              : "A public contact channel is available without signing in. If you are already in the app, you can also use the in-app form."}
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:gap-4">
        {supportMailtoUrl ? (
          <li>
            <a
              href={supportMailtoUrl}
              className="block transition-transform duration-200 hover:-translate-y-0.5"
            >
              <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="app-card-title">
                      {isRussian ? "Написать в поддержку" : "Email support"}
                    </p>
                    <div className="mt-1.5 space-y-1.5">
                      <p className={supportBulletClass}>
                        <span aria-hidden="true">•</span>
                        <span>
                          {isRussian
                            ? "Подходит для App Review, privacy-запросов и общих вопросов."
                            : "Use this for App Review, privacy requests, and general questions."}
                        </span>
                      </p>
                      <p className={supportBulletClass}>
                        <span aria-hidden="true">•</span>
                        <span>{supportEmail}</span>
                      </p>
                    </div>
                  </div>
                  <span className="mt-1 text-muted">
                    <ArrowRightIcon />
                  </span>
                </div>
              </RowSurface>
            </a>
          </li>
        ) : null}

        {hasSession ? (
          <li>
            <Link
              to="/feedback"
              className="block transition-transform duration-200 hover:-translate-y-0.5"
            >
              <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="app-card-title">
                      {isRussian ? "Баг, неудобство или идея" : "Bug, friction, or idea"}
                    </p>
                    <div className="mt-1.5 space-y-1.5">
                      <p className={supportBulletClass}>
                        <span aria-hidden="true">•</span>
                        <span>
                          {isRussian
                            ? "Что случилось или что хочется улучшить."
                            : "Describe what happened or what should be improved."}
                        </span>
                      </p>
                      <p className={supportBulletClass}>
                        <span aria-hidden="true">•</span>
                        <span>
                          {isRussian
                            ? "Что вы ожидали увидеть."
                            : "Tell us what you expected to happen."}
                        </span>
                      </p>
                      <p className={supportBulletClass}>
                        <span aria-hidden="true">•</span>
                        <span>
                          {isRussian
                            ? "Если можно, добавьте шаги или скрин."
                            : "If possible, include steps or a screenshot."}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="mt-1 text-muted">
                    <ArrowRightIcon />
                  </span>
                </div>
              </RowSurface>
            </Link>
          </li>
        ) : null}

        <li>
          <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="app-card-title">
                  {isRussian ? "Запрос по данным и privacy" : "Data and privacy request"}
                </p>
                <div className="mt-1.5 space-y-1.5">
                  <p className={supportBulletClass}>
                    <span aria-hidden="true">•</span>
                    <span>
                      {isRussian
                        ? "Опишите запрос: доступ, исправление, удаление или отзыв согласия."
                        : "Describe the request: access, correction, deletion, or consent withdrawal."}
                    </span>
                  </p>
                  <p className={supportBulletClass}>
                    <span aria-hidden="true">•</span>
                    <span>
                      {isRussian
                        ? "Укажите регион и контакт для ответа."
                        : "Include your region and a reply contact."}
                    </span>
                  </p>
                  <p className={supportBulletClass}>
                    <span aria-hidden="true">•</span>
                    <span>
                      {isRussian
                        ? supportEmail
                          ? "Такие запросы можно отправлять на email поддержки выше."
                          : "Если вы уже вошли в приложение, используйте внутреннюю форму."
                        : supportEmail
                          ? "You can send these requests to the support email above."
                          : "If you are already signed in, use the in-app form."}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </RowSurface>
        </li>
      </ul>
    </div>
  );
}
