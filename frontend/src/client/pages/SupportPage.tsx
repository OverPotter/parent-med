import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function SupportPage() {
  const { language } = useI18n();

  return (
    <div className="space-y-6">
      <PageIntro
        title={language === "ru" ? "Поддержка / Контакты" : "Support / Contact"}
        subtitle={
          language === "ru"
            ? "Куда писать по вопросам сервиса, персональных данных и legal-запросам."
            : "Where to contact us about service, personal data and legal requests."
        }
        compactOnMobile
      />

      <Surface className="space-y-3 p-5 text-sm leading-7 text-muted sm:p-6">
        <p>
          {language === "ru"
            ? "Внутри приложения используйте форму «Обратная связь»."
            : "Inside the app, use the “Feedback” form."}
        </p>
        <p>
          <Link to="/auth?mode=login" className="underline">
            {language === "ru"
              ? "Войти и открыть форму обратной связи"
              : "Sign in and open feedback form"}
          </Link>
        </p>
        <p>
          {language === "ru"
            ? "Для legal/privacy-запросов (RU/US/EU) укажите тему обращения, регион и контакт для обратной связи."
            : "For legal/privacy requests (RU/US/EU), include the request topic, your region and your contact details."}
        </p>
      </Surface>
    </div>
  );
}
