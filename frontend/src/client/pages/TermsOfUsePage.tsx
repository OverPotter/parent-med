import { useRef } from "react";
import { useHistoryBackFallback } from "@client/pages/legal/useHistoryBackFallback";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { PageIntro } from "@shared/components/PageIntro";
import { PublicSiteHeader } from "@shared/components/PublicSiteHeader";
import { Surface } from "@shared/components/Surface";
import { getPrivacyPolicyUrl, getSupportUrl } from "@shared/config/legal";
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

export function TermsOfUsePage() {
  const { language } = useI18n();
  const updatedAt = "29.04.2026";
  const handleBack = useHistoryBackFallback("/legal");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const hasSession = useAppStore((s) => Boolean(s.authToken || s.accountId));
  const fromPaywall = isPaywallLegalRouteState(location.state);
  const preservedLegalState = getPaywallLegalRouteState(location.state);
  const showPublicHeader = !hasSession || fromPaywall;
  const privacyUrl = getPrivacyPolicyUrl();
  const supportUrl = getSupportUrl();
  const accountHref = hasSession ? "/more" : null;
  const accountLabel = hasSession ? (language === "ru" ? "Ещё" : "More") : null;

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
        title={language === "ru" ? "Условия использования" : "Terms of Use"}
        subtitle={
          language === "ru"
            ? "Правила использования сервиса PillPath."
            : "Rules for using the PillPath service."
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
            {language === "ru" ? "Условия использования" : "Terms of Use"}
          </h1>
          <p className="app-mobile-section-intro__hint">
            {language === "ru"
              ? "Правила использования сервиса PillPath."
              : "Rules for using the PillPath service."}
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
              Вопросы по подписке, отмене, privacy и правам пользователя направляйте через публичную
              страницу{" "}
              <LegalInlineLink href={supportUrl} state={preservedLegalState}>
                «Поддержка / Контакты»
              </LegalInlineLink>
              . Правила обработки данных описаны в{" "}
              <LegalInlineLink href={privacyUrl} state={preservedLegalState}>
                «Политике конфиденциальности»
              </LegalInlineLink>
              .
            </>
          ) : (
            <>
              For subscription, cancellation, privacy, and user-rights questions, use the public{" "}
              <LegalInlineLink href={supportUrl} state={preservedLegalState}>
                Support / Contact
              </LegalInlineLink>{" "}
              page. Data-handling rules are described in the{" "}
              <LegalInlineLink href={privacyUrl} state={preservedLegalState}>
                Privacy Policy
              </LegalInlineLink>
              .
            </>
          )}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "1. О сервисе" : "1. About the service"}
        </h2>
        <p>
          {language === "ru"
            ? "PillPath — информационный сервис и iPhone-приложение для семейного учета лекарств, наблюдений, напоминаний и задач по уходу."
            : "PillPath is an informational service and iPhone app for family medication tracking, observations, reminders, and care tasks."}
        </p>
        <p>
          {language === "ru"
            ? "Сервис публикуется и поддерживается физическим лицом (владельцем приложения), без отдельного юридического лица."
            : "The service is published and operated by an individual (the app owner), without a separate legal entity."}
        </p>
        <p>
          {language === "ru"
            ? "В сервисе могут быть бесплатные функции (`Free`) и платные функции по подписке (`Plus`). Конкретный состав функций зависит от текущего плана и версии приложения."
            : "The service may include free features (`Free`) and paid subscription features (`Plus`). The exact feature set depends on the current plan and app version."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "2. Принятие условий" : "2. Acceptance of terms"}
        </h2>
        <p>
          {language === "ru"
            ? "Используя сервис, вы подтверждаете согласие с этими условиями и Политикой конфиденциальности."
            : "By using the service, you confirm acceptance of these Terms and the Privacy Policy."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "3. Аккаунт и доступ" : "3. Account and access"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {language === "ru"
              ? "Вы отвечаете за сохранность доступа к своему аккаунту."
              : "You are responsible for maintaining access security to your account."}
          </li>
          <li>
            {language === "ru"
              ? "Вы обязуетесь указывать достоверные данные и не нарушать права третьих лиц."
              : "You agree to provide accurate information and not violate third-party rights."}
          </li>
          <li>
            {language === "ru"
              ? "Мы можем ограничить доступ при нарушении условий или требований закона."
              : "We may limit access in case of Terms violations or legal requirements."}
          </li>
        </ul>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "4. Разрешенное использование" : "4. Permitted use"}
        </h2>
        <p>
          {language === "ru"
            ? "Вы можете использовать сервис только в законных целях, для личного и семейного учета."
            : "You may use the service only for lawful purposes and personal/family tracking."}
        </p>
        <p>
          {language === "ru"
            ? "Запрещается использовать сервис для незаконной деятельности, злоупотреблений, попыток взлома или публикации чужих персональных данных без правовых оснований."
            : "It is prohibited to use the service for illegal activities, abuse, hacking attempts, or publishing third-party personal data without legal grounds."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "5. Медицинский дисклеймер" : "5. Medical disclaimer"}
        </h2>
        <p>
          {language === "ru"
            ? "PillPath не является медицинской организацией. Мы не врачи, не ставим диагнозы, не назначаем лечение и не заменяем консультацию специалиста."
            : "PillPath is not a medical provider. We are not doctors, we do not diagnose, prescribe treatment, or replace professional medical advice."}
        </p>
        <p>
          {language === "ru"
            ? "Все решения о лечении вы принимаете самостоятельно и на свой риск."
            : "All treatment decisions are made by you at your own risk."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "6. Доступность и ответственность" : "6. Availability and liability"}
        </h2>
        <p>
          {language === "ru"
            ? "Сервис предоставляется «как есть», без гарантий бесперебойной работы и абсолютной безошибочности."
            : "The service is provided “as is”, without warranties of uninterrupted operation or absolute error-free performance."}
        </p>
        <p>
          {language === "ru"
            ? "В пределах, разрешенных применимым правом, владелец приложения не несет ответственности за косвенные убытки, упущенную выгоду и последствия медицинских решений пользователя."
            : "To the extent permitted by applicable law, the app owner is not liable for indirect damages, lost profits, or consequences of users’ medical decisions."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "7. Подписки и платежи" : "7. Subscriptions and payments"}
        </h2>
        <p>
          {language === "ru"
            ? "Plus может предоставляться как auto-renewable subscription через App Store. Стоимость, пробный период, длительность и локальная цена показываются пользователю перед покупкой внутри приложения и в App Store."
            : "Plus may be offered as an auto-renewable subscription through the App Store. Price, trial period, duration, and local pricing are shown to the user before purchase inside the app and in the App Store."}
        </p>
        <p>
          {language === "ru"
            ? "Платежи обрабатываются Apple. Подписка автоматически продлевается, если пользователь не отменит её как минимум за 24 часа до окончания текущего периода, а оплата за следующий период может быть списана Apple в течение 24 часов до окончания текущего периода согласно правилам Apple."
            : "Payments are processed by Apple. The subscription renews automatically unless the user cancels at least 24 hours before the end of the current period, and Apple may charge the next period within 24 hours before the current period ends under Apple’s rules."}
        </p>
        <p>
          {language === "ru"
            ? "Управление подпиской, отмена и возвраты выполняются через Apple ID / App Store, если иное не предусмотрено применимым правом или правилами Apple."
            : "Subscription management, cancellation, and refunds are handled through Apple ID / the App Store, unless otherwise required by applicable law or Apple’s rules."}
        </p>
        <p>
          {language === "ru"
            ? "Удаление аккаунта в PillPath не отменяет автоматически подписку Plus. Если этот аккаунт управляет Plus для семьи, приложение может потребовать сначала отдельно открыть настройки Apple ID / App Store, выключить продление и дождаться окончания текущего оплаченного периода, прежде чем встроенное удаление аккаунта станет доступно."
            : "Deleting a PillPath account does not automatically cancel a Plus subscription. If this account manages Plus for the family, the app may require you to first open Apple ID / App Store settings separately, turn off renewal, and wait until the current paid period ends before in-app account deletion becomes available."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "8. Интеллектуальные права" : "8. Intellectual property"}
        </h2>
        <p>
          {language === "ru"
            ? "Интерфейс, тексты, код и графические элементы сервиса защищены применимым правом. Копирование и коммерческое использование без разрешения запрещены."
            : "The interface, texts, code and visual assets are protected by applicable law. Copying and commercial use without permission are prohibited."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "9. Прекращение использования" : "9. Termination"}
        </h2>
        <p>
          {language === "ru"
            ? "Вы можете прекратить использование сервиса в любой момент. Мы также можем ограничить или прекратить доступ при нарушении этих условий."
            : "You may stop using the service at any time. We may also restrict or terminate access for violations of these Terms."}
        </p>
        <p>
          {language === "ru"
            ? "Если приложение поддерживает создание аккаунта, пользователь также может инициировать удаление аккаунта внутри приложения. Подробности обработки таких запросов описаны в Политике конфиденциальности."
            : "If the app supports account creation, the user can also initiate account deletion inside the app. Details about handling those requests are described in the Privacy Policy."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "10. Изменения условий" : "10. Changes to terms"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы можем обновлять условия использования. Новая редакция вступает в силу с даты публикации в приложении."
            : "We may update these Terms. The new version becomes effective as of the publication date in the app."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "11. Связь" : "11. Contact"}
        </h2>
        <p>
          {language === "ru"
            ? "По вопросам условий использования, подписки, прав пользователя и запросов по данным используйте публичную страницу «Поддержка / Контакты» на сайте или соответствующий раздел внутри приложения."
            : "For questions about these Terms, subscriptions, user rights, and data requests, use the public “Support / Contact” page on the website or the corresponding section inside the app."}
        </p>
      </Surface>
    </div>
  );
}
