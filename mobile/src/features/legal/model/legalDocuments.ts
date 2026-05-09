import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type LegalDocumentKey = "privacy" | "terms";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocumentContent = {
  title: string;
  subtitle: string;
  updatedAtLabel: string;
  sections: LegalSection[];
};

export function buildLegalDocumentContent(
  locale: MobileLocale,
  key: LegalDocumentKey,
): LegalDocumentContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";

  if (key === "privacy") {
    return {
      title: isRu ? "Политика конфиденциальности" : isDe ? "Datenschutzerklärung" : "Privacy Policy",
      subtitle: isRu
        ? "Как мы обрабатываем и защищаем данные в PillPath."
        : isDe
          ? "Wie wir Daten in PillPath verarbeiten und schützen."
        : "How we process and protect data in PillPath.",
      updatedAtLabel: isRu ? "Обновлено: 29.04.2026" : isDe ? "Aktualisiert: 29.04.2026" : "Updated: 29.04.2026",
      sections: [
        {
          title: isRu ? "1. Кто мы" : isDe ? "1. Wer wir sind" : "1. Who we are",
          paragraphs: [
            isRu
              ? "PillPath — сервис для семейного учёта лекарств, наблюдений, напоминаний и связанных записей по уходу."
              : isDe
                ? "PillPath ist ein Dienst für die familiäre Verwaltung von Medikamenten, Beobachtungen, Erinnerungen und zugehörigen Pflegeeinträgen."
              : "PillPath is a service for family medication tracking, observations, reminders, and related care records.",
          ],
        },
        {
          title: isRu ? "2. Какие данные мы собираем" : isDe ? "2. Welche Daten wir erfassen" : "2. What data we collect",
          bullets: isRu
            ? [
                "Данные аккаунта и профиля: email, имя в семье, роль, кем вы приходитесь ребёнку, телефон и язык.",
                "Данные семьи: название семьи, участники, роли и коды приглашения.",
                "Данные детей и ухода: профили детей, заметки, аллергии, история болезней, лекарства, сон, кормления, рост и вес.",
                "Данные уведомлений и подписки: push-токены, настройки напоминаний, статус подписки и технические billing-идентификаторы.",
              ]
            : isDe
              ? [
                  "Konto- und Profildaten: E-Mail, Name in der Familie, Rolle, Familienbeziehung, Telefonnummer und Sprache.",
                  "Familiendaten: Familienname, Mitglieder, Rollen und Einladungscodes.",
                  "Kinder- und Pflegedaten: Kinderprofile, Notizen, Allergien, Krankheitsverlauf, Medikamente, Schlaf, Fütterungen, Größe und Gewicht.",
                  "Benachrichtigungs- und Abodaten: Push-Tokens, Erinnerungseinstellungen, Abostatus und technische Billing-IDs.",
                ]
            : [
                "Account and profile data: email, family display name, role, relationship label, phone, and language.",
                "Family data: family name, members, roles, and invite codes.",
                "Child and care data: child profiles, notes, allergies, illness history, medicines, sleep, feeding, growth, and weight.",
                "Notification and subscription data: push tokens, reminder preferences, subscription status, and technical billing identifiers.",
              ],
        },
        {
          title: isRu ? "3. Как мы используем данные" : isDe ? "3. Wie wir Daten verwenden" : "3. How we use data",
          bullets: isRu
            ? [
                "Чтобы создавать и поддерживать ваш аккаунт и семью.",
                "Чтобы хранить и показывать записи по детям и уходу.",
                "Чтобы отправлять напоминания, если вы включили уведомления.",
                "Чтобы поддерживать подписку Plus, стабильность сервиса и внутреннюю продуктовую аналитику.",
              ]
            : isDe
              ? [
                  "Um Ihr Konto und Ihren Familienbereich zu erstellen und zu verwalten.",
                  "Um Kinder- und Pflegeeinträge zu speichern und anzuzeigen.",
                  "Um Erinnerungen zu senden, wenn Sie Benachrichtigungen aktiviert haben.",
                  "Um Plus-Abos, Stabilität des Dienstes und interne Produktanalysen zu unterstützen.",
                ]
            : [
                "To create and maintain your account and family workspace.",
                "To store and display child and care records.",
                "To send reminders if notifications are enabled.",
                "To support Plus subscriptions, service stability, and internal product analytics.",
              ],
        },
        {
          title: isRu ? "4. Третьи лица и хранение" : isDe ? "4. Dritte und Aufbewahrung" : "4. Third parties and retention",
          paragraphs: [
            isRu
              ? "Мы не продаём персональные данные. Ограниченный круг подрядчиков может обрабатывать данные для хостинга, push-инфраструктуры, внутренней аналитики и подписок."
              : isDe
                ? "Wir verkaufen keine personenbezogenen Daten. Eine begrenzte Zahl von Dienstleistern kann Daten für Hosting, Push-Infrastruktur, interne Analysen und Abos verarbeiten."
              : "We do not sell personal data. A limited set of providers may process data for hosting, push infrastructure, internal analytics, and subscriptions.",
            isRu
              ? "Данные хранятся, пока аккаунт активен и это нужно для работы сервиса. Удаление аккаунта не отменяет автоматически подписку в App Store."
              : isDe
                ? "Daten werden gespeichert, solange das Konto aktiv ist und sie für den Dienst benötigt werden. Das Löschen eines Kontos kündigt das App-Store-Abo nicht automatisch."
              : "Data is kept while the account is active and needed for the service. Deleting an account does not automatically cancel an App Store subscription.",
          ],
        },
        {
          title: isRu ? "5. Ваши права" : isDe ? "5. Ihre Rechte" : "5. Your rights",
          paragraphs: [
            isRu
              ? "Вы можете запросить доступ, исправление или удаление данных через поддержку. В зависимости от региона на вас могут распространяться дополнительные privacy-права."
              : isDe
                ? "Sie können über den Support Auskunft, Berichtigung oder Löschung Ihrer Daten anfordern. Je nach Region können zusätzliche Datenschutzrechte gelten."
              : "You can request access, correction, or deletion through support. Additional privacy rights may apply depending on your region.",
          ],
        },
      ],
    };
  }

  return {
    title: isRu ? "Условия использования" : isDe ? "Nutzungsbedingungen" : "Terms of Use",
    subtitle: isRu
      ? "Правила использования сервиса PillPath."
      : isDe
        ? "Regeln für die Nutzung des Dienstes PillPath."
      : "Rules for using the PillPath service.",
    updatedAtLabel: isRu ? "Обновлено: 29.04.2026" : isDe ? "Aktualisiert: 29.04.2026" : "Updated: 29.04.2026",
    sections: [
      {
        title: isRu ? "1. О сервисе" : isDe ? "1. Über den Dienst" : "1. About the service",
        paragraphs: [
          isRu
            ? "PillPath — информационный сервис и iPhone-приложение для семейного учета лекарств, наблюдений, напоминаний и задач по уходу."
            : isDe
              ? "PillPath ist ein Informationsdienst und eine iPhone-App zur familiären Verwaltung von Medikamenten, Beobachtungen, Erinnerungen und Pflegeaufgaben."
            : "PillPath is an informational service and iPhone app for family medication tracking, observations, reminders, and care tasks.",
          isRu
            ? "Сервис может включать бесплатные функции и платные возможности по подписке Plus."
            : isDe
              ? "Der Dienst kann kostenlose Funktionen und kostenpflichtige Plus-Abo-Funktionen enthalten."
            : "The service may include free features and paid Plus subscription features.",
        ],
      },
      {
        title: isRu ? "2. Аккаунт и доступ" : isDe ? "2. Konto und Zugriff" : "2. Account and access",
        bullets: isRu
          ? [
              "Вы отвечаете за безопасность своего аккаунта.",
              "Вы обязуетесь указывать достоверные данные и не нарушать права третьих лиц.",
              "Мы можем ограничить доступ при нарушении условий или требований закона.",
            ]
          : isDe
            ? [
                "Sie sind für die Sicherheit Ihres Kontos verantwortlich.",
                "Sie verpflichten sich, korrekte Angaben zu machen und keine Rechte Dritter zu verletzen.",
                "Wir können den Zugriff bei Verstößen gegen die Bedingungen oder gesetzliche Anforderungen einschränken.",
              ]
          : [
              "You are responsible for your account security.",
              "You agree to provide accurate information and not violate third-party rights.",
              "We may limit access for terms violations or legal requirements.",
            ],
      },
      {
        title: isRu ? "3. Разрешенное использование" : isDe ? "3. Zulässige Nutzung" : "3. Permitted use",
        paragraphs: [
          isRu
            ? "Сервис предназначен для личного и семейного использования в законных целях."
            : isDe
              ? "Der Dienst ist für die rechtmäßige persönliche und familiäre Nutzung bestimmt."
            : "The service is intended for lawful personal and family use.",
          isRu
            ? "Запрещены злоупотребления, попытки взлома и публикация чужих персональных данных без оснований."
            : isDe
              ? "Missbrauch, Hacking-Versuche und die Veröffentlichung personenbezogener Daten Dritter ohne rechtliche Grundlage sind verboten."
            : "Abuse, hacking attempts, and publishing third-party personal data without lawful grounds are prohibited.",
        ],
      },
      {
        title: isRu ? "4. Медицинский дисклеймер" : isDe ? "4. Medizinischer Hinweis" : "4. Medical disclaimer",
        paragraphs: [
          isRu
            ? "PillPath не является медицинской организацией и не заменяет консультацию специалиста."
            : isDe
              ? "PillPath ist kein medizinischer Anbieter und ersetzt keine fachliche medizinische Beratung."
            : "PillPath is not a medical provider and does not replace professional medical advice.",
          isRu
            ? "Все решения о лечении пользователь принимает самостоятельно."
            : isDe
              ? "Alle Entscheidungen über die Behandlung trifft der Nutzer selbst."
            : "All treatment decisions are made by the user.",
        ],
      },
      {
        title: isRu ? "5. Подписки и платежи" : isDe ? "5. Abos und Zahlungen" : "5. Subscriptions and payments",
        paragraphs: [
          isRu
            ? "Подписка Plus может оформляться как auto-renewable subscription через App Store."
            : isDe
              ? "Plus kann als automatisch verlängerbares Abo über den App Store angeboten werden."
            : "Plus may be offered as an auto-renewable subscription through the App Store.",
          isRu
            ? "Управление подпиской, отмена и возвраты выполняются через Apple ID / App Store."
            : isDe
              ? "Abo-Verwaltung, Kündigung und Erstattungen erfolgen über Apple ID / App Store."
            : "Subscription management, cancellation, and refunds are handled through Apple ID / the App Store.",
        ],
      },
      {
        title: isRu ? "6. Ответственность и изменения" : isDe ? "6. Haftung und Änderungen" : "6. Liability and updates",
        paragraphs: [
          isRu
            ? "Сервис предоставляется «как есть», без гарантии бесперебойной работы."
            : isDe
              ? "Der Dienst wird „wie besehen“ bereitgestellt, ohne Garantie für einen unterbrechungsfreien Betrieb."
            : "The service is provided “as is”, without a guarantee of uninterrupted operation.",
          isRu
            ? "Мы можем обновлять условия, а новая версия действует с даты публикации в приложении."
            : isDe
              ? "Wir können die Bedingungen aktualisieren; die neue Version gilt ab dem Veröffentlichungsdatum in der App."
            : "We may update the terms, and the new version becomes effective on the publication date in the app.",
        ],
      },
    ],
  };
}
