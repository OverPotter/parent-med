import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { getPrivacyPolicyUrl, getSupportUrl, getTermsOfUseUrl } from "@shared/config/legal";

function ExternalArrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path d="M7 6h7v7m0-7-8 8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LegalPage() {
  const { language } = useI18n();
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
    <div className="space-y-6 sm:space-y-8">
      <PageIntro
        title={language === "ru" ? "Правовая информация" : "Legal information"}
        subtitle={
          language === "ru"
            ? "Политика конфиденциальности, условия использования и контакты."
            : "Privacy policy, terms of use and support contacts."
        }
        compactOnMobile
        className="app-safe-top-standalone"
      />

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
              <Link key={item.title} to={item.href} className="block">
                {content}
              </Link>
            );
          }

          return (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              {content}
            </a>
          );
        })}
      </div>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm leading-7 text-muted">
          {language === "ru"
            ? "Медицинский дисклеймер: сервис носит информационный характер. Мы не врачи, не ставим диагнозы, не назначаем лечение и не несем ответственность за медицинские решения."
            : "Medical disclaimer: this service is informational. We are not doctors, we do not diagnose or prescribe treatment, and we are not responsible for medical decisions."}
        </p>
      </Surface>
    </div>
  );
}
