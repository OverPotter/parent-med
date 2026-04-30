import { useRef } from "react";
import { useHistoryBackFallback } from "@client/pages/legal/useHistoryBackFallback";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { PageIntro } from "@shared/components/PageIntro";
import { PublicSiteHeader } from "@shared/components/PublicSiteHeader";
import { Surface } from "@shared/components/Surface";
import { getSupportUrl, getTermsOfUseUrl } from "@shared/config/legal";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { Link, useLocation } from "react-router-dom";
import { getPaywallLegalRouteState, isPaywallLegalRouteState } from "./legal/legalRouteState";

const backLinkClass = "inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary";

function LegalInlineLink({
  href,
  state,
  children,
}: {
  href: string;
  state?: unknown;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link
        to={href}
        state={state}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

export function PrivacyPolicyPage() {
  const { language } = useI18n();
  const updatedAt = "29.04.2026";
  const handleBack = useHistoryBackFallback("/legal");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const hasSession = useAppStore((s) => Boolean(s.authToken || s.accountId));
  const fromPaywall = isPaywallLegalRouteState(location.state);
  const preservedLegalState = getPaywallLegalRouteState(location.state);
  const showPublicHeader = !hasSession || fromPaywall;
  const supportUrl = getSupportUrl();
  const termsUrl = getTermsOfUseUrl();
  const accountHref = hasSession ? "/more" : "/auth?mode=login";
  const accountLabel =
    language === "ru" ? (hasSession ? "Ещё" : "Войти") : hasSession ? "More" : "Login";

  return (
    <div
      ref={rootRef}
      className={[
        "legal-doc-page mx-auto w-full max-w-3xl min-w-0 space-y-6 px-3 pb-6 sm:space-y-8 sm:px-0",
        fromPaywall ? "legal-doc-page--paywall" : "",
        showPublicHeader ? "" : "app-safe-top-standalone",
      ].join(" ")}
    >
      {showPublicHeader ? (
        <PublicSiteHeader accountHref={accountHref} accountLabel={accountLabel} />
      ) : null}
      <IosEdgeBackGesture isEnabled onBack={handleBack} targetRef={rootRef} />
      <PageIntro
        title={language === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
        subtitle={
          language === "ru"
            ? "Как мы обрабатываем и защищаем данные в PillPath."
            : "How we process and protect data in PillPath."
        }
        action={
          <button type="button" onClick={handleBack} className={backLinkClass}>
            {language === "ru" ? "← Правовая информация" : "← Legal information"}
          </button>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <button type="button" onClick={handleBack} className={`mb-1 ${backLinkClass}`}>
            {language === "ru" ? "← Правовая информация" : "← Legal information"}
          </button>
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
        <p className="rounded-2xl bg-muted/40 px-4 py-3 text-sm leading-6 text-muted">
          {language === "ru" ? (
            <>
              Для privacy-запросов, удаления аккаунта и обращений App Store используйте публичную
              страницу{" "}
              <LegalInlineLink href={supportUrl} state={preservedLegalState}>
                «Поддержка / Контакты»
              </LegalInlineLink>
              . Условия подписки и использования сервиса описаны в{" "}
              <LegalInlineLink href={termsUrl} state={preservedLegalState}>
                «Условиях использования»
              </LegalInlineLink>
              .
            </>
          ) : (
            <>
              For privacy requests, account deletion, and App Store support matters, use the public{" "}
              <LegalInlineLink href={supportUrl} state={preservedLegalState}>
                Support / Contact
              </LegalInlineLink>{" "}
              page. Subscription and service rules are described in the{" "}
              <LegalInlineLink href={termsUrl} state={preservedLegalState}>
                Terms of Use
              </LegalInlineLink>
              .
            </>
          )}
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
              ? "Данные подписки и биллинга: текущий план, статус подписки, идентификатор продукта, даты начала и окончания периода, а также технические идентификаторы, которые приходят от App Store и нашей billing-инфраструктуры."
              : "Subscription and billing data: current plan, subscription status, product identifier, billing period dates, and technical identifiers received from the App Store and our billing infrastructure."}
          </li>
          <li>
            {language === "ru"
              ? "Обращения в поддержку: текст сообщения, дата, идентификатор обращения, контакт для ответа и, если обращение отправлено из приложения, аккаунт, от которого оно отправлено."
              : "Support requests: message text, submission time, request identifier, reply contact, and, if the request is sent from inside the app, the account that sent it."}
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
              ? "От устройства и браузера, когда вы включаете push-уведомления, открываете публичный сайт или используете приложение на iPhone."
              : "From your device and browser when you enable push notifications, open the public website, or use the app on iPhone."}
          </li>
          <li>
            {language === "ru"
              ? "От App Store и связанных payment/subscription сервисов, когда вы оформляете, восстанавливаете или управляете подпиской Plus."
              : "From the App Store and related payment or subscription services when you purchase, restore, or manage a Plus subscription."}
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
              ? "Чтобы подтверждать право на функции Plus, синхронизировать подписочный статус и предотвращать ошибки биллинга."
              : "To confirm Plus entitlement, synchronize subscription status, and prevent billing-related errors."}
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
            ? "Мы не продаём персональные данные и не передаём их рекламным брокерам. Данные могут обрабатываться ограниченным кругом подрядчиков, которые помогают нам предоставлять сервис: хостинг и базы данных, push-инфраструктура, аналитика при наличии согласия, а также подписочная и billing-инфраструктура. Мы требуем, чтобы такие подрядчики обеспечивали защиту данных не слабее той, что описана в этой политике."
            : "We do not sell personal data and we do not share it with data brokers. Data may be processed by a limited set of service providers that help us operate the app: hosting and database infrastructure, push infrastructure, analytics where consent is provided, and subscription or billing infrastructure. We require those providers to protect user data to the same or a comparable standard described in this policy."}
        </p>
        <p>
          {language === "ru"
            ? "Платежи за подписку Plus обрабатываются Apple через App Store на условиях Apple. Мы можем получать от Apple и связанных subscription-сервисов технические сведения, необходимые для активации, проверки, восстановления и управления подпиской."
            : "Payments for the Plus subscription are processed by Apple through the App Store under Apple’s terms. We may receive technical information from Apple and related subscription services as needed to activate, verify, restore, and manage the subscription."}
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
            ? "Запросить удаление можно через встроенное удаление аккаунта в приложении или через раздел поддержки. Если закон требует сохранить часть данных, например платёжные, налоговые или anti-fraud записи, мы сохраняем только тот минимум и только на требуемый срок. При удалении push-подписки и analytics-consent ваши соответствующие настройки прекращают применяться к дальнейшему использованию."
            : "You can request deletion through the in-app account deletion flow or through support. If law requires us to keep limited data, such as payment, tax, or anti-fraud records, we retain only that minimum and only for the required period. When you disable push subscriptions or withdraw analytics consent, those settings stop applying to future use."}
        </p>
        <p>
          {language === "ru"
            ? "Удаление аккаунта PillPath не отменяет автоматически подписку Plus в App Store. Если этот аккаунт управляет Plus для семьи, сначала нужно отдельно отключить продление через Apple ID / App Store и дождаться окончания текущего оплаченного периода."
            : "Deleting a PillPath account does not automatically cancel a Plus subscription in the App Store. If this account manages Plus for the family, renewal must first be turned off separately through Apple ID / the App Store, and the current paid period must be allowed to end."}
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
              ? "Вы можете запросить доступ, исправление, удаление данных или privacy-разъяснение через страницу «Поддержка / Контакты» на сайте или через поддержку в приложении."
              : "You can request access, correction, deletion, or privacy clarification through the public “Support / Contact” page on the website or through support inside the app."}
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
            ? "Если вы находитесь в ЕС/ЕЭЗ, у вас могут быть права по GDPR, включая доступ, исправление, удаление, ограничение обработки, переносимость и возражение. В других регионах ваши права определяются применимым законодательством о конфиденциальности. Для privacy-запросов и обращений используйте публичную страницу «Поддержка / Контакты» на сайте или форму внутри приложения. Эта страница является публичным privacy choices / support channel для App Store review, общих support-вопросов и запросов по персональным данным."
            : "If you are in the EU/EEA, you may have rights under GDPR, including access, correction, deletion, restriction, portability, and objection. In other regions, your rights depend on applicable privacy law. For privacy requests and support, use the public “Support / Contact” page on the website or the in-app form. That page serves as the public privacy choices and support channel for App Store review, general support, and personal data requests."}
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
