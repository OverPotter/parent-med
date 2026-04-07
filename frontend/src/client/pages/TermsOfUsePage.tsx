import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function TermsOfUsePage() {
  const { language } = useI18n();

  return (
    <div className="space-y-6">
      <PageIntro
        title={language === "ru" ? "Условия использования" : "Terms of Use"}
        subtitle={
          language === "ru"
            ? "Базовые правила использования сервиса PillPath."
            : "Basic rules for using PillPath."
        }
        compactOnMobile
      />

      <Surface className="space-y-4 p-5 text-sm leading-7 text-muted sm:p-6">
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
            ? "Запрещено использовать сервис в незаконных целях или публиковать чужие персональные данные без правовых оснований."
            : "It is prohibited to use the service for illegal purposes or publish third-party personal data without legal grounds."}
        </p>
        <p className="text-xs">
          {language === "ru"
            ? "Примечание: перед публичным релизом будет опубликована полная юридическая редакция условий."
            : "Note: the complete legal text will be published before public release."}
        </p>
      </Surface>
    </div>
  );
}
