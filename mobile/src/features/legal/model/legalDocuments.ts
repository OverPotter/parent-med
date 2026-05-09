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

  if (key === "privacy") {
    return {
      title: isRu ? "Политика конфиденциальности" : "Privacy Policy",
      subtitle: isRu
        ? "Как мы обрабатываем и защищаем данные в PillPath."
        : "How we process and protect data in PillPath.",
      updatedAtLabel: isRu ? "Обновлено: 29.04.2026" : "Updated: 29.04.2026",
      sections: [
        {
          title: isRu ? "1. Кто мы" : "1. Who we are",
          paragraphs: [
            isRu
              ? "PillPath — сервис для семейного учёта лекарств, наблюдений, напоминаний и связанных записей по уходу."
              : "PillPath is a service for family medication tracking, observations, reminders, and related care records.",
          ],
        },
        {
          title: isRu ? "2. Какие данные мы собираем" : "2. What data we collect",
          bullets: isRu
            ? [
                "Данные аккаунта и профиля: email, имя в семье, роль, кем вы приходитесь ребёнку, телефон и язык.",
                "Данные семьи: название семьи, участники, роли и коды приглашения.",
                "Данные детей и ухода: профили детей, заметки, аллергии, история болезней, лекарства, сон, кормления, рост и вес.",
                "Данные уведомлений и подписки: push-токены, настройки напоминаний, статус подписки и технические billing-идентификаторы.",
              ]
            : [
                "Account and profile data: email, family display name, role, relationship label, phone, and language.",
                "Family data: family name, members, roles, and invite codes.",
                "Child and care data: child profiles, notes, allergies, illness history, medicines, sleep, feeding, growth, and weight.",
                "Notification and subscription data: push tokens, reminder preferences, subscription status, and technical billing identifiers.",
              ],
        },
        {
          title: isRu ? "3. Как мы используем данные" : "3. How we use data",
          bullets: isRu
            ? [
                "Чтобы создавать и поддерживать ваш аккаунт и семью.",
                "Чтобы хранить и показывать записи по детям и уходу.",
                "Чтобы отправлять напоминания, если вы включили уведомления.",
                "Чтобы поддерживать подписку Plus, стабильность сервиса и внутреннюю продуктовую аналитику.",
              ]
            : [
                "To create and maintain your account and family workspace.",
                "To store and display child and care records.",
                "To send reminders if notifications are enabled.",
                "To support Plus subscriptions, service stability, and internal product analytics.",
              ],
        },
        {
          title: isRu ? "4. Третьи лица и хранение" : "4. Third parties and retention",
          paragraphs: [
            isRu
              ? "Мы не продаём персональные данные. Ограниченный круг подрядчиков может обрабатывать данные для хостинга, push-инфраструктуры, внутренней аналитики и подписок."
              : "We do not sell personal data. A limited set of providers may process data for hosting, push infrastructure, internal analytics, and subscriptions.",
            isRu
              ? "Данные хранятся, пока аккаунт активен и это нужно для работы сервиса. Удаление аккаунта не отменяет автоматически подписку в App Store."
              : "Data is kept while the account is active and needed for the service. Deleting an account does not automatically cancel an App Store subscription.",
          ],
        },
        {
          title: isRu ? "5. Ваши права" : "5. Your rights",
          paragraphs: [
            isRu
              ? "Вы можете запросить доступ, исправление или удаление данных через поддержку. В зависимости от региона на вас могут распространяться дополнительные privacy-права."
              : "You can request access, correction, or deletion through support. Additional privacy rights may apply depending on your region.",
          ],
        },
      ],
    };
  }

  return {
    title: isRu ? "Условия использования" : "Terms of Use",
    subtitle: isRu
      ? "Правила использования сервиса PillPath."
      : "Rules for using the PillPath service.",
    updatedAtLabel: isRu ? "Обновлено: 29.04.2026" : "Updated: 29.04.2026",
    sections: [
      {
        title: isRu ? "1. О сервисе" : "1. About the service",
        paragraphs: [
          isRu
            ? "PillPath — информационный сервис и iPhone-приложение для семейного учета лекарств, наблюдений, напоминаний и задач по уходу."
            : "PillPath is an informational service and iPhone app for family medication tracking, observations, reminders, and care tasks.",
          isRu
            ? "Сервис может включать бесплатные функции и платные возможности по подписке Plus."
            : "The service may include free features and paid Plus subscription features.",
        ],
      },
      {
        title: isRu ? "2. Аккаунт и доступ" : "2. Account and access",
        bullets: isRu
          ? [
              "Вы отвечаете за безопасность своего аккаунта.",
              "Вы обязуетесь указывать достоверные данные и не нарушать права третьих лиц.",
              "Мы можем ограничить доступ при нарушении условий или требований закона.",
            ]
          : [
              "You are responsible for your account security.",
              "You agree to provide accurate information and not violate third-party rights.",
              "We may limit access for terms violations or legal requirements.",
            ],
      },
      {
        title: isRu ? "3. Разрешенное использование" : "3. Permitted use",
        paragraphs: [
          isRu
            ? "Сервис предназначен для личного и семейного использования в законных целях."
            : "The service is intended for lawful personal and family use.",
          isRu
            ? "Запрещены злоупотребления, попытки взлома и публикация чужих персональных данных без оснований."
            : "Abuse, hacking attempts, and publishing third-party personal data without lawful grounds are prohibited.",
        ],
      },
      {
        title: isRu ? "4. Медицинский дисклеймер" : "4. Medical disclaimer",
        paragraphs: [
          isRu
            ? "PillPath не является медицинской организацией и не заменяет консультацию специалиста."
            : "PillPath is not a medical provider and does not replace professional medical advice.",
          isRu
            ? "Все решения о лечении пользователь принимает самостоятельно."
            : "All treatment decisions are made by the user.",
        ],
      },
      {
        title: isRu ? "5. Подписки и платежи" : "5. Subscriptions and payments",
        paragraphs: [
          isRu
            ? "Подписка Plus может оформляться как auto-renewable subscription через App Store."
            : "Plus may be offered as an auto-renewable subscription through the App Store.",
          isRu
            ? "Управление подпиской, отмена и возвраты выполняются через Apple ID / App Store."
            : "Subscription management, cancellation, and refunds are handled through Apple ID / the App Store.",
        ],
      },
      {
        title: isRu ? "6. Ответственность и изменения" : "6. Liability and updates",
        paragraphs: [
          isRu
            ? "Сервис предоставляется «как есть», без гарантии бесперебойной работы."
            : "The service is provided “as is”, without a guarantee of uninterrupted operation.",
          isRu
            ? "Мы можем обновлять условия, а новая версия действует с даты публикации в приложении."
            : "We may update the terms, and the new version becomes effective on the publication date in the app.",
        ],
      },
    ],
  };
}
