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
            ? "Версия для пользователей из Республики Беларусь."
            : "Version for users in the Republic of Belarus."
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
            ? "Для запросов по персональным данным (доступ, исправление, удаление) используйте раздел «Поддержка / Контакты»."
            : "For personal data requests (access, correction, deletion), use the “Support / Contact” section."}
        </p>
        <p className="text-xs">
          {language === "ru"
            ? "Примечание: юридические реквизиты оператора и полная редакция политики будут дополнены перед публичным релизом."
            : "Note: operator legal details and the full policy text will be completed before public release."}
        </p>
      </Surface>
    </div>
  );
}
