import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function PrivacyPolicyPage() {
  const { language } = useI18n();
  const updatedAt = "08.04.2026";

  return (
    <div className="legal-doc-page app-safe-top-standalone mx-auto w-full max-w-3xl space-y-6 sm:space-y-8 px-3 pb-6 sm:px-0">
      <PageIntro
        title={language === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
        subtitle={
          language === "ru"
            ? "Как мы обрабатываем и защищаем данные в PillPath."
            : "How we process and protect data in PillPath."
        }
        compactOnMobile
        className="app-safe-top-standalone"
      />

      <Surface className="legal-doc-surface space-y-4 p-4 text-[0.95rem] leading-6 text-muted sm:p-6 sm:text-sm sm:leading-7">
        <p>
          {language === "ru"
            ? `Дата последнего обновления: ${updatedAt}.`
            : `Last updated: ${updatedAt}.`}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "1. Кто мы" : "1. Who we are"}
        </h2>
        <p>
          {language === "ru"
            ? "PillPath — бесплатный информационный сервис для семейного учета лекарств, наблюдений и напоминаний. Приложение публикуется и поддерживается физическим лицом (владельцем приложения), без отдельного юридического лица."
            : "PillPath is a free informational service for family medication tracking, observations and reminders. The app is published and operated by an individual (the app owner), without a separate legal entity."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "2. Какие данные мы обрабатываем" : "2. What data we process"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Данные аккаунта: логин, email (если указан), язык интерфейса."
              : "Account data: login, email (if provided), interface language."}
          </li>
          <li>
            {language === "ru"
              ? "Данные семьи: имя семьи, участники, роли."
              : "Family data: family name, members, roles."}
          </li>
          <li>
            {language === "ru"
              ? "Данные детей и ухода: профили, планы приема, отметки приема, наблюдения и связанные заметки."
              : "Child and care data: profiles, medication plans, intake marks, observations and related notes."}
          </li>
          <li>
            {language === "ru"
              ? "Технические данные: базовые события работы приложения, необходимые для безопасности и стабильности."
              : "Technical data: basic app operation events required for security and stability."}
          </li>
        </ul>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "3. Зачем мы используем данные" : "3. Why we use data"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Для работы ключевых функций сервиса."
              : "To provide core service functionality."}
          </li>
          <li>
            {language === "ru"
              ? "Для хранения истории действий и отображения аналитики."
              : "To store activity history and show analytics."}
          </li>
          <li>
            {language === "ru"
              ? "Для отправки напоминаний и push-уведомлений (если вы включили их в системе)."
              : "To send reminders and push notifications (if enabled by you in system settings)."}
          </li>
          <li>
            {language === "ru"
              ? "Для поддержки пользователей и ответа на обращения."
              : "To provide support and respond to requests."}
          </li>
        </ul>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "4. Правовые основания и регионы" : "4. Legal basis and regions"}
        </h2>
        <p>
          {language === "ru"
            ? "Для пользователей из ЕС/ЕЭЗ применяются права GDPR (доступ, исправление, удаление, ограничение обработки, переносимость и возражение). Для пользователей из США запросы обрабатываются в рамках применимого законодательства штата о конфиденциальности."
            : "For users in the EU/EEA, GDPR rights apply (access, correction, deletion, restriction, portability and objection). For users in the US, requests are handled under applicable state privacy laws."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru"
            ? "5. Передача данных третьим лицам"
            : "5. Sharing data with third parties"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы не продаем персональные данные. Данные могут обрабатываться инфраструктурными провайдерами (хостинг, push-инфраструктура) только в объеме, необходимом для работы сервиса."
            : "We do not sell personal data. Data may be processed by infrastructure providers (hosting, push infrastructure) only to the extent required to run the service."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "6. Срок хранения и удаление" : "6. Retention and deletion"}
        </h2>
        <p>
          {language === "ru"
            ? "Данные хранятся, пока аккаунт активен, либо до удаления по запросу пользователя. Вы можете запросить удаление аккаунта и данных через раздел «Поддержка / Контакты»."
            : "Data is stored while your account is active, or until deletion is requested. You can request account and data deletion via the “Support / Contact” section."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "7. Безопасность" : "7. Security"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы применяем разумные технические меры защиты, но ни один способ хранения и передачи данных не гарантирует абсолютную безопасность."
            : "We apply reasonable technical safeguards, but no storage or transmission method can guarantee absolute security."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "8. Дети" : "8. Children"}
        </h2>
        <p>
          {language === "ru"
            ? "Профили детей создаются и ведутся взрослым пользователем (родителем/опекуном), который несет ответственность за правомерность внесения данных."
            : "Children profiles are created and managed by an adult user (parent/guardian), who is responsible for lawful submission of such data."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "9. Связь по privacy-запросам" : "9. Privacy contact"}
        </h2>
        <p>
          {language === "ru"
            ? "Для запросов по персональным данным (доступ, исправление, удаление, ограничение обработки) используйте раздел «Поддержка / Контакты» внутри приложения."
            : "For personal data requests (access, correction, deletion, restriction), use the in-app “Support / Contact” section."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "10. Изменения политики" : "10. Policy updates"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы можем обновлять эту политику. Новая редакция вступает в силу с даты публикации в приложении."
            : "We may update this policy. The new version becomes effective as of the publication date in the app."}
        </p>
      </Surface>
    </div>
  );
}
