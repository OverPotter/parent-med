import { Link } from "react-router-dom";
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
        action={
          <Link
            to="/legal"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Правовая информация" : "← Legal information"}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/legal"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Правовая информация" : "← Legal information"}
          </Link>
          <h1 className="app-mobile-section-intro__title">
            {language === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
          </h1>
          <p className="app-mobile-section-intro__hint">
            {language === "ru"
              ? "Как мы обрабатываем и защищаем данные в PillPath."
              : "How we process and protect data in PillPath."}
          </p>
        </div>
      </div>

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
            ? "PillPath — сервис для семейного учёта лекарств, наблюдений, напоминаний и связанных записей по уходу. Эта политика описывает, какие данные мы получаем, как их используем, кому передаём и как вы можете управлять своими privacy-настройками."
            : "PillPath is a service for family medication tracking, observations, reminders, and related care records. This policy explains what data we receive, how we use it, when we share it, and how you can manage your privacy choices."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "2. Какие данные мы собираем" : "2. What data we collect"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Данные аккаунта и профиля: логин, email, отображаемое имя, роль в семье, кем вы приходитесь ребёнку, телефон, язык интерфейса и тема."
              : "Account and profile data: login, email, display name, family role, relationship label, phone number, interface language, and theme."}
          </li>
          <li>
            {language === "ru"
              ? "Данные семьи: название семьи, участники, роли, ссылки-приглашения и связанные действия."
              : "Family data: family name, members, roles, invite links, and related actions."}
          </li>
          <li>
            {language === "ru"
              ? "Данные детей и ухода: профили детей, даты рождения, заметки, аллергии, контакты врача или учреждения, история болезней, температуры, приёмы лекарств, планы таблетницы, аптечка, сон, кормления, рост, вес и другие записи, которые вы добавляете сами."
              : "Child and care data: child profiles, birth dates, notes, allergies, doctor or institution contacts, illness history, temperatures, medication logs, pillbox plans, medicine cabinet data, sleep, feeding, height, weight, and other records you enter."}
          </li>
          <li>
            {language === "ru"
              ? "Данные уведомлений: push-подписки устройства, push-токены и ваши настройки напоминаний, если вы включаете уведомления."
              : "Notification data: device push subscriptions, push tokens, and your reminder preferences if you enable notifications."}
          </li>
          <li>
            {language === "ru"
              ? "Обращения в поддержку: текст сообщения, дата, идентификатор обращения и аккаунт, от которого оно отправлено."
              : "Support requests: message text, submission time, request identifier, and the account that sent it."}
          </li>
          <li>
            {language === "ru"
              ? "Диагностические и аналитические данные: базовые события использования приложения и техническая телеметрия. Аналитические cookies и трекинг включаются только после вашего согласия там, где это предусмотрено."
              : "Diagnostics and analytics data: basic app usage events and technical telemetry. Analytics cookies and tracking are enabled only after your consent where applicable."}
          </li>
        </ul>
        <p>
          {language === "ru"
            ? "Мы не используем HealthKit, Clinical Health Records API, Motion & Fitness API и не считываем медицинские данные напрямую из системных health-фреймворков устройства."
            : "We do not use HealthKit, the Clinical Health Records API, Motion & Fitness APIs, and we do not read medical data directly from the device’s system health frameworks."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "3. Как мы собираем данные" : "3. How we collect data"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Непосредственно от вас, когда вы создаёте аккаунт, редактируете профиль, добавляете детей, лекарства, записи, заметки и обращения."
              : "Directly from you when you create an account, edit your profile, add children, medications, records, notes, and support requests."}
          </li>
          <li>
            {language === "ru"
              ? "От устройства и браузера, когда вы включаете push-уведомления или используете приложение в web/PWA-режиме."
              : "From your device and browser when you enable push notifications or use the app in web/PWA mode."}
          </li>
          <li>
            {language === "ru"
              ? "От встроенных сервисов аналитики и инфраструктуры, если это необходимо для работы приложения и разрешено вашими настройками consent."
              : "From integrated analytics and infrastructure services where needed for app operation and permitted by your consent settings."}
          </li>
        </ul>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "4. Как мы используем данные" : "4. How we use data"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Чтобы создавать и обслуживать ваш аккаунт, семью и доступ участников."
              : "To create and maintain your account, family workspace, and member access."}
          </li>
          <li>
            {language === "ru"
              ? "Чтобы хранить и показывать введённые вами записи по детям, лекарствам, болезням, планам и истории."
              : "To store and display the records you enter about children, medicines, illnesses, plans, and history."}
          </li>
          <li>
            {language === "ru"
              ? "Чтобы отправлять напоминания и push-уведомления, если вы включили их в системе и в приложении."
              : "To send reminders and push notifications if you enable them in system and app settings."}
          </li>
          <li>
            {language === "ru"
              ? "Чтобы отвечать на обращения, исправлять ошибки, защищать аккаунты и поддерживать стабильность сервиса."
              : "To respond to support requests, fix issues, protect accounts, and maintain service stability."}
          </li>
          <li>
            {language === "ru"
              ? "Чтобы анализировать использование продукта и улучшать интерфейс только в рамках разрешённой аналитики и согласия пользователя."
              : "To analyze product usage and improve the interface only within the scope of permitted analytics and user consent."}
          </li>
        </ul>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "5. Третьи лица и SDK" : "5. Third parties and SDKs"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы не продаём персональные данные и не передаём их рекламным брокерам. Данные могут обрабатываться ограниченным кругом подрядчиков, которые помогают нам предоставлять сервис: хостинг и базы данных, push-инфраструктура, а также аналитика при наличии согласия. Мы требуем, чтобы такие подрядчики обеспечивали защиту данных не слабее той, что описана в этой политике."
            : "We do not sell personal data and we do not share it with data brokers. Data may be processed by a limited set of service providers that help us operate the app: hosting and database infrastructure, push infrastructure, and analytics where consent is provided. We require those providers to protect user data to the same or a comparable standard described in this policy."}
        </p>
        <p>
          {language === "ru"
            ? "Мы не используем данные о здоровье, семейные данные или детские записи для рекламы, маркетинга или стороннего профилирования."
            : "We do not use health-related, family, or child records for advertising, marketing, or third-party profiling."}
        </p>
        <p>
          {language === "ru"
            ? "Если вы даёте согласие на аналитику, приложение может отправлять в сервис аналитики HitKeep события использования, просмотры экранов, технические сведения о сессии и, для авторизованного аккаунта, идентификатор аккаунта и семейную роль. Мы используем эти данные для product-аналитики, диагностики и улучшения интерфейса, а не для рекламы."
            : "If you consent to analytics, the app may send usage events, screen views, session-level technical data, and, for signed-in users, the account identifier and family role to the HitKeep analytics service. We use this data for product analytics, diagnostics, and interface improvements, not for advertising."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "6. Срок хранения и удаление" : "6. Retention and deletion"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы храним данные, пока ваш аккаунт активен и это необходимо для работы сервиса. Если вы удаляете аккаунт или семью, данные удаляются или деактивируются в соответствии с внутренними процедурами хранения, резервного копирования и требованиями закона."
            : "We retain data while your account is active and for as long as it is needed to operate the service. If you delete your account or family, data is deleted or deactivated in accordance with internal retention, backup, and legal requirements."}
        </p>
        <p>
          {language === "ru"
            ? "Запросить удаление можно через встроенные действия в приложении, если они доступны для вашей роли, либо через раздел поддержки. При удалении push-подписки и analytics-consent ваши соответствующие настройки прекращают применяться к дальнейшему использованию."
            : "You can request deletion through in-app actions where available for your role, or through support. When you disable push subscriptions or withdraw analytics consent, those settings stop applying to future use."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "7. Privacy choices и согласие" : "7. Privacy choices and consent"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Push-уведомления работают только после вашего системного разрешения и могут быть отключены в настройках устройства или приложения."
              : "Push notifications work only after your system permission and can be disabled in the device or app settings."}
          </li>
          <li>
            {language === "ru"
              ? "Аналитические cookies и аналитика использования включаются только после согласия там, где применимо. Если вы не даёте согласие, соответствующие аналитические события не должны отправляться."
              : "Analytics cookies and usage analytics are enabled only after consent where applicable. If you do not consent, the corresponding analytics events should not be sent."}
          </li>
          <li>
            {language === "ru"
              ? "Вы можете обратиться в поддержку, чтобы запросить доступ, исправление, удаление данных или отзыв ранее данного consent, если это применимо."
              : "You can contact support to request access, correction, deletion, or withdrawal of a previously given consent where applicable."}
          </li>
        </ul>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "8. Безопасность" : "8. Security"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы применяем разумные технические и организационные меры защиты. При этом ни один способ передачи или хранения данных не гарантирует абсолютную безопасность."
            : "We apply reasonable technical and organizational safeguards. However, no storage or transmission method can guarantee absolute security."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "9. Данные детей" : "9. Children’s data"}
        </h2>
        <p>
          {language === "ru"
            ? "Профили детей, медицинские и уходовые записи создаются и ведутся взрослыми пользователями, которые подтверждают, что имеют право вносить такие данные. Мы просим не добавлять лишние чувствительные сведения, если они не нужны для работы сервиса."
            : "Children’s profiles and related health or care records are created and managed by adult users who confirm they are authorized to enter such data. Please do not add sensitive information that is not necessary for the service."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "10. Ваши права и способы связи" : "10. Your rights and contact"}
        </h2>
        <p>
          {language === "ru"
            ? "Если вы находитесь в ЕС/ЕЭЗ, у вас могут быть права по GDPR, включая доступ, исправление, удаление, ограничение обработки, переносимость и возражение. В других регионах ваши права определяются применимым законодательством о конфиденциальности. Для privacy-запросов и обращений используйте раздел «Поддержка / Контакты» внутри приложения."
            : "If you are in the EU/EEA, you may have rights under GDPR, including access, correction, deletion, restriction, portability, and objection. In other regions, your rights depend on applicable privacy law. For privacy requests and support, use the in-app “Support / Contact” section."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "11. Изменения политики" : "11. Policy updates"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы можем обновлять эту политику при изменении продукта, инфраструктуры или правовых требований. Новая редакция действует с даты публикации в приложении и на соответствующей странице политики."
            : "We may update this policy when the product, infrastructure, or legal requirements change. The new version becomes effective on the date it is published in the app and on the corresponding policy page."}
        </p>
      </Surface>
    </div>
  );
}
