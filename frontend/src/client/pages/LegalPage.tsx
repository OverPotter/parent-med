import { useRef } from "react";
import { useHistoryBackFallback } from "@client/pages/legal/useHistoryBackFallback";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { PageIntro } from "@shared/components/PageIntro";
import { PublicSiteHeader } from "@shared/components/PublicSiteHeader";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { getPrivacyPolicyUrl, getSupportUrl, getTermsOfUseUrl } from "@shared/config/legal";
import { useAppStore } from "@shared/store/useAppStore";
import { Link, useLocation } from "react-router-dom";
import { getPaywallLegalRouteState, isPaywallLegalRouteState } from "./legal/legalRouteState";

function ExternalArrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path d="M7 6h7v7m0-7-8 8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LegalPage() {
  const { language } = useI18n();
  const hasSession = useAppStore((s) => Boolean(s.authToken || s.accountId));
  const handleBack = useHistoryBackFallback(hasSession ? "/more" : "/");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const fromPaywall = isPaywallLegalRouteState(location.state);
  const preservedLegalState = getPaywallLegalRouteState(location.state);
  const showPublicHeader = !hasSession || fromPaywall;
  const accountHref = hasSession ? "/more" : "/auth?mode=login";
  const accountLabel =
    language === "ru" ? (hasSession ? "Ещё" : "Войти") : hasSession ? "More" : "Login";
  const items = [
    {
      href: getPrivacyPolicyUrl(),
      title: language === "ru" ? "Политика конфиденциальности" : "Privacy Policy",
      description:
        language === "ru"
          ? "Как обрабатываются и защищаются данные для RU / US / EU."
          : "How data is processed and protected for RU / US / EU.",
    },
    {
      href: getTermsOfUseUrl(),
      title: language === "ru" ? "Условия использования" : "Terms of Use",
      description:
        language === "ru"
          ? "Правила использования сервиса для RU / US / EU."
          : "Terms for using the service in RU / US / EU.",
    },
    {
      href: getSupportUrl(),
      title: language === "ru" ? "Поддержка / Контакты" : "Support / Contact",
      description:
        language === "ru"
          ? "Канал связи и запросы по персональным данным."
          : "A contact channel with the team.",
    },
  ];

  return (
    <div
      ref={rootRef}
      className={[
        "legal-doc-page mx-auto w-full max-w-3xl space-y-6 sm:space-y-8 px-3 pb-6 sm:px-0",
        fromPaywall ? "legal-doc-page--paywall" : "",
        showPublicHeader ? "" : "app-safe-top-standalone",
      ].join(" ")}
    >
      {showPublicHeader ? (
        <PublicSiteHeader accountHref={accountHref} accountLabel={accountLabel} />
      ) : null}
      <IosEdgeBackGesture isEnabled onBack={handleBack} targetRef={rootRef} />
      <PageIntro
        title={language === "ru" ? "Правовая информация" : "Legal information"}
        subtitle={
          language === "ru"
            ? "Политика конфиденциальности, условия использования и контакты."
            : "Privacy policy, terms of use and support contacts."
        }
        action={
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Назад" : "← Back"}
          </button>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <button
            type="button"
            onClick={handleBack}
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Назад" : "← Back"}
          </button>
          <h1 className="app-mobile-section-intro__title">
            {language === "ru" ? "Правовая информация" : "Legal information"}
          </h1>
          <p className="app-mobile-section-intro__hint">
            {language === "ru"
              ? "Политика конфиденциальности, условия использования и контакты."
              : "Privacy policy, terms of use and support contacts."}
          </p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {items.map((item) => {
          const content = (
            <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="app-card-title">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{item.description}</p>
                </div>
                <span className="mt-1 shrink-0 text-muted">
                  <ExternalArrow />
                </span>
              </div>
            </RowSurface>
          );

          if (item.href.startsWith("/")) {
            return (
              <Link key={item.title} to={item.href} state={preservedLegalState} className="block">
                {content}
              </Link>
            );
          }

          return (
            <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="block">
              {content}
            </a>
          );
        })}
      </div>

      <RowSurface className="legal-doc-surface rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-sm leading-7 text-muted">
          {language === "ru"
            ? "Медицинский дисклеймер: сервис носит информационный характер. Мы не врачи, не ставим диагнозы, не назначаем лечение и не несем ответственность за медицинские решения."
            : "Medical disclaimer: this service is informational. We are not doctors, we do not diagnose or prescribe treatment, and we are not responsible for medical decisions."}
        </p>
      </RowSurface>
    </div>
  );
}
