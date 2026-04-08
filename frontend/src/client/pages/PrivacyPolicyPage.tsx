import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function PrivacyPolicyPage() {
  const { language } = useI18n();

  return (
    <div className="space-y-6">
      <PageIntro
        title={language === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
        subtitle={
          language === "ru"
            ? "Базовые правила обработки данных для пользователей RU / US / EU."
            : "Core data processing rules for users in RU / US / EU."
        }
        compactOnMobile
      />

      <Surface className="space-y-4 p-5 text-sm leading-7 text-muted sm:p-6">
        <p>
          {language === "ru"
            ? "Сервис PillPath обрабатывает данные только для работы семейного кабинета: аккаунт, профиль семьи, записи о лекарствах и событиях по уходу."
            : "PillPath processes data only to provide the family workspace: account, family profile, medicine records and care events."}
        </p>
        <p>
          {language === "ru"
            ? "Мы не являемся медицинской организацией, не оказываем лечение и не принимаем медицинские решения за пользователя."
            : "We are not a medical provider, we do not provide treatment and we do not make medical decisions for users."}
        </p>
        <p>
          {language === "ru"
            ? "Для пользователей из ЕС/ЕЭЗ применяются права GDPR (доступ, исправление, удаление, ограничение обработки, переносимость и возражение). Для пользователей из США доступны запросы в рамках применимого privacy law штата."
            : "For users in the EU/EEA, GDPR rights apply (access, correction, deletion, restriction, portability and objection). For users in the US, requests are handled under applicable state privacy laws."}
        </p>
        <p>
          {language === "ru"
            ? "Для запросов по персональным данным (доступ, исправление, удаление) используйте раздел «Поддержка / Контакты»."
            : "For personal data requests (access, correction, deletion), use the “Support / Contact” section."}
        </p>
        <p className="text-xs">
          {language === "ru"
            ? "Перед релизом проверьте, что внешняя публичная Privacy Policy по ссылке в App Store полностью заполнена и соответствует целевым регионам."
            : "Before release, ensure the public Privacy Policy URL in App Store is fully completed and aligned with target regions."}
        </p>
      </Surface>
    </div>
  );
}
