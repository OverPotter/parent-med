import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function ClientWorkspacePage() {
  const { language } = useI18n();
  const title = language === "ru" ? "Главный экран" : "Home";
  const subtitle =
    language === "ru"
      ? "Здесь обычно открываются рабочие разделы семьи."
      : "This is where family work sections usually open.";
  const mobileHint =
    language === "ru"
      ? "Основные разделы семьи и быстрый вход в работу."
      : "Main family sections and quick access to work.";

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={title}
        subtitle={subtitle}
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />
      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{title}</h1>
          <p className="app-mobile-section-intro__hint">{mobileHint}</p>
        </div>
      </div>

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-3">
          <p className="app-card-title">
            {language === "ru"
              ? "Сейчас у вас нет доступа к разделам семьи"
              : "You do not have access to family sections right now"}
          </p>
          <p className="text-sm leading-6 text-muted">
            {language === "ru"
              ? "Дети, журнал, приёмы и аптечка сейчас скрыты для этого аккаунта. Обратитесь к владельцу семьи или администратору, если доступ нужно вернуть."
              : "Children, journal, meds, and cabinet are hidden for this account right now. Contact the family owner or an admin if access should be restored."}
          </p>
        </div>
      </RowSurface>
    </div>
  );
}
