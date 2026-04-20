import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function TermsOfUsePage() {
  const { language } = useI18n();
  const updatedAt = "08.04.2026";

  return (
    <div className="legal-doc-page app-safe-top-standalone mx-auto w-full max-w-3xl space-y-6 sm:space-y-8 px-3 pb-6 sm:px-0">
      <PageIntro
        title={language === "ru" ? "Условия использования" : "Terms of Use"}
        subtitle={
          language === "ru"
            ? "Правила использования сервиса PillPath."
            : "Rules for using the PillPath service."
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
          {language === "ru" ? "1. О сервисе" : "1. About the service"}
        </h2>
        <p>
          {language === "ru"
            ? "PillPath — бесплатный информационный сервис для учета приема лекарств, наблюдений и задач по уходу."
            : "PillPath is a free informational service for tracking medication intake, observations and care tasks."}
        </p>
        <p>
          {language === "ru"
            ? "Сервис публикуется и поддерживается физическим лицом (владельцем приложения), без отдельного юридического лица."
            : "The service is published and operated by an individual (the app owner), without a separate legal entity."}
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
          {language === "ru" ? "7. Интеллектуальные права" : "7. Intellectual property"}
        </h2>
        <p>
          {language === "ru"
            ? "Интерфейс, тексты, код и графические элементы сервиса защищены применимым правом. Копирование и коммерческое использование без разрешения запрещены."
            : "The interface, texts, code and visual assets are protected by applicable law. Copying and commercial use without permission are prohibited."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "8. Прекращение использования" : "8. Termination"}
        </h2>
        <p>
          {language === "ru"
            ? "Вы можете прекратить использование сервиса в любой момент. Мы также можем ограничить или прекратить доступ при нарушении этих условий."
            : "You may stop using the service at any time. We may also restrict or terminate access for violations of these Terms."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "9. Изменения условий" : "9. Changes to terms"}
        </h2>
        <p>
          {language === "ru"
            ? "Мы можем обновлять условия использования. Новая редакция вступает в силу с даты публикации в приложении."
            : "We may update these Terms. The new version becomes effective as of the publication date in the app."}
        </p>

        <h2 className="text-base font-semibold text-main">
          {language === "ru" ? "10. Связь" : "10. Contact"}
        </h2>
        <p>
          {language === "ru"
            ? "По вопросам условий использования и прав пользователя используйте раздел «Поддержка / Контакты»."
            : "For questions about these Terms and user rights, use the “Support / Contact” section."}
        </p>
      </Surface>
    </div>
  );
}
