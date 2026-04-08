import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function TermsOfUsePage() {
  const { language } = useI18n();

  return (
    <div className="legal-doc-page app-safe-top-standalone mx-auto w-full max-w-3xl space-y-4 px-3 pb-6 sm:space-y-6 sm:px-0">
      <PageIntro
        title={language === "ru" ? "Условия использования" : "Terms of Use"}
        subtitle={
          language === "ru"
            ? "Базовые правила использования сервиса для RU / US / EU."
            : "Core rules for using the service in RU / US / EU."
        }
        compactOnMobile
      />

      <Surface className="legal-doc-surface space-y-4 p-4 text-[0.95rem] leading-6 text-muted sm:p-6 sm:text-sm sm:leading-7">
        <p>
          {language === "ru"
            ? "PillPath — информационный семейный сервис для учета лекарств и событий по уходу."
            : "PillPath is an informational family service for medicine and care tracking."}
        </p>
        <p>
          {language === "ru"
            ? "Пользователь самостоятельно принимает решения о лечении и несет ответственность за их последствия."
            : "Users make treatment decisions on their own and are responsible for their outcomes."}
        </p>
        <p>
          {language === "ru"
            ? "Используя сервис, пользователь подтверждает, что ознакомился с Privacy Policy и согласен с обработкой данных в объеме, необходимом для работы продукта."
            : "By using the service, the user confirms they reviewed the Privacy Policy and agree to data processing required for product functionality."}
        </p>
        <p>
          {language === "ru"
            ? "Запрещено использовать сервис в незаконных целях или публиковать чужие персональные данные без правовых оснований."
            : "It is prohibited to use the service for illegal purposes or publish third-party personal data without legal grounds."}
        </p>
        <p className="text-xs">
          {language === "ru"
            ? "Перед релизом проверьте, что внешняя публичная редакция Terms of Use заполнена для целевых регионов."
            : "Before release, ensure the public Terms of Use version is completed for target regions."}
        </p>
      </Surface>
    </div>
  );
}
